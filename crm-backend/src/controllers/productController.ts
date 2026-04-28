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

    const result = await mammoth.convertToHtml({ path: file.path });
    fs.unlinkSync(file.path);

    const html = result.value;

    // Extract table rows from HTML
    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/);
    if (!tableMatch) {
      return res.status(400).json({ error: 'No table found in the document. Please use a table with columns: Name, Description, Price, Stock, Category' });
    }

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const stripTags = (s: string) => s.replace(/<[^>]*>/g, '').trim();

    const rows: string[][] = [];
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableMatch[0])) !== null) {
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1]!)) !== null) {
        cells.push(stripTags(cellMatch[1]!));
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (rows.length < 2) {
      return res.status(400).json({ error: 'Table must have a header row and at least one data row' });
    }

    // Map header columns (case-insensitive)
    const headers = rows[0]!.map(h => h.toLowerCase().trim());
    const colIndex = {
      name: headers.findIndex(h => h.includes('name') || h.includes('naam')),
      description: headers.findIndex(h => h.includes('description') || h.includes('beschrijving') || h.includes('omschrijving')),
      price: headers.findIndex(h => h.includes('price') || h.includes('prijs')),
      stock: headers.findIndex(h => h.includes('stock') || h.includes('voorraad') || h.includes('aantal')),
      category: headers.findIndex(h => h.includes('category') || h.includes('categorie')),
    };

    if (colIndex.name === -1) {
      return res.status(400).json({ error: 'Could not find a "Name" column in the table header' });
    }
    if (colIndex.price === -1) {
      return res.status(400).json({ error: 'Could not find a "Price" column in the table header' });
    }

    const dataRows = rows.slice(1);
    const created: any[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]!;
      try {
        const name = (row[colIndex.name] ?? '').trim();
        if (!name) { errors.push({ row: i + 2, error: 'Missing name' }); continue; }

        const priceStr = (row[colIndex.price] ?? '').replace(/[^\d.,\-]/g, '').replace(',', '.').trim();
        const price = parseFloat(priceStr || '0');
        if (isNaN(price) || price < 0) { errors.push({ row: i + 2, error: `Invalid price: ${row[colIndex.price]}` }); continue; }

        const stockStr = colIndex.stock !== -1 ? (row[colIndex.stock] ?? '').replace(/[^\d]/g, '').trim() : '0';
        const stock = parseInt(stockStr || '0', 10);

        const description = colIndex.description !== -1 ? ((row[colIndex.description] ?? '').trim() || null) : null;
        const category = colIndex.category !== -1 ? ((row[colIndex.category] ?? '').trim() || null) : null;

        const product = await productsRepo.createProduct({ name, description, price, stock, category });
        created.push(product);
      } catch (err: any) {
        errors.push({ row: i + 2, error: err.message || 'Unknown error' });
      }
    }

    res.json({
      imported: created.length,
      total: dataRows.length,
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
