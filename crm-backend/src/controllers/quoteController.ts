import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { products } from '../db/schema';
import { db } from '../lib/db';
import { inArray } from 'drizzle-orm';
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

const COLORS = {
  primary: '#0c4684',
  secondary: '#0f172a',
  accent: '#f97316',
  lightBg: '#f8fafc',
  border: '#e2e8f0',
  text: '#334155',
  textLight: '#94a3b8',
  white: '#ffffff',
  tableAlt: '#f1f5f9',
};

export const createQuotePdf = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const payload = quoteSchema.parse(req.body);
    const ids = payload.items.map(i => i.productId);
    const prods = await db.select().from(products).where(inArray(products.id, ids));

    const qtyMap = new Map(payload.items.map(i => [i.productId, i.quantity]));
    const pricing = await getPricingContextForUser(userId);
    const lines = await Promise.all(prods.map(async (p) => {
      const q = qtyMap.get(p.id) || 1;
      const unit = await getEffectiveUnitPrice(p.id, q, pricing.discountPercent);
      return { name: p.name, qty: q, unit, total: q * unit };
    }));
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const vatRate = pricing.vatReverseCharge ? 0 : 0.21;
    const vat = subtotal * vatRate;
    const total = subtotal + vat;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="offerte.pdf"`);
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    doc.pipe(res);

    const pageW = doc.page.width;
    const margin = 50;
    const contentW = pageW - margin * 2;

    // ─── TOP ACCENT BAR ───
    doc.rect(0, 0, pageW, 6).fill(COLORS.primary);

    // ─── HEADER SECTION ───
    const headerY = 30;
    doc.fontSize(32).font('Helvetica-Bold').fillColor(COLORS.secondary).text('OFFERTE', margin, headerY);
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight).text(
      `Referentie: ALR-${Date.now().toString(36).toUpperCase()}`,
      margin, headerY + 42
    );
    doc.text(
      `Datum: ${new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      margin, headerY + 55
    );

    // Badge
    const badgeX = pageW - margin - 100;
    doc.roundedRect(badgeX, headerY, 100, 30, 15).fill(COLORS.primary);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white).text('OFFERTE', badgeX, headerY + 10, { width: 100, align: 'center' });

    // ─── CUSTOMER BOX ───
    const custY = 105;
    doc.roundedRect(margin, custY, contentW, 80, 8).fill(COLORS.lightBg);
    doc.roundedRect(margin, custY, contentW, 80, 8).lineWidth(0.5).stroke(COLORS.border);

    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text('KLANTGEGEVENS', margin + 18, custY + 14);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.secondary).text(payload.customer.name, margin + 18, custY + 28);
    let custInfoY = custY + 44;
    if (payload.customer.company) {
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(payload.customer.company, margin + 18, custInfoY);
      custInfoY += 14;
    }
    const contactParts = [payload.customer.email, payload.customer.phone].filter(Boolean).join('  •  ');
    if (contactParts) {
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight).text(contactParts, margin + 18, custInfoY);
    }

    // ─── TABLE HEADER ───
    let y = custY + 100;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text('PRODUCTOVERZICHT', margin, y);
    y += 20;

    // Table header background
    doc.roundedRect(margin, y, contentW, 28, 4).fill(COLORS.secondary);
    const colName = margin + 14;
    const colQty = margin + 310;
    const colUnit = margin + 370;
    const colTotal = margin + 460;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white);
    doc.text('PRODUCT', colName, y + 9);
    doc.text('AANTAL', colQty, y + 9, { width: 50, align: 'right' });
    doc.text('EENHEIDSPRIJS', colUnit, y + 9, { width: 70, align: 'right' });
    doc.text('TOTAAL', colTotal, y + 9, { width: contentW - (colTotal - margin) - 14, align: 'right' });
    y += 36;

    // ─── TABLE ROWS ───
    doc.font('Helvetica').fillColor(COLORS.text);
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      if (!line) continue;
      const rowH = 36;

      if (idx % 2 === 0) {
        doc.roundedRect(margin, y, contentW, rowH, 0).fill(COLORS.tableAlt);
      }

      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.secondary).text(line.name, colName, y + 11, { width: 280 });
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.text);
      doc.text(String(line.qty), colQty, y + 11, { width: 50, align: 'right' });
      doc.text(formatEuro(line.unit), colUnit, y + 11, { width: 70, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(COLORS.secondary);
      doc.text(formatEuro(line.total), colTotal, y + 11, { width: contentW - (colTotal - margin) - 14, align: 'right' });

      y += rowH;

      if (y > doc.page.height - 180) {
        doc.addPage();
        y = margin;
      }
    }

    // ─── TOTALS SECTION ───
    y += 12;
    const totalsW = 220;
    const totalsX = pageW - margin - totalsW;

    // Totals box
    doc.roundedRect(totalsX - 14, y - 8, totalsW + 28, 100, 8).fill(COLORS.lightBg);
    doc.roundedRect(totalsX - 14, y - 8, totalsW + 28, 100, 8).lineWidth(0.5).stroke(COLORS.border);

    const totLabelX = totalsX;
    const totValX = totalsX + totalsW;

    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textLight);
    doc.text('Subtotaal (excl. BTW)', totLabelX, y + 4, { width: 140 });
    doc.text(formatEuro(subtotal), totValX - 10, y + 4, { width: 100, align: 'right' });
    y += 22;

    doc.text(pricing.vatReverseCharge ? 'BTW (verlegd)' : 'BTW (21%)', totLabelX, y + 4, { width: 140 });
    doc.text(formatEuro(vat), totValX - 10, y + 4, { width: 100, align: 'right' });
    y += 28;

    // Divider in totals box
    doc.moveTo(totLabelX, y - 4).lineTo(totValX + 100, y - 4).lineWidth(1).stroke(COLORS.border);
    y += 4;

    doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.primary);
    doc.text('TOTAAL (incl. BTW)', totLabelX, y + 2, { width: 140 });
    doc.text(formatEuro(total), totValX - 10, y + 2, { width: 100, align: 'right' });

    // ─── NOTE / MESSAGE ───
    if (payload.message) {
      y += 60;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.primary).text('OPMERKINGEN', margin, y);
      y += 16;
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.text);
      doc.text(payload.message, margin, y, { width: contentW, lineGap: 4 });
    }

    // ─── FOOTER ───
    const footerY = doc.page.height - 60;
    doc.moveTo(margin, footerY - 10).lineTo(pageW - margin, footerY - 10).lineWidth(0.5).stroke(COLORS.border);
    doc.fontSize(7).font('Helvetica').fillColor(COLORS.textLight);
    doc.text('ALRA LED Solutions  •  Dijkgraafweg 4a, 7336 AT Apeldoorn  •  085-0021 606  •  info@alra-led.nl', margin, footerY, { width: contentW, align: 'center' });
    doc.text('Deze offerte is 30 dagen geldig. Prijzen zijn exclusief tenzij anders vermeld.', margin, footerY + 12, { width: contentW, align: 'center' });

    doc.end();
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};
