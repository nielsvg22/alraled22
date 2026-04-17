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
});

function formatEuro(value: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

export const createQuotePdf = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const payload = quoteSchema.parse(req.body);
    const ids = payload.items.map(i => i.productId);
    const prods = db.select().from(products).where(inArray(products.id, ids)).all();

    const qtyMap = new Map(payload.items.map(i => [i.productId, i.quantity]));
    const pricing = getPricingContextForUser(userId);
    const lines = prods.map(p => {
      const q = qtyMap.get(p.id) || 1;
      const unit = getEffectiveUnitPrice(p.id, q, pricing.discountPercent);
      return { name: p.name, qty: q, unit, total: q * unit };
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const vatRate = pricing.vatReverseCharge ? 0 : 0.21;
    const vat = subtotal * vatRate;
    const total = subtotal + vat;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="offerte.pdf"`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#0f172a').text('Offerte', left, 60);
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`);
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Klant');
    doc.font('Helvetica').text(payload.customer.name);
    if (payload.customer.company) doc.text(payload.customer.company);
    if (payload.customer.email) doc.text(payload.customer.email);
    if (payload.customer.phone) doc.text(payload.customer.phone);

    let y = 180;
    doc.font('Helvetica-Bold').fillColor('#0f172a').text('Omschrijving', left, y);
    doc.text('Aantal', left + 300, y, { width: 50, align: 'right' });
    doc.text('Prijs', left + 360, y, { width: 70, align: 'right' });
    doc.text('Totaal', left + 450, y, { width: right - (left + 450), align: 'right' });
    y += 12;
    doc.moveTo(left, y).lineTo(right, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 10;

    doc.font('Helvetica').fillColor('#334155');
    for (const line of lines) {
      const startY = y;
      doc.text(line.name, left, y, { width: 280 });
      const endY = doc.y;
      doc.text(String(line.qty), left + 300, startY, { width: 50, align: 'right' });
      doc.text(formatEuro(line.unit), left + 360, startY, { width: 70, align: 'right' });
      doc.text(formatEuro(line.total), left + 450, startY, { width: right - (left + 450), align: 'right' });
      y = Math.max(endY, startY) + 10;
      if (y > doc.page.height - 160) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    y += 10;
    doc.moveTo(left, y).lineTo(right, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 14;
    const totalsLeft = left + 320;
    doc.font('Helvetica').fillColor('#334155');
    doc.text('Subtotaal (excl. BTW)', totalsLeft, y, { width: 140 });
    doc.text(formatEuro(subtotal), totalsLeft + 160, y, { width: right - (totalsLeft + 160), align: 'right' });
    y += 14;
    doc.text(pricing.vatReverseCharge ? 'BTW (verlegd)' : 'BTW (21%)', totalsLeft, y, { width: 140 });
    doc.text(formatEuro(vat), totalsLeft + 160, y, { width: right - (totalsLeft + 160), align: 'right' });
    y += 18;
    doc.font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('Totaal (incl. BTW)', totalsLeft, y, { width: 140 });
    doc.text(formatEuro(total), totalsLeft + 160, y, { width: right - (totalsLeft + 160), align: 'right' });

    doc.end();
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Internal server error' });
  }
};
