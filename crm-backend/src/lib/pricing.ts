import { db } from './db';
import { productPriceTiers, products, users } from '../db/schema';
import { and, desc, eq, lte } from 'drizzle-orm';
import { getVolumeDiscountConfig, volumePercentFor } from './volumeDiscount';

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

export type PriceBreakdown = {
  unitPrice: number;        // wat de klant betaalt per stuk (excl. btw)
  listPrice: number;        // prijs per stuk vóór staffelkorting (na eventuele klantgroep-korting)
  volumePercent: number;    // toegepaste staffelkorting in %
  volumeMinQty: number;     // vanaf hoeveel stuks die geldt
};

// Staffelkorting geldt per product en niet bovenop een eigen staffelprijs van dat product;
// klantgroep-korting blijft gewoon gelden.
export async function getPriceBreakdown(productId: string, quantity: number, discountPercent: number): Promise<PriceBreakdown> {
  const pResult = await db.select().from(products).where(eq(products.id, productId));
  const p = pResult[0];
  if (!p) throw new Error('Product not found');
  const tierPrice = await getTierUnitPrice(productId, quantity);
  const base = tierPrice ?? Number(p.price);
  const listPrice = applyDiscount(base, discountPercent);
  if (tierPrice !== null) return { unitPrice: listPrice, listPrice, volumePercent: 0, volumeMinQty: 0 };
  const vol = volumePercentFor(await getVolumeDiscountConfig(), quantity);
  const unitPrice = vol.percent > 0 ? applyDiscount(listPrice, vol.percent) : listPrice;
  return { unitPrice, listPrice, volumePercent: vol.percent, volumeMinQty: vol.minQty };
}

export async function getEffectiveUnitPrice(productId: string, quantity: number, discountPercent: number): Promise<number> {
  return (await getPriceBreakdown(productId, quantity, discountPercent)).unitPrice;
}
