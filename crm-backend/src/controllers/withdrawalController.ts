import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../lib/db';
import { sendWithdrawalEmails } from '../lib/emailService';

const schema = z.object({
  name: z.string().trim().min(2, 'Vul uw naam in').max(200),
  email: z.string().trim().email('Ongeldig e-mailadres').max(255),
  orderNumber: z.string().trim().max(60).optional().default(''),
  products: z.string().trim().min(2, 'Vermeld welke producten u herroept').max(1000),
  orderedOn: z.string().trim().max(40).optional().default(''),
  receivedOn: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().max(2000).optional().default(''),
  language: z.enum(['nl', 'en', 'de']).optional().default('nl'),
});

// Datum en tijd van de melding in Nederlandse tijd, voor de bevestiging
function receivedAt(lang: string): string {
  const loc = lang === 'en' ? 'en-GB' : lang === 'de' ? 'de-DE' : 'nl-NL';
  return new Date().toLocaleString(loc, { timeZone: 'Europe/Amsterdam', dateStyle: 'long', timeStyle: 'short' });
}

export const submitWithdrawal = async (req: Request, res: Response) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const i of parsed.error.issues) { const f = String(i.path[0] || 'form'); if (!fields[f]) fields[f] = i.message; }
      return res.status(400).json({ error: 'Validatie mislukt', fields });
    }
    const d = parsed.data;
    const when = receivedAt(d.language);
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const ipShort = String(ip).slice(0, 45);
    const message = `HERROEPING (online herroepingsfunctie)\nOntvangen: ${when}\nOrdernummer: ${d.orderNumber || '-'}\nProducten: ${d.products}\nBesteld op: ${d.orderedOn || '-'}\nOntvangen op: ${d.receivedOn || '-'}\nToelichting: ${d.message || '-'}`;
    // Altijd bewaren: de melding is geldig zodra wij haar ontvangen, ook als de mail niet verstuurd kan worden
    await pool.execute(
      'INSERT INTO `ContactSubmission` (`id`, `name`, `email`, `subject`, `message`, `ip`) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), d.name, d.email, `Herroeping${d.orderNumber ? ` order ${d.orderNumber}` : ''}`.slice(0, 255), message, ipShort],
    );
    let emailSent = false;
    try { emailSent = await sendWithdrawalEmails({ ...d, receivedAtText: when }); } catch (e: any) { console.error('[withdrawal] mail:', e?.message); }
    res.status(201).json({ ok: true, receivedAt: when, emailSent });
  } catch (err: any) {
    console.error('[withdrawal] failed:', err?.message);
    res.status(500).json({ error: 'Er is iets misgegaan. Probeer het opnieuw of mail naar info@alra-led.nl.' });
  }
};
