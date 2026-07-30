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
    const previewItems = req.body.previewItems || [
      { name: 'LED Bedrijfswagenverlichting — set', desc: 'Compleet verlichtingspakket, incl. bekabeling en montagemateriaal', qty: 3, unit: 245, total: 735 },
      { name: 'LED Bouwlichtslang 25 meter', desc: 'Koppelbare uitvoering, geschikt voor bouwplaats en werkplaats', qty: 2, unit: 99.75, total: 199.50 },
      { name: 'LED Hefbrugverlichting', desc: 'Inclusief T-kabel en bevestigingsset', qty: 2, unit: 189, total: 378 },
      { name: 'Montage & installatie op locatie', desc: 'Werkzaamheden door ALRA-monteur, incl. functiecheck', qty: 1, unit: 195, total: 195 },
    ];
    generateQuotePdf(res, design, {
      refNr: '2026-0143',
      date: new Date().toLocaleDateString('nl-NL'),
      validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString('nl-NL'),
      customer: { name: 'Jansen Transport B.V.', attention: 'dhr. R. Jansen', address: 'Parkweg 45', postcode: '3011 AB', city: 'Rotterdam', email: 'r.jansen@voorbeeld.nl' },
      lines: previewItems,
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

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  const rgb = (hex: string) => hexToRgb(hex);

  // ═══════════════════════════════════════════════════════════════
  // LED STRIP TOP
  // ═══════════════════════════════════════════════════════════════
  const ledY = 0;
  const ledH = 14;
  const { r: dr, g: dg, b: db_ } = rgb(c.blueDark);
  doc.rect(0, ledY, pageW, ledH).fill(c.blueDark);

  for (let i = 0; i < 40; i++) {
    const dotX = mx + (i * 18);
    if (dotX > pageW - mx) break;
    const opacity = (i % 5 === 0) ? 1 : (i % 3 === 0) ? 0.45 : 0.9;
    const size = (i % 5 === 0) ? 5 : 4;
    doc.circle(dotX, ledY + ledH / 2, size / 2).fill(`rgba(255,201,74,${opacity})`);
  }

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════
  const headerY = ledH;
  const headerH = 80;
  doc.rect(0, headerY, pageW, headerH).fill(c.blueDark);

  // Logo placeholder (text-based fallback)
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(company.name, mx, headerY + 28, { width: 300 });

  // Doc meta right side
  const metaX = pageW - mx - 200;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.glow);
  doc.text(t.docLabel.toUpperCase(), metaX, headerY + 16, { width: 200, align: 'right' });
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(`#${refNr}`, metaX, headerY + 30, { width: 200, align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#DCE3FF');
  doc.text(`Datum: ${date}`, metaX, headerY + 56, { width: 200, align: 'right' });
  doc.text(`Geldig tot: ${validUntil}`, metaX, headerY + 68, { width: 200, align: 'right' });

  // ═══════════════════════════════════════════════════════════════
  // PARTIES (Van / Aan)
  // ═══════════════════════════════════════════════════════════════
  let y = headerY + headerH + 24;
  const colW = contentW / 2 - 10;

  // Van (left)
  doc.roundedRect(mx, y, colW, 80, 4).fill(c.surface);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(c.blue);
  doc.text(t.fromLabel.toUpperCase(), mx + 14, y + 10);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(c.ink);
  doc.text(company.name, mx + 14, y + 24);
  doc.fontSize(9).font('Helvetica').fillColor(c.muted);
  doc.text(`${company.address}`, mx + 14, y + 38);
  doc.text(`${company.postcode}`, mx + 14, y + 50);
  doc.text(`${company.phone} · ${company.email}`, mx + 14, y + 62);

  // Aan (right)
  const rightX = mx + colW + 20;
  doc.roundedRect(rightX, y, colW, 80, 4).fill(c.blueDark);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('rgba(255,255,255,0.6)');
  doc.text(t.toLabel.toUpperCase(), rightX + 14, y + 10);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(customer.name, rightX + 14, y + 24);
  doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.7)');
  let custY = y + 38;
  if (customer.attention) { doc.text(`t.a.v. ${customer.attention}`, rightX + 14, custY); custY += 12; }
  if (customer.address) { doc.text(customer.address, rightX + 14, custY); custY += 12; }
  if (customer.postcode || customer.city) { doc.text(`${customer.postcode || ''} ${customer.city || ''}`.trim(), rightX + 14, custY); custY += 12; }
  if (customer.email) { doc.text(customer.email, rightX + 14, custY); }

  y += 100;

  // ═══════════════════════════════════════════════════════════════
  // TABLE
  // ═══════════════════════════════════════════════════════════════
  y += 10;
  const colDesc = mx;
  const colQty = mx + contentW * 0.58;
  const colUnit = mx + contentW * 0.73;
  const colTotal = mx + contentW * 0.88;

  // Header row
  doc.roundedRect(mx, y, contentW, 28, 3).fill(c.blue);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(t.itemsLabel.toUpperCase(), colDesc + 12, y + 9, { width: colQty - colDesc - 12 });
  doc.text(t.qtyLabel.toUpperCase(), colQty, y + 9, { width: colUnit - colQty, align: 'right' });
  doc.text(t.unitPriceLabel.toUpperCase(), colUnit, y + 9, { width: colTotal - colUnit, align: 'right' });
  doc.text(t.totalLabel.toUpperCase(), colTotal, y + 9, { width: contentW - (colTotal - mx) - 12, align: 'right' });
  y += 34;

  // Rows
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line) continue;
    const rowH = line.desc ? 38 : 28;

    if (idx % 2 === 0) {
      doc.rect(mx, y, contentW, rowH).fill(c.surface);
    }

    doc.fontSize(10).font('Helvetica-Bold').fillColor(c.ink);
    doc.text(line.name, colDesc + 12, y + 8, { width: colQty - colDesc - 24 });
    if (line.desc) {
      doc.fontSize(8).font('Helvetica').fillColor(c.muted);
      doc.text(line.desc, colDesc + 12, y + 22, { width: colQty - colDesc - 24 });
    }

    doc.fontSize(10).font('Helvetica').fillColor(c.ink);
    doc.text(String(line.qty), colQty, y + 8, { width: colUnit - colQty, align: 'right' });
    doc.text(formatEuro(line.unit), colUnit, y + 8, { width: colTotal - colUnit, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(c.blue);
    doc.text(formatEuro(line.total), colTotal, y + 8, { width: contentW - (colTotal - mx) - 12, align: 'right' });

    doc.moveTo(mx + 12, y + rowH - 1).lineTo(mx + contentW - 12, y + rowH - 1).lineWidth(0.3).stroke(c.line);
    y += rowH;
  }

  // ═══════════════════════════════════════════════════════════════
  // TOTALS
  // ═══════════════════════════════════════════════════════════════
  y += 20;
  const totW = 260;
  const totX = pageW - mx - totW;

  doc.roundedRect(totX - 16, y - 10, totW + 32, 100, 6).fill(c.surface);
  doc.roundedRect(totX - 16, y - 10, totW + 32, 3, 1.5).fill(c.blueDark);

  doc.fontSize(9).font('Helvetica').fillColor(c.muted);
  doc.text(t.subtotalLabel, totX, y + 6, { width: 150 });
  doc.text(formatEuro(subtotal), totX + 150, y + 6, { width: 90, align: 'right' });
  y += 22;

  doc.text(t.vatLabel, totX, y + 6, { width: 150 });
  doc.text(formatEuro(vat), totX + 150, y + 6, { width: 90, align: 'right' });
  y += 28;

  doc.moveTo(totX, y).lineTo(totX + totW, y).lineWidth(1.5).stroke(c.blueDark);
  y += 10;

  doc.fontSize(14).font('Helvetica-Bold').fillColor(c.blueDark);
  doc.text(t.grandTotalLabel.toUpperCase(), totX, y + 4, { width: 150 });
  doc.text(formatEuro(total), totX + 150, y + 4, { width: 90, align: 'right' });

  // ═══════════════════════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════════════════════
  if (design.notes) {
    y += 50;
    doc.roundedRect(mx, y, contentW, 0, 4).fill(c.surface);
    doc.roundedRect(mx, y, 4, 0, 2).fill(c.blue);
    const noteY = y + 12;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(c.blueDark);
    doc.text(t.notesLabel.toUpperCase(), mx + 16, noteY);
    doc.fontSize(9).font('Helvetica').fillColor(c.ink);
    doc.text(design.notes, mx + 16, noteY + 16, { width: contentW - 32, lineGap: 3 });
  }

  // ═══════════════════════════════════════════════════════════════
  // SIGNATURES
  // ═══════════════════════════════════════════════════════════════
  y += 70;
  const sigColW = contentW / 2 - 16;

  doc.fontSize(9).font('Helvetica').fillColor(c.muted);
  doc.text(t.signatureLeftLabel, mx, y, { width: sigColW });
  doc.moveTo(mx, y + 50).lineTo(mx + sigColW, y + 50).lineWidth(0.5).stroke(c.ink);
  doc.fontSize(8).font('Helvetica').fillColor(c.muted);
  doc.text(t.signatureLine, mx, y + 54, { width: sigColW });

  doc.text(t.signatureRightLabel, mx + sigColW + 32, y, { width: sigColW });
  doc.moveTo(mx + sigColW + 32, y + 50).lineTo(mx + sigColW + 32 + sigColW, y + 50).lineWidth(0.5).stroke(c.ink);
  doc.text(t.signatureLine, mx + sigColW + 32, y + 54, { width: sigColW });

  // ═══════════════════════════════════════════════════════════════
  // LED STRIP BOTTOM
  // ═══════════════════════════════════════════════════════════════
  const footLedY = pageH - 14;
  doc.rect(0, footLedY, pageW, 14).fill(c.blueDark);
  for (let i = 0; i < 40; i++) {
    const dotX = mx + (i * 18);
    if (dotX > pageW - mx) break;
    const opacity = (i % 5 === 0) ? 1 : (i % 3 === 0) ? 0.45 : 0.9;
    const size = (i % 5 === 0) ? 5 : 4;
    doc.circle(dotX, footLedY + 7, size / 2).fill(`rgba(255,201,74,${opacity})`);
  }

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  const footerY = footLedY - 40;
  doc.fontSize(8).font('Helvetica-Bold').fillColor(c.blueDark);
  doc.text(company.name, mx, footerY, { width: contentW, align: 'center' });
  doc.fontSize(7).font('Helvetica').fillColor(c.muted);
  doc.text(`${company.address}, ${company.postcode}  ·  ${company.phone}  ·  ${company.email}  ·  ${company.website}`, mx, footerY + 12, { width: contentW, align: 'center' });
  doc.fontSize(6).fillColor(c.muted);
  doc.text(t.footerDisclaimer, mx, footerY + 24, { width: contentW, align: 'center' });

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
