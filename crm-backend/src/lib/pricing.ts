import { db } from './db';
import { productPriceTiers, products, users } from '../db/schema';
import { and, desc, eq, lte } from 'drizzle-orm';

export type PricingContext = {
  discountPercent: number;
  vatReverseCharge: boolean;
};

export async function getPricingContextForUser(userId: string): Promise<PricingContext> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { customerGroup: true },
  });

  const g = (row as any)?.customerGroup;
  return {
    discountPercent: g ? Number(g.discountPercent || 0) : 0,
    vatReverseCharge: !!(g?.vatReverseCharge),
  };
}

export async function getTierUnitPrice(productId: string, quantity: number): Promise<number | null> {
  const tier = await db.query.productPriceTiers.findFirst({
    where: and(eq(productPriceTiers.productId, productId), lte(productPriceTiers.minQty, quantity)),
    orderBy: (t, { desc }) => [desc(t.minQty)],
  });
  return tier ? Number(tier.price) : null;
}

export function applyDiscount(unitPrice: number, discountPercent: number): number {
  const d = Math.max(0, Math.min(100, Number(discountPercent || 0)));
  const v = unitPrice * (1 - d / 100);
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export async function getEffectiveUnitPrice(productId: string, quantity: number, discountPercent: number): Promise<number> {
  const pResult = await db.select().from(products).where(eq(products.id, productId));
  const p = pResult[0];
  if (!p) throw new Error('Product not found');
  const tierPrice = await getTierUnitPrice(productId, quantity);
  const base = tierPrice ?? Number(p.price);
  return applyDiscount(base, discountPercent);
}
