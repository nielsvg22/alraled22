import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { products } from '../db/schema';
import { db } from '../lib/db';
import { eq, inArray, sql } from 'drizzle-orm';
import { quotes, notifications } from '../db/schema';
import { AuthRequest } from '../middleware/authMiddleware';
import { getPriceBreakdown, getPricingContextForUser } from '../lib/pricing';
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

export const DEFAULT_DESIGN = {
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
    kvk: '62609297',
    vatNumber: 'NL854885821B01',
    bank: 'NL26 RABO 0191 8676 24',
    bic: '',
    logo: '/uploads/alra-led-logo-kleur.png',
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
    footerCompanyLabel: 'Ondernemingsgegevens',
    footerContactLabel: 'Contact informatie',
    footerPaymentLabel: 'Betalingsgegevens',
  },
  notes: '',
};

// Opgeslagen ontwerpen kunnen nog het oude (witte) logo of lege bedrijfsgegevens bevatten:
// die vallen terug op de standaardwaarden zodat de offerte altijd compleet is.
function withCompanyDefaults(company: any): typeof DEFAULT_DESIGN.company {
  const merged: any = { ...DEFAULT_DESIGN.company, ...(company || {}) };
  for (const key of ['kvk', 'vatNumber', 'bank'] as const) {
    if (!String(merged[key] || '').trim()) merged[key] = (DEFAULT_DESIGN.company as any)[key];
  }
  const logo = String(merged.logo || '').trim();
  if (!logo || /alra-led-logo\.png$/i.test(logo) || /diap/i.test(logo)) merged.logo = DEFAULT_DESIGN.company.logo;
  return merged;
}

export async function getQuoteDesign(): Promise<typeof DEFAULT_DESIGN> {
  const stored = await getContent('quote_design') as typeof DEFAULT_DESIGN | null;
  if (!stored) return DEFAULT_DESIGN;
  return {
    colors: { ...DEFAULT_DESIGN.colors, ...stored.colors },
    company: withCompanyDefaults(stored.company),
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
    const body = req.body || {};
    const design = {
      ...DEFAULT_DESIGN,
      ...body,
      colors: { ...DEFAULT_DESIGN.colors, ...body.colors },
      company: withCompanyDefaults(body.company),
      texts: { ...DEFAULT_DESIGN.texts, ...body.texts },
    };
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

export async function generateQuotePdf(res: Response, design: typeof DEFAULT_DESIGN, data: {
  refNr: string;
  date: string;
  validUntil: string;
  customer: { name: string; attention?: string; address?: string; postcode?: string; city?: string; email?: string };
  lines: { name: string; qty: number; unit?: string; unitPrice: number; vatRate: number; total: number; listPrice?: number; volumePercent?: number; volumeMinQty?: number }[];
  // Factuur: zelfde opmaak als de offerte, met eigen titel, meta-regels en eventuele BTW-verlegd-notitie
  invoice?: { docLabel: string; toLabel: string; filename: string; metaRows: [string, string][]; vatNote?: string; vatLabel?: string; lang?: 'nl' | 'en' | 'de' };
}) {
  const { colors: c, company, texts: t } = design;
  const LBL: Record<string, Record<string, string>> = {
    nl: { desc: 'Beschrijving', qty: 'Aantal', size: 'Grootte', rate: 'Tarief', vat: 'BTW%', total: 'Totaal', exl: 'Bedrag excl. BTW', grand: 'Totaalbedrag', volume: 'Hierin verwerkt: staffelkorting', phone: 'Telefoon', email: 'E-mail', company: t.footerCompanyLabel, contact: t.footerContactLabel, payment: t.footerPaymentLabel, bank: 'Bank', bic: 'BIC', btw: 'BTW', kvk: 'KvK' },
    en: { desc: 'Description', qty: 'Quantity', size: 'Unit', rate: 'Rate', vat: 'VAT%', total: 'Total', exl: 'Amount excl. VAT', grand: 'Total amount', volume: 'Includes: volume discount', phone: 'Phone', email: 'Email', company: 'Company details', contact: 'Contact information', payment: 'Payment details', bank: 'Bank', bic: 'BIC', btw: 'VAT', kvk: 'Chamber of Commerce' },
    de: { desc: 'Beschreibung', qty: 'Anzahl', size: 'Einheit', rate: 'Preis', vat: 'MwSt.%', total: 'Gesamt', exl: 'Betrag exkl. MwSt.', grand: 'Gesamtbetrag', volume: 'Darin enthalten: Mengenrabatt', phone: 'Telefon', email: 'E-Mail', company: 'Unternehmensdaten', contact: 'Kontaktinformationen', payment: 'Zahlungsdaten', bank: 'Bank', bic: 'BIC', btw: 'USt-IdNr.', kvk: 'Handelsregister' },
  };
  const L = (LBL[(data.invoice?.lang) || 'nl'] ?? LBL['nl']) as unknown as Record<'desc' | 'qty' | 'size' | 'rate' | 'vat' | 'total' | 'exl' | 'grand' | 'volume' | 'phone' | 'email' | 'company' | 'contact' | 'payment' | 'bank' | 'bic' | 'btw' | 'kvk', string>;
  const { refNr, date, validUntil, customer, lines, invoice } = data;

  const subtotalExcl = lines.reduce((s, l) => s + l.total, 0);
  const vatAmount = lines.reduce((s, l) => s + (l.total * l.vatRate / 100), 0);
  const totalIncl = subtotalExcl + vatAmount;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice ? invoice.filename : `offerte-${refNr}.pdf`}"`);

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
  doc.text(invoice ? invoice.docLabel : t.docLabel, mx, y);

  // Logo (right side)
  const logoSize = 78;
  const logoX = pageW - mx - logoSize;
  const logoY = y;

  if (company.logo) {
    try {
      let buffer: Buffer;
      if (company.logo.startsWith('/uploads/')) {
        // Eigen uploads lezen we rechtstreeks van schijf (geen afhankelijkheid van een domeinnaam)
        const dir = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(process.cwd(), 'uploads');
        buffer = fs.readFileSync(path.join(dir, path.basename(company.logo)));
      } else {
        const logoUrl = company.logo.replace('http://', 'https://');
        const response = await fetch(logoUrl, { timeout: 5000 } as any);
        if (!response.ok) throw new Error('Logo fetch failed');
        buffer = await response.buffer();
      }
      // Het logo is breed: past binnen 150 x 60 punten, rechts uitgelijnd
      doc.image(buffer, pageW - mx - 150, logoY, { fit: [150, 60], align: 'right' });
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
  doc.text(`${L.phone}: ${company.phone}`, mx, y, { width: fromW });

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

  if (invoice) {
    invoice.metaRows.forEach(([label, value], i) => drawMetaRow(label, value, i === 0));
  } else {
    drawMetaRow('Offertedatum', date);
    drawMetaRow('Offertenummer', refNr);
    drawMetaRow('VERVALDATUM:', validUntil, true);
  }

  y += 30;

  // ═══════════════════════════════════════════════════════════════
  // TO
  // ═══════════════════════════════════════════════════════════════
  y += 24;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(c.ink);
  doc.text(invoice ? invoice.toLabel : 'Naar', mx, y);
  y += 18;
  doc.fontSize(10).font('Helvetica').fillColor(c.ink);
  const custLines = [
    customer.name,
    customer.attention ? `t.a.v. ${customer.attention}` : null,
    customer.address || null,
    [customer.postcode, customer.city].filter(Boolean).join(' ') || null,
    invoice && customer.email ? customer.email : null,
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
  doc.text(L.desc, c1 + 10, y + 8, { width: w1 - 14, align: 'left' });
  doc.text(L.qty, c2, y + 8, { width: w2, align: 'center' });
  doc.text(L.size, c3, y + 8, { width: w3, align: 'center' });
  doc.text(L.rate, c4, y + 8, { width: w4, align: 'right' });
  doc.text(L.vat, c5, y + 8, { width: w5, align: 'right' });
  doc.text(L.total, c6, y + 8, { width: w6, align: 'right' });
  y += 30;

  // Rows
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line) continue;

    const hasVolume = Number(line.volumePercent) > 0 && Number(line.listPrice) > line.unitPrice;
    const rowH = hasVolume ? 42 : 28;
    if (idx % 2 === 1) {
      doc.rect(mx, y, colW, rowH).fill(c.surface);
    }

    doc.fontSize(10).font('Helvetica').fillColor(c.ink);
    doc.text(line.name, c1 + 10, y + 9, { width: w1 - 14, align: 'left' });
    doc.text(String(line.qty), c2, y + 9, { width: w2, align: 'center' });
    doc.text(line.unit || '-', c3, y + 9, { width: w3, align: 'center' });
    doc.text(formatEuro(line.unitPrice), c4, y + 9, { width: w4, align: 'right' });
    doc.text(`${line.vatRate}%`, c5, y + 9, { width: w5, align: 'right' });
    doc.font('Helvetica-Bold').fillColor(c.blueDark);
    doc.text(formatEuro(line.total), c6, y + 9, { width: w6, align: 'right' });

    if (hasVolume) {
      // Staffelkorting zichtbaar op de offerte: percentage, vanaf hoeveel stuks en de normale prijs
      doc.fontSize(8).font('Helvetica').fillColor('#047857');
      doc.text(`Staffelkorting ${line.volumePercent}% (vanaf ${line.volumeMinQty} stuks) — normaal ${formatEuro(Number(line.listPrice))} per stuk`, c1 + 10, y + 26, { width: w1 + w2 + w3 + w4, align: 'left' });
    }

    // Bottom line
    doc.moveTo(mx, y + rowH).lineTo(mx + colW, y + rowH).lineWidth(0.3).stroke(c.line);
    y += rowH + 4;
  }

  // ═══════════════════════════════════════════════════════════════
  // TOTALS (right-aligned)
  // ═══════════════════════════════════════════════════════════════
  y += 12;
  const totW = 290;
  const totX = pageW - mx - totW;

  // Excl BTW
  doc.fontSize(10).font('Helvetica').fillColor(c.ink);
  doc.text(L.exl, totX, y, { width: 180 });
  doc.text(formatEuro(subtotalExcl), totX, y, { width: totW, align: 'right' });
  y += 22;

  const volumeSaving = lines.reduce((sum, l) => sum + (Number(l.volumePercent) > 0 && Number(l.listPrice) > l.unitPrice ? (Number(l.listPrice) - l.unitPrice) * l.qty : 0), 0);
  if (volumeSaving > 0.004) {
    doc.fontSize(9).font('Helvetica').fillColor('#047857');
    doc.text(L.volume, totX, y, { width: 180 });
    doc.text(`- ${formatEuro(volumeSaving)}`, totX, y, { width: totW, align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor(c.ink);
    y += 22;
  }

  // BTW
  doc.text(invoice?.vatLabel || 'BTW', totX, y, { width: 180 });
  doc.text(formatEuro(vatAmount), totX, y, { width: totW, align: 'right' });
  y += invoice?.vatNote ? 18 : 28;
  if (invoice?.vatNote) {
    doc.fontSize(8).font('Helvetica').fillColor(c.muted);
    doc.text(invoice.vatNote, totX, y, { width: totW });
    y += 22;
  }

  // Grand total (blue background, white text)
  doc.rect(totX, y, totW, 34).fill(c.blue);
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text(L.grand, totX + 14, y + 10, { width: 180 });
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
  doc.text(L.company, mx, fy, { width: footColW });
  fy += 16;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.ink);
  doc.text(company.name, mx, fy, { width: footColW });
  fy += 14;
  doc.fontSize(8).font('Helvetica').fillColor(c.muted);
  doc.text(company.address, mx, fy, { width: footColW });
  fy += 12;
  doc.text(company.postcode, mx, fy, { width: footColW });
  if (company.kvk) {
    fy += 12;
    doc.text(`${L.kvk}: ${company.kvk}`, mx, fy, { width: footColW });
  }

  // Col 2: Contact informatie
  fy = footerY + 14;
  const col2X = mx + footColW + 20;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(c.blue);
  doc.text(L.contact, col2X, fy, { width: footColW });
  fy += 16;
  doc.fontSize(8).font('Helvetica').fillColor(c.muted);
  doc.text(`${L.phone}: ${company.phone}`, col2X, fy, { width: footColW });
  fy += 12;
  doc.text(`${L.email}: ${company.email}`, col2X, fy, { width: footColW });
  fy += 12;
  doc.text(company.website, col2X, fy, { width: footColW });

  // Col 3: Betalingsgegevens (aanpasbaar via admin; leeg = regel/blok verborgen)
  const paymentLines = [
    company.bank ? `${L.bank}: ${company.bank}` : '',
    company.bic ? `BIC: ${company.bic}` : '',
    company.vatNumber ? `${L.btw}: ${company.vatNumber}` : '',
  ].filter(Boolean);
  if (paymentLines.length > 0) {
    fy = footerY + 14;
    const col3X = mx + (footColW + 20) * 2;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(c.blue);
    doc.text(L.payment, col3X, fy, { width: footColW });
    fy += 16;
    doc.fontSize(8).font('Helvetica').fillColor(c.muted);
    for (const line of paymentLines) {
      doc.text(line, col3X, fy, { width: footColW });
      fy += 12;
    }
  }

  doc.end();
}

// Offerte uit het CRM opnieuw als pdf downloaden (op basis van de opgeslagen gegevens)
export const downloadQuotePdf = async (req: AuthRequest, res: Response) => {
  try {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, String(req.params.id))).limit(1);
    if (!quote) return res.status(404).json({ error: 'Offerte niet gevonden' });

    let items: { name: string; qty: number; unit?: string; unitPrice?: number; vatRate?: number; total?: number }[] = [];
    try { items = JSON.parse(quote.items || '[]'); } catch { /* lege offerte */ }
    const lines = items.map(i => {
      const qty = Number(i.qty) || 1;
      const unitPrice = Number(i.unitPrice) || 0;
      return { name: i.name, qty, unit: typeof i.unit === 'string' ? i.unit : 'Stuk', unitPrice, vatRate: Number(i.vatRate) || 21, total: Number(i.total) || qty * unitPrice, listPrice: Number((i as any).listPrice) || undefined, volumePercent: Number((i as any).volumePercent) || undefined, volumeMinQty: Number((i as any).volumeMinQty) || undefined };
    });

    const created = quote.createdAt ? new Date(quote.createdAt) : new Date();
    const design = await getQuoteDesign();
    await generateQuotePdf(res, design, {
      refNr: quote.quoteNumber || quote.id.slice(0, 8).toUpperCase(),
      date: created.toLocaleDateString('nl-NL'),
      validUntil: new Date(created.getTime() + 30 * 86400000).toLocaleDateString('nl-NL'),
      customer: {
        name: quote.company || quote.name,
        attention: quote.company ? quote.name : undefined,
        address: quote.address || undefined,
        postcode: quote.postcode || undefined,
        city: quote.city || undefined,
        email: quote.email || undefined,
      },
      lines,
    });
  } catch (error) {
    console.error('Download quote pdf error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  }
};

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
      const b = await getPriceBreakdown(p.id, q, pricing.discountPercent);
      return { name: p.name, qty: q, unit: 'Stuk', unitPrice: b.unitPrice, vatRate: 21, total: q * b.unitPrice, listPrice: b.listPrice, volumePercent: b.volumePercent, volumeMinQty: b.volumeMinQty };
    }));

  try {
    const itemsJson = JSON.stringify(lines.map(l => ({ name: l.name, qty: l.qty, unit: l.unit, unitPrice: l.unitPrice, vatRate: l.vatRate, total: l.total, listPrice: l.listPrice, volumePercent: l.volumePercent, volumeMinQty: l.volumeMinQty })));
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
        // Met bedrijfsnaam: bedrijf bovenaan en de contactpersoon als t.a.v.
        name: payload.customer.company || payload.customer.name,
        attention: payload.customer.company ? payload.customer.name : undefined,
        address: payload.customer.address,
        postcode: payload.customer.postcode,
        city: payload.customer.city,
        email: payload.customer.email,
      },
      lines,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};
