import { Request, Response } from 'express';
import { db } from '../lib/db';
import { discountCodes, orders } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';

const discountCodeSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  active: z.number().int().min(0).max(1).default(1),
});

export const getDiscountCodes = async (req: Request, res: Response) => {
  try {
    const codes = db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt)).all();
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discount codes' });
  }
};

export const createDiscountCode = async (req: Request, res: Response) => {
  try {
    const payload = discountCodeSchema.parse(req.body);
    db.insert(discountCodes).values(payload).run();
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Failed to create discount code' });
  }
};

export const updateDiscountCode = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const payload = discountCodeSchema.partial().parse(req.body);
    db.update(discountCodes).set(payload).where(eq(discountCodes.id, id)).run();
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Failed to update discount code' });
  }
};

export const deleteDiscountCode = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    db.delete(discountCodes).where(eq(discountCodes.id, id)).run();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete discount code' });
  }
};

export const validateDiscountCode = async (req: Request, res: Response) => {
  const { code, amount } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });

  try {
    const now = new Date().toISOString();
    const discount = db.select().from(discountCodes)
      .where(and(
        eq(discountCodes.code, code.toUpperCase()),
        eq(discountCodes.active, 1)
      ))
      .get();

    if (!discount) return res.status(404).json({ error: 'Invalid or inactive discount code' });

    if (discount.startDate && discount.startDate > now) return res.status(400).json({ error: 'Discount code not yet active' });
    if (discount.endDate && discount.endDate < now) return res.status(400).json({ error: 'Discount code expired' });
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) return res.status(400).json({ error: 'Discount code usage limit reached' });
    if (amount && amount < discount.minOrderAmount) return res.status(400).json({ error: `Minimum order amount of ${discount.minOrderAmount} required` });

    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (amount || 0) * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }

    res.json({ 
      ok: true, 
      discountId: discount.id, 
      type: discount.type, 
      value: discount.value, 
      discountAmount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Validation failed' });
  }
};
