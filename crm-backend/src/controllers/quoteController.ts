import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { products } from '../db/schema';
import { db } from '../lib/db';
import { inArray } from 'drizzle-orm';
import { quotes, notifications } from '../db/schema';
import { AuthRequest } from '../middleware/authMiddleware';
import { getEffectiveUnitPrice, getPricingContextForUser } from '../lib/pricing';

const quoteSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
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

const C = {
  primary: '#0c4684',
  primaryDark: '#083366',
  accent: '#f97316',
  accentLight: '#fff7ed',
  dark: '#0f172a',
  gray900: '#1e293b',
  gray700: '#334155',
  gray500: '#64748b',
  gray400: '#94a3b8',
  gray300: '#cbd5e1',
  gray200: '#e2e8f0',
  gray100: '#f1f5f9',
  gray50: '#f8fafc',
  white: '#ffffff',
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
      const unit = await getEffectiveUnitPrice(p.id, q, pricing.discountPercent);
      return { name: p.name, qty: q, unit, total: q * unit };
    }));
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const vatRate = pricing.vatReverseCharge ? 0 : 0.21;
    const vat = subtotal * vatRate;
    const total = subtotal + vat;

    // Save quote to database FIRST (before streaming PDF)
    try {
      const itemsJson = JSON.stringify(lines.map(l => ({ name: l.name, qty: l.qty, unit: l.unit, total: l.total })));
      await db.insert(quotes).values({
        name: payload.customer.name,
        email: payload.customer.email || '',
        phone: payload.customer.phone,
        company: payload.customer.company,
        message: payload.message,
        items: itemsJson,
        total,
      });

      await db.insert(notifications).values({
        type: 'quote',
        title: 'Nieuwe offerte aangevraagd',
        message: `${payload.customer.name}${payload.customer.company ? ` (${payload.customer.company})` : ''} heeft een offerte aangevraagd van ${formatEuro(total)}.`,
        link: '/quotes',
      });
    } catch (dbErr) {
      console.error('Failed to save quote to database:', dbErr);
      // Continue with PDF generation even if DB save fails
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="offerte.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    doc.pipe(res);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const mx = 50;
    const contentW = pageW - mx * 2;

    // ═══════════════════════════════════════════════════════════════
    // TOP GRADIENT BAR
    // ═══════════════════════════════════════════════════════════════
    doc.rect(0, 0, pageW, 80).fill(C.primary);
    doc.rect(0, 80, pageW, 4).fill(C.accent);

    // Company name in header
    doc.fontSize(28).font('Helvetica-Bold').fillColor(C.white).text('ALRA LED', mx, 28);
    doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.7)').text('SOLUTIONS', mx + 2, 58);

    // "OFFERTE" badge top right
    const badgeW = 120;
    doc.roundedRect(pageW - mx - badgeW, 22, badgeW, 36, 6).fill(C.accent);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(C.white).text('OFFERTE', pageW - mx - badgeW, 33, { width: badgeW, align: 'center' });

    // ═══════════════════════════════════════════════════════════════
    // META INFO
    // ═══════════════════════════════════════════════════════════════
    let y = 110;
    const refNr = `ALR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const dateStr = new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });

    doc.fontSize(8).font('Helvetica').fillColor(C.gray400);
    doc.text(`Referentie: ${refNr}`, mx, y);
    doc.text(`Datum: ${dateStr}`, mx + 200, y);
    doc.text(`Geldig: 30 dagen`, mx + 400, y);
    y += 20;

    // Thin line
    doc.moveTo(mx, y).lineTo(pageW - mx, y).lineWidth(0.5).stroke(C.gray200);
    y += 20;

    // ═══════════════════════════════════════════════════════════════
    // CUSTOMER SECTION
    // ═══════════════════════════════════════════════════════════════
    const colW = contentW / 2 - 10;

    // Left: customer
    doc.roundedRect(mx, y, colW, 90, 6).fill(C.gray50);
    doc.roundedRect(mx, y, colW, 90, 6).lineWidth(0.5).stroke(C.gray200);
    doc.fontSize(7).font('Helvetica-Bold').fillColor(C.primary).text('KLANTGEGEVENS', mx + 14, y + 12);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text(payload.customer.name, mx + 14, y + 28);
    let cy = y + 44;
    if (payload.customer.company) {
      doc.fontSize(9).font('Helvetica').fillColor(C.gray700).text(payload.customer.company, mx + 14, cy);
      cy += 13;
    }
    const contactParts = [payload.customer.email, payload.customer.phone].filter(Boolean);
    if (contactParts.length) {
      doc.fontSize(8).font('Helvetica').fillColor(C.gray500).text(contactParts.join('  •  '), mx + 14, cy);
    }

    // Right: from
    const rightX = mx + colW + 20;
    doc.roundedRect(rightX, y, colW, 90, 6).fill(C.primaryDark);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('rgba(255,255,255,0.6)').text('VAN', rightX + 14, y + 12);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(C.white).text('ALRA LED Solutions', rightX + 14, y + 28);
    doc.fontSize(8).font('Helvetica').fillColor('rgba(255,255,255,0.7)');
    doc.text('Dijkgraafweg 4a', rightX + 14, y + 44);
    doc.text('7336 AT Apeldoorn', rightX + 14, y + 56);
    doc.text('085-0021 606', rightX + 14, y + 68);

    y += 110;

    // ═══════════════════════════════════════════════════════════════
    // TABLE HEADER
    // ═══════════════════════════════════════════════════════════════
    y += 10;
    const colProduct = mx;
    const colQty = mx + 300;
    const colUnit = mx + 360;
    const colTotal = mx + 450;
    const tableW = contentW;

    // Header bar
    doc.roundedRect(mx, y, tableW, 30, 4).fill(C.primary);
    doc.fontSize(7).font('Helvetica-Bold').fillColor(C.white);
    doc.text('PRODUCT', colProduct + 12, y + 10);
    doc.text('AANTAL', colQty, y + 10, { width: 50, align: 'right' });
    doc.text('EENHEIDSPRIJS', colUnit - 10, y + 10, { width: 80, align: 'right' });
    doc.text('TOTAAL', colTotal, y + 10, { width: contentW - (colTotal - mx) - 12, align: 'right' });
    y += 38;

    // ═══════════════════════════════════════════════════════════════
    // TABLE ROWS
    // ═══════════════════════════════════════════════════════════════
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (!line) continue;
      const rowH = 32;

      // Alternating background
      if (idx % 2 === 0) {
        doc.rect(mx, y, tableW, rowH).fill(C.gray50);
      }

      // Row number
      doc.fontSize(7).font('Helvetica-Bold').fillColor(C.gray400);
      doc.text(`${String(idx + 1).padStart(2, '0')}`, colProduct + 4, y + 10, { width: 20 });

      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark);
      doc.text(line.name, colProduct + 24, y + 10, { width: 260 });

      doc.fontSize(9).font('Helvetica').fillColor(C.gray700);
      doc.text(String(line.qty), colQty, y + 10, { width: 50, align: 'right' });
      doc.text(formatEuro(line.unit), colUnit - 10, y + 10, { width: 80, align: 'right' });

      doc.font('Helvetica-Bold').fillColor(C.primary);
      doc.text(formatEuro(line.total), colTotal, y + 10, { width: contentW - (colTotal - mx) - 12, align: 'right' });

      // Subtle bottom line
      doc.moveTo(mx + 12, y + rowH - 1).lineTo(mx + tableW - 12, y + rowH - 1).lineWidth(0.3).stroke(C.gray200);

      y += rowH;

      if (y > pageH - 200) {
        doc.addPage();
        y = mx;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // TOTALS
    // ═══════════════════════════════════════════════════════════════
    y += 16;
    const totW = 240;
    const totX = pageW - mx - totW;

    // Totals container
    doc.roundedRect(totX - 16, y - 10, totW + 32, 120, 8).fill(C.gray50);
    doc.roundedRect(totX - 16, y - 10, totW + 32, 120, 8).lineWidth(0.5).stroke(C.gray200);

    const lblX = totX;
    const valX = totX + totW;

    // Accent line at top of totals
    doc.roundedRect(totX - 16, y - 10, totW + 32, 3, 1.5).fill(C.accent);

    doc.fontSize(9).font('Helvetica').fillColor(C.gray500);
    doc.text('Subtotaal (excl. BTW)', lblX, y + 6, { width: 140 });
    doc.text(formatEuro(subtotal), lblX + 160, y + 6, { width: 70, align: 'right' });
    y += 22;

    doc.text(pricing.vatReverseCharge ? 'BTW (verlegd)' : 'BTW (21%)', lblX, y + 6, { width: 140 });
    doc.text(formatEuro(vat), lblX + 160, y + 6, { width: 70, align: 'right' });
    y += 28;

    // Divider
    doc.moveTo(lblX, y).lineTo(lblX + 230, y).lineWidth(1).stroke(C.gray300);
    y += 10;

    // Total
    doc.fontSize(13).font('Helvetica-Bold').fillColor(C.primary);
    doc.text('TOTAAL (incl. BTW)', lblX, y + 4, { width: 150 });
    doc.fontSize(14).fillColor(C.dark);
    doc.text(formatEuro(total), lblX + 160, y + 4, { width: 70, align: 'right' });

    // ═══════════════════════════════════════════════════════════════
    // MESSAGE (if provided)
    // ═══════════════════════════════════════════════════════════════
    if (payload.message) {
      y += 55;
      doc.roundedRect(mx, y, contentW, 0, 6).fill(C.accentLight);
      const msgY = y + 8;
      doc.fontSize(7).font('Helvetica-Bold').fillColor(C.accent).text('OPMERKINGEN', mx + 14, msgY);
      doc.fontSize(9).font('Helvetica').fillColor(C.gray700);
      doc.text(payload.message, mx + 14, msgY + 16, { width: contentW - 28, lineGap: 3 });
    }

    // ═══════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════
    const footerY = pageH - 70;

    // Footer bar
    doc.rect(0, footerY - 10, pageW, 80).fill(C.primary);
    doc.rect(0, footerY - 10, pageW, 2).fill(C.accent);

    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.white);
    doc.text('ALRA LED Solutions', mx, footerY + 4, { width: contentW, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('rgba(255,255,255,0.7)');
    doc.text('Dijkgraafweg 4a, 7336 AT Apeldoorn  •  085-0021 606  •  info@alra-led.nl  •  www.alra-led.nl', mx, footerY + 18, { width: contentW, align: 'center' });
    doc.fontSize(6).fillColor('rgba(255,255,255,0.5)');
    doc.text('Deze offerte is 30 dagen geldig. Prijzen zijn exclusief tenzij anders vermeld.', mx, footerY + 34, { width: contentW, align: 'center' });

    doc.end();
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};
