import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../lib/db';
import { sendContactAdminNotification } from '../lib/emailService';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Naam is te kort').max(200),
  email: z.string().trim().email('Ongeldig e-mailadres').max(255),
  subject: z.string().trim().max(255).optional().default(''),
  message: z.string().trim().min(5, 'Bericht is te kort').max(5000),
});

function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export const submitContact = async (req: Request, res: Response) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] || 'form');
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return res.status(400).json({ error: 'Validatie mislukt', fields: fieldErrors });
    }

    const { name, email, subject, message } = parsed.data;

    await pool.execute(
      `INSERT INTO \`ContactSubmission\` (\`id\`, \`name\`, \`email\`, \`subject\`, \`message\`, \`ip\`) VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), name, email, subject || null, message, getClientIP(req)]
    );

    // Best-effort admin notification (email settings optioneel geconfigureerd)
    try {
      await sendContactAdminNotification({ name, email, subject, message });
    } catch {
      // negeren: storing in DB blijft geldig, e-mailconfig optioneel
    }

    res.status(201).json({ ok: true });
  } catch (err: any) {
    console.error('[contact] submit failed:', err?.message);
    res.status(500).json({ error: 'Er is iets misgegaan. Probeer het opnieuw.' });
  }
};