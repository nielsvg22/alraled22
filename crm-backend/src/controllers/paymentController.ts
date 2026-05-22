import { Response, Request } from 'express';
import { db } from '../lib/db';
import { orders, payments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { z } from 'zod';
import createMollieClient from '@mollie/api-client';

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY || '' });

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(['ideal', 'bancontact', 'creditcard', 'paypal', 'sofort', 'kbc', 'belfius']).optional(),
  redirectUrl: z.string().url(),
});

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId, method, redirectUrl } = createPaymentSchema.parse(req.body);

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { user: true, items: { with: { product: true } } },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.orderId, orderId),
    });

    if (existingPayment?.status === 'PAID') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    const webhookUrl = `${process.env.API_BASE_URL}/api/payments/webhook`;

    const molliePayment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: order.total.toFixed(2),
      },
      description: `Order #${order.id.slice(0, 8)}`,
      redirectUrl: redirectUrl,
      webhookUrl: webhookUrl,
      method: method || undefined,
      metadata: {
        orderId: order.id,
        userId: userId,
      },
    });

    const paymentData = {
      id: crypto.randomUUID(),
      orderId: order.id,
      molliePaymentId: molliePayment.id,
      molliePaymentUrl: molliePayment.getCheckoutUrl(),
      amount: order.total,
      currency: 'EUR',
      method: method || null,
      status: 'OPEN' as const,
      metadata: JSON.stringify({ createdBy: userId }),
    };

    await db.insert(payments).values(paymentData);

    res.json({
      paymentUrl: molliePayment.getCheckoutUrl(),
      paymentId: paymentData.id,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId } = req.params as { orderId: string };

    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, orderId),
      with: { order: true },
    });

    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const id = req.body.id;
    if (!id) return res.status(400).json({ error: 'Missing payment id' });

    const molliePayment = await mollieClient.payments.get(id);
    const metadata = molliePayment.metadata as { orderId?: string };

    if (!metadata?.orderId) {
      return res.status(400).json({ error: 'Missing orderId in metadata' });
    }

    const orderId = metadata.orderId as string;
    const status = (molliePayment.status?.toUpperCase() || 'PENDING') as 'PENDING' | 'OPEN' | 'CANCELLED' | 'EXPIRED' | 'FAILED' | 'PAID';

    await db.update(payments)
      .set({
        status: status,
        method: molliePayment.method || undefined,
        paidAt: status === 'PAID' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(payments.molliePaymentId, id));

    if (status === 'PAID') {
      await db.update(orders)
        .set({ status: 'PROCESSING', updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const getPaymentsForOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { orderId } = req.params as { orderId: string };

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const orderPayments = await db.query.payments.findMany({
      where: eq(payments.orderId, orderId as string),
      orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    });

    res.json(orderPayments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
};

export const getPaymentMethods = async (_req: AuthRequest, res: Response) => {
  try {
    const methods = [
      { id: 'ideal', name: 'iDEAL', description: 'Betaal via je eigen bank' },
      { id: 'bancontact', name: 'Bancontact', description: 'Betaal met Bancontact' },
      { id: 'creditcard', name: 'Creditcard', description: 'Visa, Mastercard, American Express' },
      { id: 'paypal', name: 'PayPal', description: 'Betaal veilig met PayPal' },
      { id: 'sofort', name: 'SOFORT', description: 'Directe bankoverschrijving' },
      { id: 'kbc', name: 'KBC/CBC', description: 'Betaal via KBC of CBC' },
      { id: 'belfius', name: 'Belfius', description: 'Betaal via Belfius' },
    ];

    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
};
