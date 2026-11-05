import { Response } from 'express';
import { db } from '../lib/db';
import { orders, orderItems, products, discountCodes, payments } from '../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { z } from 'zod';
import { sendOrderConfirmation, sendAdminNotification, sendStatusUpdate } from '../lib/emailService';
import { generateQuotePdf, getQuoteDesign } from './quoteController';
import { getContent } from '../db/contentRepo';
import { getEffectiveUnitPrice, getPricingContextForUser } from '../lib/pricing';
import { checkVatNumber, qualifiesForReverseCharge } from '../lib/vat';
import * as usersRepo from '../db/usersRepo';
import nodeCrypto from 'node:crypto';
import createMollieClient, { Payment } from '@mollie/api-client';
import { createShipment, getSendcloudSettings } from '../lib/sendcloud';

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  discountCodeId: z.string().uuid().optional(),
  vatNumber: z.string().max(40).optional(),
  customer: z.object({
    email: z.string().email().max(255),
    name: z.string().max(255).optional(),
    phone: z.string().max(50).optional(),
  }).optional(),
  shipping: z.object({
    name: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    method: z.string().optional(),
    cost: z.number().optional(),
  }).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

// Gastbestellingen hangen aan een technisch gastaccount; mails en weergave gebruiken het echte contactadres van de bestelling.
export const GUEST_EMAIL_DOMAIN = '@gast.alra-led.invalid';
export function withCustomer<T extends { customerEmail?: string | null; shippingName?: string | null; user?: any }>(order: T): T {
  if (!order) return order;
  const guest = String(order.user?.email || '').endsWith(GUEST_EMAIL_DOMAIN);
  if (!order.customerEmail && !guest) return order;
  return { ...order, user: { ...(order.user || {}), email: order.customerEmail || order.user?.email, name: guest ? (order.shippingName || order.user?.name) : order.user?.name } };
}

async function getOrderWithRelations(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      items: { with: { product: true } },
    },
  });
  return order ? withCustomer(order as any) as typeof order : order;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

function safeText(input: unknown): string {
  return typeof input === 'string' ? input : '';
}

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, discountCodeId, shipping, vatNumber, customer } = orderSchema.parse(req.body);

    // Zonder account: bestellen als gast. We maken een los gastaccount (zonder inlogmogelijkheid en zonder klantgroep-korting).
    let userId = req.user?.userId;
    if (!userId) {
      if (!customer?.email) return res.status(400).json({ error: 'Vul een e-mailadres in om te kunnen bestellen.' });
      const guest = await usersRepo.createUser({
        email: `gast-${crypto.randomUUID()}${GUEST_EMAIL_DOMAIN}`,
        name: customer.name || shipping?.name || 'Gast',
        password: nodeCrypto.randomBytes(24).toString('hex'),
        role: 'USER',
      });
      if (!guest) return res.status(500).json({ error: 'Bestelling aanmaken mislukt' });
      userId = guest.id;
    }

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

    // BTW: standaard 21%. Verlegd (0%) bij een klantgroep met verlegging, of een geldig EU-BTW-nummer (VIES, op de server
    // gecontroleerd) bij levering aan een ander EU-land dan Nederland. `total` = het bedrag dat de klant betaalt, incl. BTW.
    let vatReverse = !!pricing.vatReverseCharge;
    let storedVatNumber: string | null = null;
    let storedVatCheck: string | null = null;
    if (vatNumber && vatNumber.trim()) {
      const vat = await checkVatNumber(vatNumber, shipping?.country || 'NL', {
        name: shipping?.company || '', street: shipping?.address || '', postcode: shipping?.postcode || '', city: shipping?.city || '',
      });
      if (qualifiesForReverseCharge(vat, shipping?.country || 'NL')) {
        vatReverse = true;
        storedVatNumber = `${vat.country}${vat.number}`;
        storedVatCheck = `${vat.addressCheck === 'match' ? 'MATCH' : 'UNVERIFIED'}${vat.consultationNumber ? ` ${vat.consultationNumber}` : ''}`;
      } else if (vat.valid && vat.addressCheck === 'mismatch') {
        return res.status(400).json({ error: 'De bedrijfsnaam of het adres komt niet overeen met dit BTW-nummer. Controleer de gegevens of reken af met BTW.' });
      } else if (!vat.valid && vat.unavailable) {
        return res.status(503).json({ error: 'De BTW-controle is tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw of reken af met BTW.' });
      } else if (!vat.valid) {
        return res.status(400).json({ error: 'Dit BTW-nummer is niet geldig. Controleer het nummer of laat het leeg om met BTW af te rekenen.' });
      }
    }
    const exVat = Math.max(0, subtotal - discountAmount + (shipping?.cost || 0));
    const total = Math.round((exVat * (vatReverse ? 1 : 1.21) + Number.EPSILON) * 100) / 100;

    const newOrder = await db.transaction(async (tx) => {
      const orderId = crypto.randomUUID();
      await tx.insert(orders).values({ 
        id: orderId,
        userId, 
        total, 
        discountCodeId: discountCodeId || null, 
        discountAmount,
        shippingName: shipping?.name || null,
        shippingCompany: shipping?.company || null,
        shippingAddress: shipping?.address || null,
        shippingPostcode: shipping?.postcode || null,
        shippingCity: shipping?.city || null,
        shippingCountry: shipping?.country || 'NL',
        shippingPhone: shipping?.phone || null,
        shippingMethod: shipping?.method || null,
        shippingCost: shipping?.cost || 0,
        vatNumber: storedVatNumber,
        vatReverse,
        vatCheck: storedVatCheck,
        customerEmail: customer?.email || null,
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

    // Create Mollie payment
    let paymentUrl;
    try {
      const settings = (await getContent('ai_settings')) as { mollieApiKey?: string } | null;
      const apiKey = settings?.mollieApiKey || process.env.MOLLIE_API_KEY || '';
      if (apiKey) {
        const orderId = newOrder.id;
        const mollieClient = createMollieClient({ apiKey });
        const apiBase = process.env.API_BASE_URL || `${req.protocol}://${req.get('host') || 'localhost:5000'}`;
        const origin = req.get('origin') || req.get('referer') || '';
        let frontendBase = process.env.FRONTEND_URL;
        if (!frontendBase && origin) {
          try { frontendBase = new URL(origin).origin; } catch {}
        }
        frontendBase = frontendBase || 'https://alraled22-production.up.railway.app';
        const webhookUrl = `${apiBase}/api/payments/webhook`;
        const redirectUrl = `${frontendBase}/bestelling-geplaatst/${orderId}`;
        const molliePayment = await mollieClient.payments.create({
          amount: { currency: 'EUR', value: total.toFixed(2) },
          description: `Order #${orderId.slice(0, 8)}`,
          redirectUrl,
          webhookUrl,
          metadata: { orderId, userId },
        });
        const resolved = molliePayment as unknown as Payment;
        paymentUrl = resolved.getCheckoutUrl();

        await db.insert(payments).values({
          id: crypto.randomUUID(),
          orderId,
          molliePaymentId: resolved.id,
          molliePaymentUrl: paymentUrl,
          amount: total,
          currency: 'EUR',
          status: 'OPEN',
          metadata: JSON.stringify({ createdBy: userId }),
        });
      }
    } catch (paymentError) {
      console.error('[order] Failed to create Mollie payment:', paymentError);
    }

    res.status(201).json({ ...fullOrder, paymentUrl });

    // Send emails async — don't block response
    if (fullOrder) {
      sendOrderConfirmation(fullOrder as any).catch(() => {});
      sendAdminNotification(fullOrder as any).catch(() => {});

      // Create SendCloud shipment async
      (async () => {
        try {
          const scSettings = await getSendcloudSettings();
          if (!scSettings.apiKey || !shipping?.address) return;

          const weight = fullOrder.items?.reduce((sum: number, item: any) => sum + (item.quantity * 500), 0) || 500;

          const shipment = await createShipment({
            orderNumber: newOrder.id.slice(0, 8),
            receiverName: shipping?.name || fullOrder.user?.name || '',
            receiverCompany: shipping?.company || '',
            receiverAddress: shipping?.address || '',
            receiverHouseNumber: '',
            receiverCity: shipping?.city || '',
            receiverPostalCode: shipping?.postcode || '',
            receiverCountry: shipping?.country || 'NL',
            receiverPhone: shipping?.phone || '',
            shippingMethod: shipping?.method,
            weight,
            reference: newOrder.id,
          });

          if (shipment?.id) {
            await db.update(orders)
              .set({
                sendcloudShipmentId: String(shipment.id),
                trackingNumber: shipment.tracking_number || null,
                trackingUrl: shipment.tracking_url || null,
              })
              .where(eq(orders.id, newOrder.id));
          }
        } catch (scErr) {
          console.error('[order] Failed to create SendCloud shipment:', scErr);
        }
      })();
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

    res.json(result.map((o) => withCustomer(o as any)));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const id = req.params.id as string;

    const order = await getOrderWithRelations(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== userId && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
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
    const companyKvk = safeText(contact?.kvkValue) || '62609297';
    const companyVat = safeText(contact?.vatValue) || 'NL854885821B01';

    const createdDate = new Date(order.createdAt);
    const invoiceDate = createdDate.toLocaleDateString('nl-NL');
    const invoiceNumber = `INV-${createdDate.toISOString().slice(0, 10).replace(/-/g, '')}-${order.id.slice(0, 6).toUpperCase()}`;
    const filename = `factuur-${invoiceNumber}.pdf`;

    const discountAmount = Number(order.discountAmount || 0);
    const shippingEx = Number((order as any).shippingCost || 0);

    // Bedragen uit de regels zelf (excl. BTW); BTW 21% of verlegd (klantgroep of geldig EU-BTW-nummer)
    const pricing = await getPricingContextForUser(order.userId);
    const vatReverse = !!(order as any).vatReverse || !!pricing.vatReverseCharge;
    const vatRate = vatReverse ? 0 : 0.21;

    const subtotalEx = order.items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
    const discountEx = discountAmount;
    const baseEx = Math.max(0, subtotalEx - discountEx + shippingEx);
    const vatAmount = baseEx * vatRate;
    const total = baseEx + vatAmount;

    // Zelfde ontwerp als de offerte (logo, kleuren, tabel, voettekst), met factuurtitel en -gegevens
    const design = await getQuoteDesign();
    const rate = vatReverse ? 0 : 21;
    const lines = order.items.map(i => ({
      name: i.product?.name || 'Onbekend product',
      qty: Number(i.quantity || 0),
      unit: 'stuk',
      unitPrice: Number(i.price || 0),
      vatRate: rate,
      total: Number(i.price || 0) * Number(i.quantity || 0),
    }));
    if (discountEx > 0) lines.push({ name: 'Korting', qty: 1, unit: '-', unitPrice: -discountEx, vatRate: rate, total: -discountEx });
    if (shippingEx > 0) lines.push({ name: 'Verzendkosten', qty: 1, unit: '-', unitPrice: shippingEx, vatRate: rate, total: shippingEx });

    const o: any = order;
    await generateQuotePdf(res, design, {
      refNr: invoiceNumber,
      date: invoiceDate,
      validUntil: '',
      customer: {
        name: o.user?.name || o.shippingName || 'Onbekend',
        address: o.shippingAddress || undefined,
        postcode: o.shippingPostcode || undefined,
        city: o.shippingCity || undefined,
        email: o.user?.email || undefined,
      },
      lines,
      invoice: {
        docLabel: 'Factuur',
        toLabel: 'Factuur aan',
        filename,
        metaRows: [
          ['Factuurnummer', invoiceNumber],
          ['Factuurdatum', invoiceDate],
          ['Ordernummer', `#${order.id.slice(0, 8).toUpperCase()}`],
        ],
        vatLabel: vatReverse ? 'BTW (verlegd, 0%)' : 'BTW (21%)',
        vatNote: vatReverse ? `BTW verlegd (intracommunautaire levering)${o.vatNumber ? ` — BTW-nr klant: ${o.vatNumber}` : ''}` : undefined,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
