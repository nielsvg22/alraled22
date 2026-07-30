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
    ink: '#0B1220',
    paper: '#FFFFFF',
    surface: '#F3F5FA',
    blue: '#1E40AF',
    blueDark: '#0E1E52',
    glow: '#FFC94A',
    line: '#E1E6F0',
    muted: '#66708A',
  },
  company: {
    name: 'ALRA LED Solutions',
    address: 'Dijkgraafweg 4a',
    postcode: '7336 AT Apeldoorn',
    phone: '085-0021 606',
    email: 'info@alra-led.nl',
    website: 'www.alra-led.nl',
    logo: 'https://alra-led.com/wp-content/uploads/2024/06/Alra-led-logo-diap.png',
  },
  texts: {
    docLabel: 'Offerte',
    fromLabel: 'Van',
    toLabel: 'Aan',
    itemsLabel: 'Omschrijving',
    qtyLabel: 'Aantal',
    unitPriceLabel: 'Prijs p/st',
    totalLabel: 'Totaal',
    subtotalLabel: 'Subtotaal',
    vatLabel: 'BTW (21%)',
    grandTotalLabel: 'Totaal',
    notesLabel: 'Opmerkingen',
    validUntil: '30 dagen',
    signatureLeftLabel: 'Akkoord namens ALRA LED Solutions',
    signatureRightLabel: 'Akkoord namens opdrachtgever',
    signatureLine: 'Naam, datum & handtekening',
    footerDisclaimer: 'Deze offerte is 30 dagen geldig. Prijzen zijn exclusief tenzij anders vermeld.',
  },
  notes: 'Alle producten zijn voorzien van de vereiste keurmerken en vallen onder de ALRA-garantievoorwaarden. Levertijd: circa 3–5 werkdagen na akkoord, montage in overleg in te plannen.',
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
  lines: { name: string; desc?: string; qty: number; unit: number; total: number }[];
}) {
  const { colors: c, company, texts: t } = design;
  const { refNr, date, validUntil, customer, lines } = data;

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const vat = subtotal * 0.21;
  const total = subtotal + vat;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="offerte-${refNr}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  doc.pipe(res);

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const mx = 48;
  const contentW = pageW - mx * 2;

  // Helper: draw LED strip
  const drawLedStrip = (y: number) => {
    doc.rect(0, y, pageW, 14).fill(c.blueDark);
    const dotSpacing = 18;
    const dotCount = Math.floor((contentW) / dotSpacing);
    for (let i = 0; i <= dotCount; i++) {
      const dotX = mx + (i * dotSpacing);
      if (dotX > pageW - mx) break;
      const is3n = i % 3 === 0;
      const is5n = i % 5 === 0;
      const opacity = is5n ? 1 : is3n ? 0.45 : 0.9;
      const radius = is5n ? 2.5 : 2;
      doc.circle(dotX, y + 7, radius).fill(`rgba(255,201,74,${opacity})`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // LED STRIP TOP
  // ═══════════════════════════════════════════════════════════════
  drawLedStrip(0);

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════
  const headerY = 14;
  const headerH = 86;
  doc.rect(0, headerY, pageW, headerH).fill(c.blueDark);

  // Company name left
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(company.name, mx, headerY + 34, { width: 300 });

  // Doc meta right
  const metaW = 200;
  const metaX = pageW - mx - metaW;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(c.glow);
  doc.text(t.docLabel.toUpperCase(), metaX, headerY + 18, { width: metaW, align: 'right' });
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(`#${refNr}`, metaX, headerY + 34, { width: metaW, align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#DCE3FF');
  doc.text(`Datum: ${date}`, metaX, headerY + 66, { width: metaW, align: 'right' });
  doc.text(`Geldig tot: ${validUntil}`, metaX, headerY + 80, { width: metaW, align: 'right' });

  // ═══════════════════════════════════════════════════════════════
  // PARTIES (Van / Aan)
  // ═══════════════════════════════════════════════════════════════
  let y = headerY + headerH + 30;
  const halfW = (contentW - 32) / 2;

  // Van (left)
  doc.roundedRect(mx, y, halfW, 76, 0).fill(c.surface);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.blue);
  doc.text(t.fromLabel.toUpperCase(), mx + 14, y + 12, { width: halfW - 28 });
  doc.fontSize(11).font('Helvetica-Bold').fillColor(c.ink);
  doc.text(company.name, mx + 14, y + 28, { width: halfW - 28 });
  doc.fontSize(9).font('Helvetica').fillColor(c.muted);
  doc.text(company.address, mx + 14, y + 44, { width: halfW - 28 });
  doc.text(company.postcode, mx + 14, y + 56, { width: halfW - 28 });
  doc.text(`${company.phone} · ${company.email}`, mx + 14, y + 68, { width: halfW - 28 });

  // Aan (right)
  const rightX = mx + halfW + 32;
  doc.roundedRect(rightX, y, halfW, 76, 0).fill(c.blueDark);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('rgba(255,255,255,0.6)');
  doc.text(t.toLabel.toUpperCase(), rightX + 14, y + 12, { width: halfW - 28 });
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(customer.name || ' ', rightX + 14, y + 28, { width: halfW - 28 });
  doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.7)');
  let custY = y + 44;
  if (customer.attention) { doc.text(`t.a.v. ${customer.attention}`, rightX + 14, custY, { width: halfW - 28 }); custY += 12; }
  if (customer.address) { doc.text(customer.address, rightX + 14, custY, { width: halfW - 28 }); custY += 12; }
  if (customer.postcode || customer.city) { doc.text(`${customer.postcode || ''} ${customer.city || ''}`.trim(), rightX + 14, custY, { width: halfW - 28 }); custY += 12; }
  if (customer.email) { doc.text(customer.email, rightX + 14, custY, { width: halfW - 28 }); }

  // Border bottom of parties section
  y += 76;
  doc.moveTo(mx, y).lineTo(pageW - mx, y).lineWidth(0.5).stroke(c.line);
  y += 24;

  // ═══════════════════════════════════════════════════════════════
  // TABLE
  // ═══════════════════════════════════════════════════════════════
  const colDesc = mx;
  const colQty = mx + contentW * 0.55;
  const colUnit = mx + contentW * 0.72;
  const colTotal = mx + contentW * 0.88;

  // Header row
  doc.roundedRect(mx, y, contentW, 28, 3).fill(c.blue);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(t.itemsLabel.toUpperCase(), colDesc + 12, y + 9, { width: colQty - colDesc - 24 });
  doc.text(t.qtyLabel.toUpperCase(), colQty, y + 9, { width: colUnit - colQty, align: 'right' });
  doc.text(t.unitPriceLabel.toUpperCase(), colUnit, y + 9, { width: colTotal - colUnit, align: 'right' });
  doc.text(t.totalLabel.toUpperCase(), colTotal, y + 9, { width: contentW - (colTotal - mx) - 12, align: 'right' });
  y += 34;

  // Rows
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line) continue;
    const rowH = 26;

    if (idx % 2 === 0) {
      doc.rect(mx, y, contentW, rowH).fill(c.surface);
    }

    doc.fontSize(10).font('Helvetica-Bold').fillColor(c.ink);
    doc.text(line.name, colDesc + 12, y + 8, { width: colQty - colDesc - 24 });

    doc.fontSize(10).font('Helvetica').fillColor(c.ink);
    doc.text(String(line.qty), colQty, y + 8, { width: colUnit - colQty, align: 'right' });
    doc.text(formatEuro(line.unit), colUnit, y + 8, { width: colTotal - colUnit, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(c.blue);
    doc.text(formatEuro(line.total), colTotal, y + 8, { width: contentW - (colTotal - mx) - 12, align: 'right' });

    doc.moveTo(mx + 12, y + rowH - 1).lineTo(mx + contentW - 12, y + rowH - 1).lineWidth(0.3).stroke(c.line);
    y += rowH;
  }

  // ═══════════════════════════════════════════════════════════════
  // TOTALS (right-aligned, 280px wide like HTML)
  // ═══════════════════════════════════════════════════════════════
  y += 22;
  const totW = 280;
  const totX = pageW - mx - totW;

  // Background
  doc.roundedRect(totX, y, totW, 100, 0).fill(c.surface);

  // Dark blue top accent line
  doc.rect(totX, y, totW, 3).fill(c.blueDark);

  let totY = y + 16;

  // Subtotaal
  doc.fontSize(10).font('Helvetica').fillColor(c.muted);
  doc.text(t.subtotalLabel, totX + 14, totY, { width: 150 });
  doc.text(formatEuro(subtotal), totX + totW - 14, totY, { width: 100, align: 'right' });
  totY += 22;

  // BTW
  doc.text(t.vatLabel, totX + 14, totY, { width: 150 });
  doc.text(formatEuro(vat), totX + totW - 14, totY, { width: 100, align: 'right' });
  totY += 26;

  // Divider line
  doc.moveTo(totX + 14, totY).lineTo(totX + totW - 14, totY).lineWidth(2).stroke(c.blueDark);
  totY += 12;

  // Totaal
  doc.fontSize(14).font('Helvetica-Bold').fillColor(c.blueDark);
  doc.text(t.grandTotalLabel.toUpperCase(), totX + 14, totY, { width: 150 });
  doc.text(formatEuro(total), totX + totW - 14, totY, { width: 100, align: 'right' });

  // ═══════════════════════════════════════════════════════════════
  // NOTES (blue left border like HTML)
  // ═══════════════════════════════════════════════════════════════
  if (design.notes) {
    y += 122;

    // Measure text height first
    const noteTextHeight = doc.heightOfString(design.notes, { width: contentW - 36, lineGap: 3 });
    const noteBoxH = 42 + noteTextHeight + 12;

    // Background
    doc.rect(mx, y, contentW, noteBoxH).fill(c.surface);
    // Blue left border
    doc.rect(mx, y, 4, noteBoxH).fill(c.blue);

    doc.fontSize(9).font('Helvetica-Bold').fillColor(c.blueDark);
    doc.text(t.notesLabel.toUpperCase(), mx + 18, y + 14, { width: contentW - 36 });
    doc.fontSize(10).font('Helvetica').fillColor(c.ink);
    doc.text(design.notes, mx + 18, y + 30, { width: contentW - 36, lineGap: 3 });

    y += noteBoxH;
  }

  // ═══════════════════════════════════════════════════════════════
  // SIGNATURES
  // ═══════════════════════════════════════════════════════════════
  y += 36;
  const sigGap = 40;
  const sigColW = (contentW - sigGap) / 2;

  // Left signature
  doc.fontSize(10).font('Helvetica').fillColor(c.muted);
  doc.text(t.signatureLeftLabel, mx, y, { width: sigColW });
  y += 44;
  doc.moveTo(mx, y).lineTo(mx + sigColW, y).lineWidth(0.5).stroke(c.ink);
  doc.fontSize(9).font('Helvetica').fillColor(c.muted);
  doc.text(t.signatureLine, mx, y + 6, { width: sigColW });

  // Right signature
  const sigRightX = mx + sigColW + sigGap;
  doc.fontSize(10).font('Helvetica').fillColor(c.muted);
  doc.text(t.signatureRightLabel, sigRightX, y - 50, { width: sigColW });
  doc.moveTo(sigRightX, y).lineTo(sigRightX + sigColW, y).lineWidth(0.5).stroke(c.ink);
  doc.text(t.signatureLine, sigRightX, y + 6, { width: sigColW });

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  const footerH = 50;
  const footerY = pageH - 14 - footerH;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.blueDark);
  doc.text(company.name, mx, footerY + 10, { width: contentW, align: 'center' });
  doc.fontSize(8).font('Helvetica').fillColor(c.muted);
  doc.text(`${company.address}, ${company.postcode}  ·  ${company.phone}  ·  ${company.email}  ·  ${company.website}`, mx, footerY + 24, { width: contentW, align: 'center' });
  doc.fontSize(7).fillColor(c.muted);
  doc.text(t.footerDisclaimer, mx, footerY + 38, { width: contentW, align: 'center' });

  // ═══════════════════════════════════════════════════════════════
  // LED STRIP BOTTOM
  // ═══════════════════════════════════════════════════════════════
  drawLedStrip(pageH - 14);

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
      return { name: p.name, desc: p.description || '', qty: q, unit, total: q * unit };
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
