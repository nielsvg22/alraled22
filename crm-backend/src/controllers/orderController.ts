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

function getOrderWithRelations(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      items: { with: { product: true } },
    },
  }).sync();
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
    const foundProducts = db.select().from(products).where(inArray(products.id, productIds)).all();

    if (foundProducts.length !== items.length) {
      return res.status(400).json({ error: 'Some products not found' });
    }

    const pricing = getPricingContextForUser(userId);
    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const product = foundProducts.find((p) => p.id === item.productId);
      if (!product) throw new Error('Product not found');
      if (product.stock < item.quantity) throw new Error(`Insufficient stock for product ${product.name}`);
      const unitPrice = getEffectiveUnitPrice(item.productId, item.quantity, pricing.discountPercent);
      subtotal += unitPrice * item.quantity;
      return { productId: item.productId, quantity: item.quantity, price: unitPrice };
    });

    let discountAmount = 0;
    if (discountCodeId) {
      const discount = db.select().from(discountCodes).where(eq(discountCodes.id, discountCodeId)).get();
      if (discount && discount.active) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = subtotal * (discount.value / 100);
        } else {
          discountAmount = discount.value;
        }
      }
    }

    const total = Math.max(0, subtotal - discountAmount);

    const newOrder = db.transaction((tx) => {
      const created = tx.insert(orders).values({ 
        userId, 
        total, 
        discountCodeId, 
        discountAmount 
      }).returning().get();
      
      tx.insert(orderItems).values(
        orderItemsData.map((item) => ({ ...item, orderId: created.id }))
      ).run();

      if (discountCodeId) {
        tx.update(discountCodes)
          .set({ usageCount: sql`${discountCodes.usageCount} + 1` })
          .where(eq(discountCodes.id, discountCodeId))
          .run();
      }

      for (const item of items) {
        tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId))
          .run();
      }
      return created;
    });

    const fullOrder = getOrderWithRelations(newOrder.id);
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

    const result = db.query.orders.findMany({
      where: role === 'ADMIN' ? undefined : eq(orders.userId, userId!),
      with: {
        user: { columns: { id: true, name: true, email: true } },
        items: { with: { product: true } },
      },
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    }).sync();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = updateStatusSchema.parse(req.body);

    const currentOrder = db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    }).sync();

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.transaction((tx) => {
      if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
        for (const item of currentOrder.items) {
          if (!item.productId) continue;
          tx.update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId))
            .run();
        }
      }
      tx.update(orders)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(eq(orders.id, id))
        .run();
    });

    const updatedOrder = getOrderWithRelations(id);
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

    const order = getOrderWithRelations(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isOwner = order.userId === userId;
    const isAdmin = role === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const contact = (getContent('contact') || {}) as any;
    const general = (getContent('general') || {}) as any;
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
    const subtotalWithDiscount = total;
    
    const pricing = getPricingContextForUser(order.userId);
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

    const drawTableHeader = (yStart: number) => {
      const rowH = 22;
      doc.roundedRect(left, yStart, right - left, rowH, 10).fill(accent);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('Omschrijving', left + 12, yStart + 6, { width: 290 });
      doc.text('Aantal', left + 310, yStart + 6, { width: 55, align: 'right' });
      doc.text('Prijs', left + 372, yStart + 6, { width: 70, align: 'right' });
      doc.text('Totaal', left + 450, yStart + 6, { width: right - (left + 450) - 12, align: 'right' });
      return yStart + rowH + 10;
    };

    let page = 1;
    let y = drawHeader();
    y = drawPartyBlocks(y);
    y = drawTableHeader(y);

    const maxYBeforeTotals = doc.page.height - doc.page.margins.bottom - 170;
    let rowAlt = false;
    doc.fontSize(10).font('Helvetica').fillColor(text);

    for (const item of order.items || []) {
      const name = item.product?.name || 'Product';
      const qty = Number(item.quantity || 0);
      const unit = Number(item.price || 0);
      const line = unit * qty;

      const nameHeight = doc.heightOfString(name, { width: 290, lineGap: 2 });
      const rowH = Math.max(22, nameHeight + 12);

      if (y + rowH > maxYBeforeTotals) {
        drawFooter(page);
        doc.addPage();
        page += 1;
        y = drawHeader();
        y = drawTableHeader(y + 10);
      }

      if (rowAlt) {
        doc.roundedRect(left, y - 6, right - left, rowH, 10).fill(surface);
      }
      rowAlt = !rowAlt;

      doc.fontSize(10).font('Helvetica').fillColor(text);
      doc.text(name, left + 12, y, { width: 290, lineGap: 2 });
      doc.text(String(qty), left + 310, y, { width: 55, align: 'right' });
      doc.text(formatEuro(unit), left + 372, y, { width: 70, align: 'right' });
      doc.text(formatEuro(line), left + 450, y, { width: right - (left + 450) - 12, align: 'right' });

      y += rowH + 6;
    }

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

    doc.fontSize(9).font('Helvetica').fillColor(muted);
    doc.text('Bedankt voor je bestelling.', left, totalsY + totalsBoxH + 12, { align: 'left' });
    if (vatRate === 0) {
      doc.text('BTW verlegd.', left, totalsY + totalsBoxH + 26, { align: 'left' });
    }
    drawFooter(page);

    doc.end();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
