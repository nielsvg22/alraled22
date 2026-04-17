import { Request, Response } from 'express';
import { z } from 'zod';
import * as productsRepo from '../db/productsRepo';
import { db } from '../lib/db';
import { productPriceTiers, productRelations, products as productsTable } from '../db/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

const productSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  imageUrl: z.string().trim().url().optional().nullable().or(z.literal('')),
  category: z.string().trim().optional().nullable(),
});

const listProductsSchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  lowStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

function normalizeOptionalString(value?: string | null) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const getProducts = async (req: Request, res: Response) => {
  try {
    const filters = listProductsSchema.parse(req.query);
    const products = await productsRepo.listProducts({
      search: filters.search,
      category: filters.category,
      lowStock: filters.lowStock,
    });
    res.json(products);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await productsRepo.getProduct(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const validatedData = productSchema.parse(req.body);
    const product = await productsRepo.createProduct({
      name: validatedData.name,
      description: normalizeOptionalString(validatedData.description),
      price: validatedData.price,
      stock: validatedData.stock,
      imageUrl: normalizeOptionalString(validatedData.imageUrl),
      category: normalizeOptionalString(validatedData.category),
    });
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validatedData = productSchema.partial().parse(req.body);
    const product = await productsRepo.updateProduct(id, {
      ...(validatedData.name !== undefined ? { name: validatedData.name } : {}),
      ...(validatedData.description !== undefined
        ? { description: normalizeOptionalString(validatedData.description) }
        : {}),
      ...(validatedData.price !== undefined ? { price: validatedData.price } : {}),
      ...(validatedData.stock !== undefined ? { stock: validatedData.stock } : {}),
      ...(validatedData.imageUrl !== undefined
        ? { imageUrl: normalizeOptionalString(validatedData.imageUrl) }
        : {}),
      ...(validatedData.category !== undefined
        ? { category: normalizeOptionalString(validatedData.category) }
        : {}),
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ok = await productsRepo.deleteProduct(id);
    if (!ok) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductRelations = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await productsRepo.getProduct(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const all = await productsRepo.listProducts({ category: undefined, search: undefined, lowStock: false });
    
    // Check for explicit relations
    const explicit = await db.select({
      id: productRelations.id,
      relatedProduct: productsTable
    })
    .from(productRelations)
    .innerJoin(productsTable, eq(productRelations.relatedProductId, productsTable.id))
    .where(eq(productRelations.productId, id));

    const sameCategory = all.filter(p => p.id !== product.id && (!!product.category ? p.category === product.category : true));
    const shuffled = [...sameCategory].sort(() => Math.random() - 0.5);
    
    // Mix explicit with automatic recommendations
    const fbt = explicit.length > 0 ? explicit.slice(0, 3).map(r => r.relatedProduct) : shuffled.slice(0, 3);
    const alternatives = shuffled.slice(3, 7);

    // Simple demo bundle: current + first accessory if exists, else first two from same category
    const accessories = all.filter(p => p.category && String(p.category).toLowerCase().includes('access'));
    const bundleItems = (accessories.length
      ? [product, accessories[0]]
      : [product, ...sameCategory.slice(0, 1)]
    ).filter(Boolean) as Array<{ id: string; name: string; price: number; imageUrl: string | null }>;
    const bundle = {
      title: 'Aanbevolen set',
      items: bundleItems.map(p => ({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl })),
      total: bundleItems.reduce((sum, p) => sum + Number(p.price || 0), 0),
    };

    res.json({ fbt, alternatives, bundle, explicit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addProductRelation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { relatedProductId, type = 'RELATED' } = req.body;
    if (!relatedProductId) return res.status(400).json({ error: 'Related Product ID required' });

    await db.insert(productRelations).values({
      productId: id,
      relatedProductId,
      type
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProductRelation = async (req: Request, res: Response) => {
  try {
    const relationId = req.params.relationId as string;
    await db.delete(productRelations).where(eq(productRelations.id, relationId));
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const priceTierSchema = z.array(z.object({
  minQty: z.coerce.number().int().min(1),
  price: z.coerce.number().nonnegative(),
})).min(1);

export const getProductPriceTiers = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tiers = await db.query.productPriceTiers.findMany({
      where: eq(productPriceTiers.productId, id),
      orderBy: (t, { asc }) => [asc(t.minQty)],
    });
    res.json(tiers);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setProductPriceTiers = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tiers = priceTierSchema.parse(req.body);
    
    await db.transaction(async (tx) => {
      await tx.delete(productPriceTiers).where(eq(productPriceTiers.productId, id));
      if (tiers.length > 0) {
        await tx.insert(productPriceTiers).values(
          tiers.map((t) => ({ productId: id, minQty: t.minQty, price: t.price }))
        );
      }
    });

    const updated = await db.query.productPriceTiers.findMany({
      where: eq(productPriceTiers.productId, id),
      orderBy: (t, { asc }) => [asc(t.minQty)],
    });
    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};
