import { Response } from 'express';
import { db } from '../lib/db';
import { orders, orderItems, products, discountCodes } from '../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { z } from 'zod';
import { sendOrderConfirmation, sendAdminNotification, sendStatusUpdate } from '../lib/emailService';
import PDFDocument from 'pdfkit';
import { getContent } from '../db/contentRepo';
import { getEffectiveUnitPrice, getPricingContextForUser } from '../lib/pricing';

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  discountCodeId: z.string().uuid().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

async function getOrderWithRelations(orderId: string) {
  return await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      items: { with: { product: true } },
    },
  });
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

function safeText(input: unknown): string {
  return typeof input === 'string' ? input : '';
}

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { items, discountCodeId } = orderSchema.parse(req.body);

    const productIds = items.map((item) => item.productId);
    const foundProducts = await db.select().from(products).where(inArray(products.id, productIds));

    if (foundProducts.length !== items.length) {
      return res.status(400).json({ error: 'Some products not found' });
    }

    const pricing = await getPricingContextForUser(userId);
    let subtotal = 0;
    const orderItemsData = await Promise.all(items.map(async (item) => {
      const product = foundProducts.find((p) => p.id === item.productId);
      if (!product) throw new Error('Product not found');
      if (product.stock < item.quantity) throw new Error(`Insufficient stock for product ${product.name}`);
      const unitPrice = await getEffectiveUnitPrice(item.productId, item.quantity, pricing.discountPercent);
      subtotal += unitPrice * item.quantity;
      return { productId: item.productId, quantity: item.quantity, price: unitPrice };
    }));

    let discountAmount = 0;
    if (discountCodeId) {
      const discounts = await db.select().from(discountCodes).where(eq(discountCodes.id, discountCodeId));
      const discount = discounts[0];
      if (discount && discount.active) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = subtotal * (discount.value / 100);
        } else {
          discountAmount = discount.value;
        }
      }
    }

    const total = Math.max(0, subtotal - discountAmount);

    const newOrder = await db.transaction(async (tx) => {
      const orderId = crypto.randomUUID();
      await tx.insert(orders).values({ 
        id: orderId,
        userId, 
        total, 
        discountCodeId, 
        discountAmount 
      });
      
      await tx.insert(orderItems).values(
        orderItemsData.map((item) => ({ 
          id: crypto.randomUUID(),
          ...item, 
          orderId 
        }))
      );

      if (discountCodeId) {
        await tx.update(discountCodes)
          .set({ usageCount: sql`${discountCodes.usageCount} + 1` })
          .where(eq(discountCodes.id, discountCodeId));
      }

      for (const item of items) {
        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
      return { id: orderId };
    });

    const fullOrder = await getOrderWithRelations(newOrder.id);
    res.status(201).json(fullOrder);

    // Send emails async — don't block response
    if (fullOrder) {
      sendOrderConfirmation(fullOrder as any).catch(() => {});
      sendAdminNotification(fullOrder as any).catch(() => {});
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    const result = await db.query.orders.findMany({
      where: role === 'ADMIN' ? undefined : eq(orders.userId, userId!),
      with: {
        user: { columns: { id: true, name: true, email: true } },
        items: { with: { product: true } },
      },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = updateStatusSchema.parse(req.body);

    const currentOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await db.transaction(async (tx) => {
      if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
        for (const item of currentOrder.items) {
          if (!item.productId) continue;
          await tx.update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
      }
      await tx.update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id));
    });

    const updatedOrder = await getOrderWithRelations(id);
    res.json(updatedOrder);

    // Send status update email async
    if (updatedOrder) {
      sendStatusUpdate(updatedOrder as any).catch(() => {});
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderInvoicePdf = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const order = await getOrderWithRelations(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isOwner = order.userId === userId;
    const isAdmin = role === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const contact = (await getContent('contact') || {}) as any;
    const general = (await getContent('general') || {}) as any;
    const companyName = safeText(general?.companyName) || 'ALRA LED';
    const companyAddress = safeText(contact?.address) || safeText(general?.footerAddress) || '';
    const companyEmail = safeText(general?.footerEmail) || safeText(contact?.email) || '';
    const companyPhone = safeText(general?.footerPhone) || safeText(contact?.phone) || '';
    const companyKvk = safeText(contact?.kvkValue) || '';
    const companyVat = safeText(contact?.vatValue) || '';

    const createdDate = new Date(order.createdAt);
    const invoiceDate = createdDate.toLocaleDateString('nl-NL');
    const invoiceNumber = `INV-${createdDate.toISOString().slice(0, 10).replace(/-/g, '')}-${order.id.slice(0, 6).toUpperCase()}`;
    const filename = `factuur-${invoiceNumber}.pdf`;

    const total = Number(order.total || 0);
    const discountAmount = Number(order.discountAmount || 0);
    
    const pricing = await getPricingContextForUser(order.userId);
    const vatRate = pricing.vatReverseCharge ? 0 : 0.21;
    
    const subtotalEx = (total + discountAmount) / (1 + vatRate);
    const discountEx = discountAmount / (1 + vatRate);
    const subtotalAfterDiscountEx = subtotalEx - discountEx;
    const vatAmount = subtotalAfterDiscountEx * vatRate;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const left = doc.page.margins.left;
    const right = pageWidth - doc.page.margins.right;

    const ink = '#0f172a';
    const muted = '#64748b';
    const text = '#334155';
    const border = '#e2e8f0';
    const surface = '#f8fafc';
    const accent = '#0c4684';

    const drawFooter = (page: number) => {
      const y = doc.page.height - doc.page.margins.bottom + 10;
      doc.fontSize(9).font('Helvetica').fillColor(muted);
      const leftText = [companyEmail, companyPhone].filter(Boolean).join(' · ');
      if (leftText) doc.text(leftText, left, y, { align: 'left' });
      doc.text(`Pagina ${page}`, left, y, { align: 'right' });
    };

    const drawHeader = () => {
      const top = doc.page.margins.top;
      const headerY = top - 10;
      doc.roundedRect(left, headerY, right - left, 86, 14).fill(surface);
      doc.roundedRect(left, headerY, 8, 86, 4).fill(accent);

      doc.fontSize(18).font('Helvetica-Bold').fillColor(ink).text(companyName, left + 18, headerY + 16, { width: 290 });
      doc.fontSize(10).font('Helvetica').fillColor(text);
      const companyLines = [companyAddress, companyEmail, companyPhone, companyKvk ? `KvK: ${companyKvk}` : '', companyVat ? `BTW: ${companyVat}` : ''].filter(Boolean);
      doc.text(companyLines.join('\n'), left + 18, headerY + 40, { width: 290, lineGap: 2 });

      const boxW = 220;
      const boxX = right - boxW;
      doc.roundedRect(boxX, headerY + 14, boxW, 58, 12).strokeColor(border).lineWidth(1).stroke();
      doc.fontSize(16).font('Helvetica-Bold').fillColor(ink).text('FACTUUR', boxX + 14, headerY + 20, { width: boxW - 28, align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor(muted);
      doc.text(`Nr: ${invoiceNumber}`, boxX + 14, headerY + 42, { width: boxW - 28, align: 'right' });
      doc.text(`Datum: ${invoiceDate}`, boxX + 14, headerY + 54, { width: boxW - 28, align: 'right' });

      return headerY + 96;
    };

    const drawPartyBlocks = (yStart: number) => {
      const gap = 12;
      const blockW = (right - left - gap) / 2;
      const blockH = 70;

      doc.roundedRect(left, yStart, blockW, blockH, 14).strokeColor(border).lineWidth(1).stroke();
      doc.roundedRect(left + blockW + gap, yStart, blockW, blockH, 14).strokeColor(border).lineWidth(1).stroke();

      doc.fontSize(9).font('Helvetica-Bold').fillColor(muted);
      doc.text('FACTUUR AAN', left + 14, yStart + 12, { width: blockW - 28 });
      doc.text('BESTELLING', left + blockW + gap + 14, yStart + 12, { width: blockW - 28 });

      doc.fontSize(10).font('Helvetica-Bold').fillColor(ink);
      doc.text(order.user?.name || 'Onbekend', left + 14, yStart + 28, { width: blockW - 28 });
      doc.fontSize(10).font('Helvetica').fillColor(text);
      if (order.user?.email) doc.text(order.user.email, left + 14, yStart + 44, { width: blockW - 28 });

      const orderMetaX = left + blockW + gap + 14;
      doc.fontSize(10).font('Helvetica').fillColor(text);
      doc.text(`Order: #${order.id.slice(0, 8).toUpperCase()}`, orderMetaX, yStart + 28, { width: blockW - 28 });
      doc.text(`Status: ${order.status}`, orderMetaX, yStart + 44, { width: blockW - 28 });

      return yStart + blockH + 18;
    };

    let y = drawHeader();
    drawFooter(1);
    y = drawPartyBlocks(y);

    const cols = {
      product: { x: left + 14, w: 280, label: 'Omschrijving' },
      qty: { x: left + 300, w: 60, label: 'Aantal', align: 'center' as const },
      price: { x: left + 370, w: 80, label: 'Prijs p.s.', align: 'right' as const },
      total: { x: left + 460, w: 80, label: 'Totaal', align: 'right' as const }
    };

    doc.fontSize(9).font('Helvetica-Bold').fillColor(muted);
    Object.values(cols).forEach(c => doc.text(c.label, c.x, y, { width: c.w, align: c.align }));
    y += 18;
    doc.moveTo(left + 14, y).lineTo(right - 14, y).strokeColor(border).lineWidth(0.5).stroke();
    y += 12;

    doc.fontSize(10).font('Helvetica').fillColor(text);
    order.items.forEach(item => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      doc.text(item.product?.name || 'Onbekend product', cols.product.x, y, { width: cols.product.w });
      doc.text(String(item.quantity), cols.qty.x, y, { width: cols.qty.w, align: cols.qty.align });
      doc.text(formatEuro(item.price), cols.price.x, y, { width: cols.price.w, align: cols.price.align });
      doc.text(formatEuro(itemTotal), cols.total.x, y, { width: cols.total.w, align: cols.total.align });
      y += 18;
    });

    const totalsBoxW = 250;
    const totalsBoxH = discountAmount > 0 ? 106 : 88;
    const totalsX = right - totalsBoxW;
    const totalsY = Math.max(y + 12, doc.page.height - doc.page.margins.bottom - totalsBoxH - 10);
    doc.roundedRect(totalsX, totalsY, totalsBoxW, totalsBoxH, 14).fill(surface).strokeColor(border).lineWidth(1).stroke();
    doc.fontSize(9).font('Helvetica').fillColor(text);
    
    let currentY = totalsY + 14;
    doc.text('Subtotaal (excl. BTW)', totalsX + 14, currentY, { width: 140 });
    doc.text(formatEuro(subtotalEx), totalsX + 14, currentY, { width: totalsBoxW - 28, align: 'right' });
    
    if (discountAmount > 0) {
      currentY += 18;
      doc.text('Korting', totalsX + 14, currentY, { width: 140 });
      doc.text(`-${formatEuro(discountEx)}`, totalsX + 14, currentY, { width: totalsBoxW - 28, align: 'right' });
    }

    currentY += 18;
    doc.text('BTW (21%)', totalsX + 14, currentY, { width: 140 });
    doc.text(formatEuro(vatAmount), totalsX + 14, currentY, { width: totalsBoxW - 28, align: 'right' });
    
    currentY += 24;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(ink);
    doc.text('Totaal (incl. BTW)', totalsX + 14, currentY, { width: 140 });
    doc.text(formatEuro(total), totalsX + 14, currentY - 2, { width: totalsBoxW - 28, align: 'right' });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
