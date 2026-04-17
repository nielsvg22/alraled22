import { Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/db';
import { rmas, rmaItems, orderItems, orders } from '../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';

const createRmaSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(1).max(200),
  message: z.string().max(2000).optional().default(''),
  items: z.array(z.object({
    orderItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
});

const updateRmaSchema = z.object({
  status: z.enum(['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'CLOSED']).optional(),
  adminNote: z.string().max(2000).optional(),
});

function getRmaWithRelations(id: string) {
  return db.query.rmas.findFirst({
    where: eq(rmas.id, id),
    with: {
      user: { columns: { id: true, name: true, email: true } },
      order: { columns: { id: true, createdAt: true, status: true, total: true } },
      items: { with: { orderItem: { with: { product: true } } } },
    },
  }).sync();
}

export const createRma = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const payload = createRmaSchema.parse(req.body);

    const order = db.select().from(orders).where(and(eq(orders.id, payload.orderId), eq(orders.userId, userId))).get();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const orderItemIds = payload.items.map((i) => i.orderItemId);
    const foundItems = db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, payload.orderId), inArray(orderItems.id, orderItemIds)),
      with: { product: true },
    }).sync();

    if (foundItems.length !== payload.items.length) {
      return res.status(400).json({ error: 'Invalid items' });
    }

    const requestedById = new Map(payload.items.map((i) => [i.orderItemId, i.quantity]));
    for (const item of foundItems) {
      const qty = requestedById.get(item.id);
      if (!qty || qty <= 0 || qty > item.quantity) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }
    }

    const created = db.transaction((tx) => {
      const createdRma = tx.insert(rmas).values({
        orderId: payload.orderId,
        userId,
        reason: payload.reason,
        message: payload.message || '',
      }).returning().get();

      tx.insert(rmaItems).values(
        payload.items.map((i) => ({
          rmaId: createdRma.id,
          orderItemId: i.orderItemId,
          quantity: i.quantity,
        }))
      ).run();

      return createdRma;
    });

    const full = getRmaWithRelations(created.id);
    res.status(201).json(full);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRmas = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const isAdmin = role === 'ADMIN';

    const list = db.query.rmas.findMany({
      where: isAdmin ? undefined : eq(rmas.userId, userId),
      with: {
        user: { columns: { id: true, name: true, email: true } },
        order: { columns: { id: true, createdAt: true, status: true, total: true } },
        items: { with: { orderItem: { with: { product: true } } } },
      },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    }).sync();

    res.json(list);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRmaById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = req.params.id as string;
    const rma = getRmaWithRelations(id);
    if (!rma) return res.status(404).json({ error: 'Not found' });

    const isOwner = rma.userId === userId;
    const isAdmin = role === 'ADMIN';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    res.json(rma);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRma = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const id = req.params.id as string;
    const patch = updateRmaSchema.parse(req.body);

    const existing = db.select().from(rmas).where(eq(rmas.id, id)).get();
    if (!existing) return res.status(404).json({ error: 'Not found' });

    db.update(rmas).set({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.adminNote !== undefined ? { adminNote: patch.adminNote } : {}),
      updatedAt: new Date().toISOString(),
    }).where(eq(rmas.id, id)).run();

    const updated = getRmaWithRelations(id);
    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};
