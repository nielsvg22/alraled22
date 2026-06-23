import { eq, sql, desc, lte, gt, and, or, inArray, asc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../lib/db';
import { productImages, products } from './schema';

type ProductFilters = {
  search?: string;
  category?: string;
  lowStock?: boolean;
};

type ProductImageInput = {
  url: string;
  sortOrder?: number;
};

type ProductInput = {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  category?: string | null;
};

function normalizeImageUrls(imageUrls?: string[] | null, imageUrl?: string | null) {
  const urls = imageUrls !== undefined
    ? (imageUrls ?? [])
    : imageUrl
      ? [imageUrl]
      : [];

  const seen = new Set<string>();
  return urls
    .map((url) => String(url || '').trim())
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

async function getImagesForProducts(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, ProductImageInput[]>();

  const rows = await db.select().from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));

  const byProduct = new Map<string, ProductImageInput[]>();
  for (const row of rows) {
    const existing = byProduct.get(row.productId) || [];
    existing.push({ url: row.url, sortOrder: row.sortOrder });
    byProduct.set(row.productId, existing);
  }
  return byProduct;
}

async function attachImages<T extends { id: string; imageUrl: string | null }>(productRows: T[]) {
  const byProduct = await getImagesForProducts(productRows.map((product) => product.id));
  return productRows.map((product) => {
    const images = byProduct.get(product.id) || (product.imageUrl ? [{ url: product.imageUrl, sortOrder: 0 }] : []);
    return { ...product, images };
  });
}

async function replaceProductImages(productId: string, imageUrls: string[]) {
  await db.delete(productImages).where(eq(productImages.productId, productId));

  if (imageUrls.length === 0) return;

  await db.insert(productImages).values(
    imageUrls.map((url, index) => ({
      productId,
      url,
      sortOrder: index,
    }))
  );
}

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

  const rows = await db.select().from(products)
    .where(conditions.length > 0 ? and(...(conditions as [ReturnType<typeof or>])) : undefined)
    .orderBy(desc(products.createdAt));

  return await attachImages(rows);
}

export async function getProduct(id: string) {
  const result = await db.select().from(products).where(eq(products.id, id));
  const product = result[0] ?? null;
  if (!product) return null;
  const [withImages] = await attachImages([product]);
  return withImages ?? null;
}

export async function createProduct(input: ProductInput) {
  const id = randomUUID();
  const imageUrls = normalizeImageUrls(input.imageUrls, input.imageUrl);
  await db.insert(products).values({
    id,
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    stock: input.stock,
    imageUrl: imageUrls[0] ?? null,
    category: input.category ?? null,
  });
  await replaceProductImages(id, imageUrls);
  return await getProduct(id);
}

export async function updateProduct(id: string, patch: Partial<ProductInput>) {
  const imageUrls = patch.imageUrls !== undefined
    ? normalizeImageUrls(patch.imageUrls, patch.imageUrl)
    : undefined;
  const imageUrl = imageUrls !== undefined
    ? imageUrls[0] ?? null
    : patch.imageUrl !== undefined
      ? patch.imageUrl
      : undefined;

  await db.update(products)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.stock !== undefined ? { stock: patch.stock } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  if (imageUrls !== undefined) {
    await replaceProductImages(id, imageUrls);
  } else if (patch.imageUrl !== undefined) {
    await replaceProductImages(id, normalizeImageUrls(undefined, patch.imageUrl));
  }

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
