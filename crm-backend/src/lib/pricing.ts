import { db } from './db';
import { customerGroups, productPriceTiers, products, users } from '../db/schema';
import { and, desc, eq, lte } from 'drizzle-orm';

export type PricingContext = {
  discountPercent: number;
  vatReverseCharge: boolean;
};

export function getPricingContextForUser(userId: string): PricingContext {
  const row = db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { customerGroup: true },
  }).sync();

  const g = (row as any)?.customerGroup;
  return {
    discountPercent: g ? Number(g.discountPercent || 0) : 0,
    vatReverseCharge: !!(g?.vatReverseCharge),
  };
}

export function getTierUnitPrice(productId: string, quantity: number): number | null {
  const tier = db.query.productPriceTiers.findFirst({
    where: and(eq(productPriceTiers.productId, productId), lte(productPriceTiers.minQty, quantity)),
    orderBy: (t, { desc }) => [desc(t.minQty)],
  }).sync();
  return tier ? Number(tier.price) : null;
}

export function applyDiscount(unitPrice: number, discountPercent: number): number {
  const d = Math.max(0, Math.min(100, Number(discountPercent || 0)));
  const v = unitPrice * (1 - d / 100);
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export function getEffectiveUnitPrice(productId: string, quantity: number, discountPercent: number): number {
  const p = db.select().from(products).where(eq(products.id, productId)).get();
  if (!p) throw new Error('Product not found');
  const base = getTierUnitPrice(productId, quantity) ?? Number(p.price);
  return applyDiscount(base, discountPercent);
}

