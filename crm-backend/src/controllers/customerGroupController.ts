import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/db';
import { customerGroups } from '../db/schema';
import { eq } from 'drizzle-orm';

const groupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  discountPercent: z.coerce.number().min(0).max(100).optional().default(0),
  vatReverseCharge: z.coerce.number().int().min(0).max(1).optional().default(0),
  netPrices: z.coerce.number().int().min(0).max(1).optional().default(1),
});

export const listCustomerGroups = async (_req: Request, res: Response) => {
  try {
    const rows = db.select().from(customerGroups).all();
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCustomerGroup = async (req: Request, res: Response) => {
  try {
    const data = groupSchema.parse(req.body);
    const created = db.insert(customerGroups).values({
      name: data.name,
      discountPercent: data.discountPercent,
      vatReverseCharge: data.vatReverseCharge,
      netPrices: data.netPrices,
      updatedAt: new Date().toISOString(),
    }).returning().get();
    res.status(201).json(created);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCustomerGroup = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const patch = groupSchema.partial().parse(req.body);
    const existing = db.select().from(customerGroups).where(eq(customerGroups.id, id)).get();
    if (!existing) return res.status(404).json({ error: 'Not found' });

    db.update(customerGroups).set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.discountPercent !== undefined ? { discountPercent: patch.discountPercent } : {}),
      ...(patch.vatReverseCharge !== undefined ? { vatReverseCharge: patch.vatReverseCharge } : {}),
      ...(patch.netPrices !== undefined ? { netPrices: patch.netPrices } : {}),
      updatedAt: new Date().toISOString(),
    }).where(eq(customerGroups.id, id)).run();

    const updated = db.select().from(customerGroups).where(eq(customerGroups.id, id)).get();
    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCustomerGroup = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = db.select().from(customerGroups).where(eq(customerGroups.id, id)).get();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.delete(customerGroups).where(eq(customerGroups.id, id)).run();
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

