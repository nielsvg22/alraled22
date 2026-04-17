import { eq, sql, desc, lte, gt, and, or } from 'drizzle-orm';
import { db } from '../lib/db';
import { products } from './schema';

type ProductFilters = {
  search?: string;
  category?: string;
  lowStock?: boolean;
};

type ProductInput = {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  category?: string | null;
};

export async function listProducts(filters: ProductFilters = {}) {
  const conditions = [];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(
        sql`lower(${products.name}) LIKE lower(${pattern})`,
        sql`lower(${products.description}) LIKE lower(${pattern})`,
        sql`lower(${products.category}) LIKE lower(${pattern})`,
      )
    );
  }

  if (filters.category) {
    conditions.push(sql`lower(${products.category}) = lower(${filters.category})`);
  }

  if (filters.lowStock) {
    conditions.push(lte(products.stock, 10));
  }

  return await db.select().from(products)
    .where(conditions.length > 0 ? and(...(conditions as [ReturnType<typeof or>])) : undefined)
    .orderBy(desc(products.createdAt));
}

export async function getProduct(id: string) {
  const result = await db.select().from(products).where(eq(products.id, id));
  return result[0] ?? null;
}

export async function createProduct(input: ProductInput) {
  const id = crypto.randomUUID();
  await db.insert(products).values({
    id,
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    stock: input.stock,
    imageUrl: input.imageUrl ?? null,
    category: input.category ?? null,
  });
  return await getProduct(id);
}

export async function updateProduct(id: string, patch: Partial<ProductInput>) {
  await db.update(products)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.stock !== undefined ? { stock: patch.stock } : {}),
      ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));
  return await getProduct(id);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const existing = await getProduct(id);
  if (!existing) return false;
  await db.delete(products).where(eq(products.id, id));
  return true;
}

export async function getInventorySummary() {
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(products);
  const lowStockResult = await db.select({ count: sql<number>`count(*)` }).from(products).where(and(gt(products.stock, 0), lte(products.stock, 10)));
  const outOfStockResult = await db.select({ count: sql<number>`count(*)` }).from(products).where(lte(products.stock, 0));

  const totalProducts = Number(totalResult[0]?.count ?? 0);
  const lowStockProducts = Number(lowStockResult[0]?.count ?? 0);
  const outOfStockProducts = Number(outOfStockResult[0]?.count ?? 0);

  return {
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    healthyInventoryProducts: Math.max(totalProducts - lowStockProducts - outOfStockProducts, 0),
  };
}
