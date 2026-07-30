import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { products } from '../db/schema';
import { db } from '../lib/db';
import { inArray } from 'drizzle-orm';
import { quotes, notifications } from '../db/schema';
import { AuthRequest } from '../middleware/authMiddleware';
import { getEffectiveUnitPrice, getPricingContextForUser } from '../lib/pricing';
import { getContent, setContent } from '../db/contentRepo';

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
    generateQuotePdf(res, design, {
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

function generateQuotePdf(res: Response, design: typeof DEFAULT_DESIGN, data: {
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
  // HEADER — Title left, logo badge right
  // ═══════════════════════════════════════════════════════════════
  y = 44;

  // Title
  doc.fontSize(38).font('Helvetica-Bold').fillColor(c.blue);
  doc.text(t.docLabel, mx, y);

  // Logo badge (gold circle)
  const badgeR = 39;
  const badgeX = pageW - mx - badgeR;
  const badgeY = y + 19;
  doc.circle(badgeX, badgeY, badgeR).fill(c.glow);
  // Company initials inside badge
  doc.fontSize(22).font('Helvetica-Bold').fillColor(c.blueDark);
  doc.text(company.name.charAt(0), badgeX - 8, badgeY - 12, { width: 16, align: 'center' });

  y += 70;

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

  // Column positions (percentages matching HTML: 32%, 12%, 14%, 14%, 10%, 18%)
  const c1 = mx;                              // Beschrijving
  const c2 = mx + contentW * 0.32;            // Aantal
  const c3 = mx + contentW * 0.44;            // Grootte
  const c4 = mx + contentW * 0.58;            // Tarief
  const c5 = mx + contentW * 0.72;            // BTW%
  const c6 = mx + contentW * 0.82;            // Totaal

  // Header row
  doc.rect(mx, y, contentW, 26).fill(c.blue);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('Beschrijving', c1 + 10, y + 8, { width: c2 - c1 - 10 });
  doc.text('Aantal', c2, y + 8, { width: c3 - c2, align: 'left' });
  doc.text('Grootte', c3, y + 8, { width: c4 - c3, align: 'left' });
  doc.text('Tarief', c4, y + 8, { width: c5 - c4, align: 'right' });
  doc.text('BTW%', c5, y + 8, { width: c6 - c5, align: 'right' });
  doc.text('Totaal', c6, y + 8, { width: contentW - (c6 - mx) - 10, align: 'right' });
  y += 30;

  // Rows
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line) continue;

    if (idx % 2 === 1) {
      doc.rect(mx, y, contentW, 28).fill(c.surface);
    }

    doc.fontSize(10).font('Helvetica').fillColor(c.ink);
    doc.text(line.name, c1 + 10, y + 9, { width: c2 - c1 - 20 });
    doc.text(String(line.qty), c2, y + 9, { width: c3 - c2 });
    doc.text(line.unit || '-', c3, y + 9, { width: c4 - c3 });

    doc.text(formatEuro(line.unitPrice), c4, y + 9, { width: c5 - c4, align: 'right' });
    doc.text(`${line.vatRate}%`, c5, y + 9, { width: c6 - c5, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(c.blueDark);
    doc.text(formatEuro(line.total), c6, y + 9, { width: contentW - (c6 - mx) - 10, align: 'right' });

    // Bottom line
    doc.moveTo(mx, y + 28).lineTo(pageW - mx, y + 28).lineWidth(0.3).stroke(c.line);
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
      const itemsJson = JSON.stringify(lines.map(l => ({ name: l.name, qty: l.qty, unit: l.unit, total: l.total })));
      await db.insert(quotes).values({
        name: payload.customer.name,
        email: payload.customer.email || '',
        phone: payload.customer.phone,
        company: payload.customer.company,
        message: payload.message,
        items: itemsJson,
        total: lines.reduce((s, l) => s + l.total, 0),
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
    generateQuotePdf(res, design, {
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
