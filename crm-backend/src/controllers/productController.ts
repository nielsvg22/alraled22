import { Request, Response } from 'express';
import { z } from 'zod';
import * as productsRepo from '../db/productsRepo';
import { db } from '../lib/db';
import { productPriceTiers, productRelations, products as productsTable } from '../db/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import OpenAI, { toFile } from 'openai';
import { getContent } from '../db/contentRepo';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const uploadsDir = process.env.UPLOADS_DIR
      ? path.resolve(process.env.UPLOADS_DIR)
      : path.join(process.cwd(), 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });

    // Track images extracted from the docx in order
    const savedImages: string[] = []; // urls like /uploads/uuid.png
    const IMG_PLACEHOLDER = '\n@@IMG@@\n';

    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/tiff': '.tiff',
      'image/svg+xml': '.svg',
    };

    // Convert to HTML, extracting images along the way
    const result = await mammoth.convertToHtml(
      { path: file.path },
      {
        convertImage: mammoth.images.imgElement(async (image: any) => {
          const imgExt = mimeToExt[image.contentType] || '.png';
          const filename = `${randomUUID()}${imgExt}`;
          const imgPath = path.join(uploadsDir, filename);
          const buffer = await image.read();
          fs.writeFileSync(imgPath, buffer);
          const url = `/uploads/${filename}`;
          savedImages.push(url);
          return { src: `@@IMG_${savedImages.length - 1}@@` };
        }),
      },
    );
    fs.unlinkSync(file.path);

    // Strip HTML to plain text but keep image placeholders
    let text = result.value
      .replace(/<img[^>]*src="@@IMG_(\d+)@@"[^>]*>/gi, (_match: string, idx: string) => `${IMG_PLACEHOLDER.replace('@@IMG@@', `@@IMG_${idx}@@`)}`)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#\d+;/g, '')
      .replace(/&[a-z]+;/gi, '');

    // Price line pattern: "€ 295,00 excl. btw"
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

    // Helper: find all image placeholder indices in a text chunk
    const findImages = (chunk: string): string[] => {
      const urls: string[] = [];
      const imgRe = /@@IMG_(\d+)@@/g;
      let im: RegExpExecArray | null;
      while ((im = imgRe.exec(chunk)) !== null) {
        const idx = parseInt(im[1]!, 10);
        if (savedImages[idx]) urls.push(savedImages[idx]!);
      }
      return urls;
    };

    // Split the document into product blocks using the price lines as anchors
    interface ProductBlock { name: string; price: number; description: string; specs: string; imageUrl: string | null }
    const blocks: ProductBlock[] = [];

    for (let i = 0; i < priceHits.length; i++) {
      const hit = priceHits[i]!;

      // --- Full block: from previous price line end (or start) to next price line (or end) ---
      const blockStart = i === 0 ? 0 : (text.indexOf('\n', priceHits[i - 1]!.index) + 1 || priceHits[i - 1]!.index);
      const nextBlockEnd = i + 1 < priceHits.length ? priceHits[i + 1]!.index : text.length;

      // --- Name: last non-empty, non-placeholder line before the price ---
      const beforePrice = text.slice(blockStart, hit.index);
      const nameLines = beforePrice.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('@@IMG_'));
      const name = nameLines[nameLines.length - 1] || '';

      if (!name) continue;

      // --- Images: find in the full block (before + after price) ---
      const fullBlock = text.slice(blockStart, nextBlockEnd);
      const images = findImages(fullBlock);

      // --- Body: everything after the price line until the next block ---
      const afterPriceStart = text.indexOf('\n', hit.index);
      let bodyEnd = nextBlockEnd;
      if (i + 1 < priceHits.length) {
        const textBeforeNext = text.slice(afterPriceStart >= 0 ? afterPriceStart : hit.index, nextBlockEnd);
        const linesBeforeNext = textBeforeNext.split('\n');
        let trimCount = 0;
        for (let j = linesBeforeNext.length - 1; j >= 0; j--) {
          const line = linesBeforeNext[j]!.trim();
          if (line && !line.startsWith('@@IMG_')) { trimCount++; break; }
        }
        bodyEnd = nextBlockEnd - (trimCount > 0 ? (linesBeforeNext[linesBeforeNext.length - 1]?.length ?? 0) + 1 : 0);
      }

      let body = afterPriceStart >= 0 ? text.slice(afterPriceStart, bodyEnd).trim() : '';
      // Remove image placeholders from body text
      body = body.replace(/@@IMG_\d+@@/g, '').replace(/\n{3,}/g, '\n\n').trim();

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

      blocks.push({ name: name.trim(), price: hit.price, description, specs, imageUrl: images[0] || null });
    }

    if (blocks.length === 0) {
      return res.status(400).json({ error: 'Kon geen producten herkennen in het bestand.' });
    }

    const created: any[] = [];
    const errors: { product: string; error: string }[] = [];

    for (const block of blocks) {
      try {
        const fullDesc = [block.description, block.specs].filter(Boolean).join('\n\n') || null;

        const product = await productsRepo.createProduct({
          name: block.name,
          description: fullDesc,
          price: block.price,
          stock: 0,
          imageUrl: block.imageUrl,
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

export const improveImage = async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    // Try to get API key from DB settings first, then fall back to env
    const settingsRaw = await getContent('ai_settings');
    const settings = (settingsRaw || {}) as any;
    const provider = settings?.preferredImageProvider || 'pollinations';
    
    const uploadsDir = process.env.UPLOADS_DIR
      ? path.resolve(process.env.UPLOADS_DIR)
      : path.join(process.cwd(), 'uploads');

    // Read the source image
    let imageBuffer: Buffer;
    let mimeType = 'image/png';

    if (imageUrl.startsWith('/uploads/')) {
      const localPath = path.join(uploadsDir, path.basename(imageUrl));
      if (!fs.existsSync(localPath)) return res.status(404).json({ error: 'Image file not found' });
      imageBuffer = fs.readFileSync(localPath);
      const ext = path.extname(localPath).toLowerCase();
      mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
    } else {
      const response = await fetch(imageUrl);
      if (!response.ok) return res.status(400).json({ error: 'Could not download image' });
      imageBuffer = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') || 'image/png';
    }

    let newFilename = `${randomUUID()}.png`;
    let b64: string | undefined;

    if (provider === 'bridge' && settings.chatgptAccessToken) {
      // Gebruik de ChatGPT Plus Bridge met DALL-E 3 voor image generation
      // Eerst analyseren we de afbeelding met Gemini (als beschikbaar) voor een betere prompt
      
      let description = "Een professionele productfoto van verlichting.";
      
      // Als Gemini beschikbaar is, gebruik die voor de visuele analyse
      const googleKey = settings?.googleApiKey;
      if (googleKey) {
        try {
          const genAI = new GoogleGenerativeAI(googleKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const visionResult = await model.generateContent([
            "Beschrijf deze afbeelding in detail zodat een AI generator een verbeterde versie kan maken. Focus op product, belichting en achtergrond.",
            { inlineData: { data: imageBuffer.toString('base64'), mimeType } }
          ]);
          description = visionResult.response.text();
        } catch (e) {
          console.error('Gemini vision failed for bridge flow:', e);
        }
      }

      // Vraag ChatGPT Plus (DALL-E 3) om een verbeterde versie van de afbeelding
      const imagePrompt = `Ik heb een afbeelding met deze beschrijving: "${description}". 

De gebruiker wil dit aanpassen: "${prompt}".

Genereer een professionele, verbeterde productfoto met DALL-E 3. Behoud het product maar verbeter de kwaliteit, belichting en setting. Maak een fotorealistische studio-opname.`;
      
      const { callBridgeImage } = require('./aiController');
      const imageBase64 = await callBridgeImage(settings.chatgptAccessToken, imagePrompt);

      // Sla de gegenereerde afbeelding op
      const buffer = Buffer.from(imageBase64, 'base64');
      const filename = `${randomUUID()}.png`;
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);
      return res.json({ url: `/uploads/${filename}` });
    }

    if (provider === 'google') {
      const googleKey = settings?.googleApiKey;
      if (!googleKey) return res.status(500).json({ error: 'Google / Nano Banana API Key is niet geconfigureerd in het CRM' });

      const genAI = new GoogleGenerativeAI(googleKey);
      
      // Select model based on Nano Banana settings
      let modelId = 'gemini-1.5-flash';
      if (settings?.nanoBananaModel === 'pro') modelId = 'gemini-1.5-pro';
      else if (settings?.nanoBananaModel === 'thinking') modelId = 'gemini-1.5-pro'; // Pro is better for "thinking"
      
      const model = genAI.getGenerativeModel({ model: modelId });

      // Google Gemini 1.5 can't directly "edit" like OpenAI, 
      // so we use it to analyze and then we would ideally use Imagen.
      // For now, we'll implement a placeholder or a Gemini-based enhancement description if Imagen isn't ready.
      // However, the user asked for "Google Images AI", so let's try to use the Gemini vision-to-image flow if possible.
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType
          }
        },
      ]);
      
      const text = result.response.text();
      // Since Gemini is text-only for output in most cases (without Vertex AI Imagen),
      // we'll return an error or a message explaining that Imagen setup is required for full image-to-image.
      // BUT, we want to be proactive. Let's assume they might want Gemini's analysis.
      
      return res.status(400).json({ 
        error: 'Google Image Editing (Imagen) vereist Vertex AI setup. Gemini kan momenteel alleen afbeeldingen analyseren, niet direct bewerken via deze SDK.' 
      });

    } else if (provider === 'pollinations') {
      // Pollinations.ai (FREE) - We improve the prompt by analyzing the original image first
      // ONLY if a Gemini key is available. If not, we use a generic high-quality product prompt.
      
      let contextualPrompt = `A professional high-quality product photo of ${prompt}, cinematic lighting, 8k resolution, commercial photography style, high detail.`;
      
      const googleKey = settings?.googleApiKey;
      if (googleKey) {
        try {
          const genAI = new GoogleGenerativeAI(googleKey);
          const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          const analysisResult = await visionModel.generateContent([
            "Analyze this image. Give me a 30-word prompt for an AI generator that would RECREATE THIS EXACT IMAGE but with these changes: " + prompt + ". Start with 'A photo of...'",
            {
              inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType
              }
            },
          ]);
          
          const description = analysisResult.response.text().trim();
          contextualPrompt = `${description} --ar 1:1 --v 6.0`;
        } catch (visionErr) {
          console.error('Vision analysis failed:', visionErr);
        }
      } else {
        // NO API KEY CASE: Use a more aggressive "referencing" prompt style for Pollinations
        // We include the existing image URL in the prompt as a hint for the model
        const publicUrl = imageUrl.startsWith('http') ? imageUrl : '';
        contextualPrompt = `[Reference Image: ${publicUrl}] A high-quality professional product modification: ${prompt}. Maintain the product shape and details from the reference, 8k, studio lighting.`;
      }

      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(contextualPrompt);
      const pollinationUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
      
      console.log('Requesting Pollinations AI with prompt:', contextualPrompt.substring(0, 50) + '...');
      
      let response = await fetch(pollinationUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });

      // Fallback to simpler prompt if first attempt fails
      if (!response.ok) {
        console.warn('Primary Pollinations request failed, retrying with simple prompt...');
        const simplePrompt = encodeURIComponent(`Professional studio photo of ${prompt}, high quality`);
        const fallbackUrl = `https://image.pollinations.ai/prompt/${simplePrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;
        response = await fetch(fallbackUrl);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Pollinations Error:', response.status, errorBody);
        return res.status(500).json({ error: `Gratis AI is momenteel druk. Probeer het over een moment opnieuw.` });
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1000) { 
        return res.status(500).json({ error: 'Gratis AI retourneerde een ongeldige afbeelding. Probeer een andere prompt.' });
      }
      b64 = buffer.toString('base64');
    } else {
      // Default to OpenAI
      const apiKey = settings?.openaiApiKey;
      if (!apiKey) return res.status(500).json({ error: 'OpenAI API Key is niet geconfigureerd in het CRM' });

      const openai = new OpenAI({ apiKey });
      const imgFile = await toFile(imageBuffer, 'image.png', { type: mimeType as any });

      const result = await openai.images.edit({
        model: 'gpt-image-1',
        image: imgFile,
        prompt,
        size: '1024x1024',
        response_format: 'b64_json'
      });

      b64 = (result.data?.[0] as any)?.b64_json;
      if (!b64) return res.status(500).json({ error: 'Geen afbeelding geretourneerd door AI' });
    }

    if (b64) {
      const newPath = path.join(uploadsDir, newFilename);
      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(newPath, Buffer.from(b64, 'base64'));

      const newUrlRelative = `/uploads/${newFilename}`;
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const url = `${protocol}://${host}${newUrlRelative}`;
      
      return res.json({ url });
    }
  } catch (error: any) {
    console.error('Improve image error:', error);
    const msg = error?.message || 'Afbeelding verbeteren mislukt';
    res.status(500).json({ error: msg });
  }
};
