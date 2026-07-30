import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { products } from '../db/schema';
import { db } from '../lib/db';
import { inArray, sql } from 'drizzle-orm';
import { quotes, notifications } from '../db/schema';
import { AuthRequest } from '../middleware/authMiddleware';
import { getEffectiveUnitPrice, getPricingContextForUser } from '../lib/pricing';
import { getContent, setContent } from '../db/contentRepo';
import fetch from 'node-fetch';

const quoteSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
  }),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  message: z.string().optional(),
});

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

const DEFAULT_DESIGN = {
  colors: {
    ink: '#1A2233',
    paper: '#FFFFFF',
    surface: '#F6F7FB',
    blue: '#1E40AF',
    blueDark: '#122C7A',
    glow: '#F5A623',
    line: '#E7E9F0',
    muted: '#7A8296',
  },
  company: {
    name: 'ALRA LED Solutions',
    address: 'Dijkgraafweg 4a',
    postcode: '7327 AT Apeldoorn',
    phone: '085-0021 606',
    email: 'info@alra-led.nl',
    website: 'www.alra-led.com',
    logo: 'https://alra-led.com/wp-content/uploads/2024/06/Alra-led-logo-diap.png',
  },
  texts: {
    docLabel: 'Offerte',
    fromLabel: 'Van',
    toLabel: 'Naar',
    itemsLabel: 'Beschrijving',
    qtyLabel: 'Aantal',
    unitPriceLabel: 'Tarief',
    totalLabel: 'Totaal',
    subtotalLabel: 'Bedrag excl. BTW',
    vatLabel: 'BTW',
    grandTotalLabel: 'Totaalbedrag',
    notesLabel: 'Opmerkingen',
    validUntil: '30 dagen',
    signatureLine: 'Handtekening voor akkoord',
    footerDisclaimer: '',
  },
  notes: '',
};

export async function getQuoteDesign(): Promise<typeof DEFAULT_DESIGN> {
  const stored = await getContent('quote_design') as typeof DEFAULT_DESIGN | null;
  if (!stored) return DEFAULT_DESIGN;
  return {
    colors: { ...DEFAULT_DESIGN.colors, ...stored.colors },
    company: { ...DEFAULT_DESIGN.company, ...stored.company },
    texts: { ...DEFAULT_DESIGN.texts, ...stored.texts },
    notes: stored.notes || DEFAULT_DESIGN.notes,
  };
}

export const getDesign = async (req: AuthRequest, res: Response) => {
  try {
    const design = await getQuoteDesign();
    res.json(design);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const saveDesign = async (req: AuthRequest, res: Response) => {
  try {
    await setContent('quote_design', req.body);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const previewDesign = async (req: AuthRequest, res: Response) => {
  try {
    const design = { ...DEFAULT_DESIGN, ...req.body };
    await generateQuotePdf(res, design, {
      refNr: '0000',
      date: new Date().toLocaleDateString('nl-NL'),
      validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString('nl-NL'),
      customer: { name: '', address: '', postcode: '', city: '', email: '' },
      lines: [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

async function generateQuotePdf(res: Response, design: typeof DEFAULT_DESIGN, data: {
  refNr: string;
  date: string;
  validUntil: string;
  customer: { name: string; attention?: string; address?: string; postcode?: string; city?: string; email?: string };
  lines: { name: string; qty: number; unit?: string; unitPrice: number; vatRate: number; total: number }[];
}) {
  const { colors: c, company, texts: t } = design;
  const { refNr, date, validUntil, customer, lines } = data;

  const subtotalExcl = lines.reduce((s, l) => s + l.total, 0);
  const vatAmount = lines.reduce((s, l) => s + (l.total * l.vatRate / 100), 0);
  const totalIncl = subtotalExcl + vatAmount;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="offerte-${refNr}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  doc.pipe(res);

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const mx = 48;
  const contentW = pageW - mx * 2;
  let y = 0;

  // ═══════════════════════════════════════════════════════════════
  // HEADER — Title left, logo right
  // ═══════════════════════════════════════════════════════════════
  y = 44;

  // Title
  doc.fontSize(38).font('Helvetica-Bold').fillColor(c.blue);
  doc.text(t.docLabel, mx, y);

  // Logo (right side)
  const logoSize = 78;
  const logoX = pageW - mx - logoSize;
  const logoY = y;

  if (company.logo) {
    try {
      const protocol = company.logo.startsWith('https') ? 'https' : 'http';
      const logoUrl = company.logo.replace('http://', 'https://');
      const response = await fetch(logoUrl, { timeout: 5000 } as any);
      if (response.ok) {
        const buffer = await response.buffer();
        doc.image(buffer, logoX, logoY, { width: logoSize, height: logoSize });
      } else {
        throw new Error('Logo fetch failed');
      }
    } catch {
      // Fallback: gold circle with initial
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).fill(c.glow);
      doc.fontSize(28).font('Helvetica-Bold').fillColor(c.blueDark);
      doc.text(company.name.charAt(0), logoX + 24, logoY + 24, { width: 30, align: 'center' });
    }
  } else {
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).fill(c.glow);
    doc.fontSize(28).font('Helvetica-Bold').fillColor(c.blueDark);
    doc.text(company.name.charAt(0), logoX + 24, logoY + 24, { width: 30, align: 'center' });
  }

  y += 90;

  // ═══════════════════════════════════════════════════════════════
  // TOP GRID — From left, Meta right
  // ═══════════════════════════════════════════════════════════════
  y += 10;
  const metaW = 220;
  const fromW = contentW - metaW - 24;

  // From (left)
  doc.fontSize(13).font('Helvetica-Bold').fillColor(c.ink);
  doc.text(company.name, mx, y, { width: fromW });
  y += 18;
  doc.fontSize(10).font('Helvetica').fillColor(c.ink);
  doc.text(company.address, mx, y, { width: fromW });
  y += 14;
  doc.text(company.postcode, mx, y, { width: fromW });
  y += 14;
  doc.text(`Telefoon: ${company.phone}`, mx, y, { width: fromW });

  // Meta (right)
  const metaX = pageW - mx - metaW;
  let metaY = y - 32;

  const drawMetaRow = (label: string, value: string, bold = false) => {
    doc.fontSize(10).font('Helvetica').fillColor(c.muted);
    doc.text(label, metaX, metaY, { width: 120 });
    if (bold) {
      doc.fontSize(10).font('Helvetica-Bold').fillColor(c.blue);
    } else {
      doc.fontSize(10).font('Helvetica').fillColor(c.ink);
    }
    doc.text(value, metaX + 120, metaY, { width: metaW - 120, align: 'right' });
    metaY += 18;
  };

  drawMetaRow('Offertedatum', date);
  drawMetaRow('Offertenummer', refNr);
  drawMetaRow('VERVALDATUM:', validUntil, true);

  y += 30;

  // ═══════════════════════════════════════════════════════════════
  // TO
  // ═══════════════════════════════════════════════════════════════
  y += 24;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(c.ink);
  doc.text('Naar', mx, y);
  y += 18;
  doc.fontSize(10).font('Helvetica').fillColor(c.ink);
  const custLines = [
    customer.name,
    customer.attention ? `t.a.v. ${customer.attention}` : null,
    customer.address || null,
    [customer.postcode, customer.city].filter(Boolean).join(' ') || null,
  ].filter((l): l is string => l !== null && l !== '');
  for (const cl of custLines) {
    doc.text(cl, mx, y, { width: contentW });
    y += 14;
  }

  // ═══════════════════════════════════════════════════════════════
  // TABLE
  // ═══════════════════════════════════════════════════════════════
  y += 20;

  // Column positions — fixed widths for perfect alignment
  const colW = contentW;
  const c1 = mx;                          // Beschrijving (40%)
  const w1 = colW * 0.40;
  const c2 = c1 + w1;                     // Aantal (10%)
  const w2 = colW * 0.10;
  const c3 = c2 + w2;                     // Grootte (12%)
  const w3 = colW * 0.12;
  const c4 = c3 + w3;                     // Tarief (14%)
  const w4 = colW * 0.14;
  const c5 = c4 + w4;                     // BTW% (10%)
  const w5 = colW * 0.10;
  const c6 = c5 + w5;                     // Totaal (14%)
  const w6 = colW * 0.14;

  // Header row
  doc.rect(mx, y, colW, 26).fill(c.blue);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('Beschrijving', c1 + 10, y + 8, { width: w1 - 14 });
  doc.text('Aantal', c2 + 4, y + 8, { width: w2 - 8, align: 'center' });
  doc.text('Grootte', c3 + 4, y + 8, { width: w3 - 8, align: 'center' });
  doc.text('Tarief', c4 + 4, y + 8, { width: w4 - 8, align: 'right' });
  doc.text('BTW%', c5 + 4, y + 8, { width: w5 - 8, align: 'right' });
  doc.text('Totaal', c6 + 2, y + 8, { width: w6 - 4, align: 'right' });
  y += 30;

  // Rows
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line) continue;

    if (idx % 2 === 1) {
      doc.rect(mx, y, colW, 28).fill(c.surface);
    }

    doc.fontSize(10).font('Helvetica').fillColor(c.ink);
    doc.text(line.name, c1 + 10, y + 9, { width: w1 - 14 });
    doc.text(String(line.qty), c2 + 4, y + 9, { width: w2 - 8, align: 'center' });
    doc.text(line.unit || '-', c3 + 4, y + 9, { width: w3 - 8, align: 'center' });
    doc.text(formatEuro(line.unitPrice), c4 + 4, y + 9, { width: w4 - 8, align: 'right' });
    doc.text(`${line.vatRate}%`, c5 + 4, y + 9, { width: w5 - 8, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(c.blueDark);
    doc.text(formatEuro(line.total), c6 + 2, y + 9, { width: w6 - 4, align: 'right' });

    // Bottom line
    doc.moveTo(mx, y + 28).lineTo(mx + colW, y + 28).lineWidth(0.3).stroke(c.line);
    y += 32;
  }

  // ═══════════════════════════════════════════════════════════════
  // TOTALS (right-aligned)
  // ═══════════════════════════════════════════════════════════════
  y += 12;
  const totW = 290;
  const totX = pageW - mx - totW;

  // Excl BTW
  doc.fontSize(10).font('Helvetica').fillColor(c.ink);
  doc.text('Bedrag excl. BTW', totX, y, { width: 180 });
  doc.text(formatEuro(subtotalExcl), totX, y, { width: totW, align: 'right' });
  y += 22;

  // BTW
  doc.text('BTW', totX, y, { width: 180 });
  doc.text(formatEuro(vatAmount), totX, y, { width: totW, align: 'right' });
  y += 28;

  // Grand total (blue background, white text)
  doc.rect(totX, y, totW, 34).fill(c.blue);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('Totaalbedrag', totX + 14, y + 10, { width: 180 });
  doc.text(formatEuro(totalIncl), totX + 14, y + 10, { width: totW - 28, align: 'right' });

  // ═══════════════════════════════════════════════════════════════
  // FOOTER (3 columns)
  // ═══════════════════════════════════════════════════════════════
  const footerY = pageH - 100;

  // Top border
  doc.moveTo(mx, footerY).lineTo(pageW - mx, footerY).lineWidth(0.5).stroke(c.line);

  const footColW = (contentW - 40) / 3;

  // Col 1: Ondernemingsgegevens
  let fy = footerY + 14;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.blue);
  doc.text('Ondernemingsgegevens', mx, fy, { width: footColW });
  fy += 16;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.ink);
  doc.text(company.name, mx, fy, { width: footColW });
  fy += 14;
  doc.fontSize(8).font('Helvetica').fillColor(c.muted);
  doc.text(company.address, mx, fy, { width: footColW });
  fy += 12;
  doc.text(company.postcode, mx, fy, { width: footColW });

  // Col 2: Contact informatie
  fy = footerY + 14;
  const col2X = mx + footColW + 20;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.blue);
  doc.text('Contact informatie', col2X, fy, { width: footColW });
  fy += 16;
  doc.fontSize(8).font('Helvetica').fillColor(c.muted);
  doc.text(`Telefoon: ${company.phone}`, col2X, fy, { width: footColW });
  fy += 12;
  doc.text(`E-mail: ${company.email}`, col2X, fy, { width: footColW });
  fy += 12;
  doc.text(company.website, col2X, fy, { width: footColW });

  // Col 3: Betalingsgegevens
  fy = footerY + 14;
  const col3X = mx + (footColW + 20) * 2;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.blue);
  doc.text('Betalingsgegevens', col3X, fy, { width: footColW });
  fy += 16;
  doc.fontSize(8).font('Helvetica').fillColor(c.muted);
  doc.text('Bank: NL00 BANK 0000 0000 00', col3X, fy, { width: footColW });
  fy += 12;
  doc.text('BIC: BANKNL2A', col3X, fy, { width: footColW });
  fy += 12;
  doc.text('BTW: NL000000000B01', col3X, fy, { width: footColW });

  doc.end();
}

export const createQuotePdf = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const payload = quoteSchema.parse(req.body);
    const ids = payload.items.map(i => i.productId);
    const prods = await db.select().from(products).where(inArray(products.id, ids));

    const qtyMap = new Map(payload.items.map(i => [i.productId, i.quantity]));
    const pricing = userId
      ? await getPricingContextForUser(userId)
      : { discountPercent: 0, vatReverseCharge: false };
    const lines = await Promise.all(prods.map(async (p) => {
      const q = qtyMap.get(p.id) || 1;
      const unit = await getEffectiveUnitPrice(p.id, q, pricing.discountPercent);
      return { name: p.name, qty: q, unit: 'Stuk', unitPrice: unit, vatRate: 21, total: q * unit };
    }));

  try {
    const itemsJson = JSON.stringify(lines.map(l => ({ name: l.name, qty: l.qty, unit: l.unit, unitPrice: l.unitPrice, vatRate: l.vatRate, total: l.total })));
    const subtotalExcl = lines.reduce((s, l) => s + l.total, 0);
    const vatAmount = lines.reduce((s, l) => s + (l.total * l.vatRate / 100), 0);
    const totalIncl = subtotalExcl + vatAmount;

    const year = new Date().getFullYear();
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(quotes);
    const count = (countResult?.count || 0) + 1;
    const quoteNumber = `${year}-${String(count).padStart(4, '0')}`;

    await db.insert(quotes).values({
      quoteNumber,
      name: payload.customer.name,
      email: payload.customer.email || '',
      phone: payload.customer.phone,
      company: payload.customer.company,
      address: payload.customer.address,
      postcode: payload.customer.postcode,
      city: payload.customer.city,
      message: payload.message,
      items: itemsJson,
      subtotal: subtotalExcl,
      vat: vatAmount,
      total: totalIncl,
    });

      await db.insert(notifications).values({
        type: 'quote',
        title: 'Nieuwe offerte aangevraagd',
        message: `${payload.customer.name}${payload.customer.company ? ` (${payload.customer.company})` : ''} heeft een offerte aangevraagd.`,
        link: '/quotes',
      });
    } catch (dbErr) {
      console.error('Failed to save quote to database:', dbErr);
    }

    const design = await getQuoteDesign();
    const refNr = `ALR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    await generateQuotePdf(res, design, {
      refNr,
      date: new Date().toLocaleDateString('nl-NL'),
      validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString('nl-NL'),
      customer: {
        name: payload.customer.name,
        address: payload.customer.address,
        email: payload.customer.email,
      },
      lines,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};
