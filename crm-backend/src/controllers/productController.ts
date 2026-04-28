import { Request, Response } from 'express';
import { z } from 'zod';
import * as productsRepo from '../db/productsRepo';
import { db } from '../lib/db';
import { productPriceTiers, productRelations, products as productsTable } from '../db/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import mammoth from 'mammoth';
import fs from 'fs';

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

export const importProducts = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = file.originalname.toLowerCase();
    if (!ext.endsWith('.docx')) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Only .docx files are supported' });
    }

    const result = await mammoth.extractRawText({ path: file.path });
    fs.unlinkSync(file.path);

    const text = result.value;

    // Price line pattern: "€ 295,00 excl. btw" (with optional incl. btw part)
    const priceLineRe = /€\s*([\d.,]+)\s*excl\.\s*btw/gi;

    // Find all price-line positions
    const priceHits: { index: number; price: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = priceLineRe.exec(text)) !== null) {
      const raw = m[1]!.replace(/\./g, '').replace(',', '.');
      const price = parseFloat(raw);
      if (!isNaN(price)) priceHits.push({ index: m.index, price });
    }

    if (priceHits.length === 0) {
      return res.status(400).json({
        error: 'Geen producten gevonden. Zorg dat elke productprijs in het formaat "€ XX,XX excl. btw" staat.',
      });
    }

    // Split the document into product blocks using the price lines as anchors
    interface ProductBlock { name: string; price: number; description: string; specs: string }
    const blocks: ProductBlock[] = [];

    for (let i = 0; i < priceHits.length; i++) {
      const hit = priceHits[i]!;

      // --- Name: text between previous product's price line end and this price line ---
      const blockStart = i === 0 ? 0 : (text.indexOf('\n', priceHits[i - 1]!.index) + 1 || priceHits[i - 1]!.index);
      const beforePrice = text.slice(blockStart, hit.index);
      // Take non-empty lines before the price as the product name
      const nameLines = beforePrice.split('\n').map(l => l.trim()).filter(Boolean);
      const name = nameLines[nameLines.length - 1] || '';  // last non-empty line closest to price

      if (!name) continue;

      // --- Body: everything after the price line until the next product ---
      const afterPriceStart = text.indexOf('\n', hit.index);
      const nextBlockEnd = i + 1 < priceHits.length ? priceHits[i + 1]!.index : text.length;
      // Find where the NEXT product's name starts (go backwards from next price to find its name)
      let bodyEnd = nextBlockEnd;
      if (i + 1 < priceHits.length) {
        const textBeforeNext = text.slice(afterPriceStart, nextBlockEnd);
        const linesBeforeNext = textBeforeNext.split('\n');
        // Remove trailing non-empty lines that belong to the next product name
        let trimCount = 0;
        for (let j = linesBeforeNext.length - 1; j >= 0; j--) {
          if (linesBeforeNext[j]!.trim()) { trimCount++; break; }
        }
        bodyEnd = nextBlockEnd - (trimCount > 0 ? (linesBeforeNext[linesBeforeNext.length - 1]?.length ?? 0) + 1 : 0);
      }

      const body = afterPriceStart >= 0 ? text.slice(afterPriceStart, bodyEnd).trim() : '';

      // Split body into description and specifications
      const specIdx = body.search(/Specificaties\s*\n/i);
      let description = '';
      let specs = '';
      if (specIdx !== -1) {
        description = body.slice(0, specIdx).trim();
        specs = body.slice(specIdx).trim();
      } else {
        description = body;
      }

      blocks.push({ name: name.trim(), price: hit.price, description, specs });
    }

    if (blocks.length === 0) {
      return res.status(400).json({ error: 'Kon geen producten herkennen in het bestand.' });
    }

    const created: any[] = [];
    const errors: { product: string; error: string }[] = [];

    for (const block of blocks) {
      try {
        // Combine description + specs into one description field
        const fullDesc = [block.description, block.specs].filter(Boolean).join('\n\n') || null;

        const product = await productsRepo.createProduct({
          name: block.name,
          description: fullDesc,
          price: block.price,
          stock: 0,
          category: null,
        });
        created.push(product);
      } catch (err: any) {
        errors.push({ product: block.name, error: err.message || 'Unknown error' });
      }
    }

    res.json({
      imported: created.length,
      total: blocks.length,
      errors: errors.length > 0 ? errors : undefined,
      products: created,
    });
  } catch (error: any) {
    console.error('Import products error:', error);
    res.status(500).json({ error: 'Failed to import products' });
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
