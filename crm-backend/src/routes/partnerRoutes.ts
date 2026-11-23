import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../lib/db';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import { sendPartnerApplicationEmails } from '../lib/emailService';

const router = Router();

async function q(query: string, params: any[] = []): Promise<any[]> {
  const [rows] = (await pool.query(query, params)) as any;
  return rows as any[];
}

const opt = (max: number) => z.string().trim().max(max).optional().default('');
const applicationSchema = z.object({
  company: z.string().trim().min(2, 'Vul de bedrijfsnaam in').max(255),
  contactName: z.string().trim().min(2, 'Vul de naam van de contactpersoon in').max(255),
  email: z.string().trim().email('Ongeldig e-mailadres').max(255),
  phone: opt(50),
  website: opt(255),
  kvk: opt(30),
  vatNumber: opt(32),
  region: opt(255),
  message: opt(3000),
  language: z.enum(['nl', 'en', 'de']).optional().default('nl'),
  website_url: z.string().optional().default(''), // honeypot: moet leeg blijven
});

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Te veel aanvragen. Probeer het later opnieuw of mail naar info@alra-led.nl.' } });

// ── Publiek: aanvraag indienen ──
router.post('/', limiter, async (req: Request, res: Response) => {
  const p = applicationSchema.safeParse(req.body);
  if (!p.success) {
    const fields: Record<string, string> = {};
    for (const i of p.error.issues) { const f = String(i.path[0] || 'form'); if (!fields[f]) fields[f] = i.message; }
    return res.status(400).json({ error: 'Controleer de gegevens', fields });
  }
  const d = p.data;
  if (d.website_url) return res.status(201).json({ ok: true }); // bot: doen alsof het gelukt is
  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    await pool.execute(
      'INSERT INTO `PartnerApplication` (`id`,`company`,`contactName`,`email`,`phone`,`website`,`kvk`,`vatNumber`,`region`,`message`,`language`,`ip`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [randomUUID(), d.company, d.contactName, d.email, d.phone || null, d.website || null, d.kvk || null, d.vatNumber || null, d.region || null, d.message || null, d.language, String(ip).slice(0, 45)],
    );
    let emailSent = false;
    try { emailSent = await sendPartnerApplicationEmails(d); } catch (e: any) { console.error('[partner] mail:', e?.message); }
    res.status(201).json({ ok: true, emailSent });
  } catch (e: any) {
    console.error('[partner] opslaan mislukt:', e?.message);
    res.status(500).json({ error: 'Er is iets misgegaan. Probeer het opnieuw of mail naar info@alra-led.nl.' });
  }
});

// ── Beheer (alleen admin) ──
const admin = [authMiddleware, adminMiddleware];
const STATUSES = ['NEW', 'CONTACTED', 'APPROVED', 'REJECTED'];

router.get('/admin', ...admin, async (_req: Request, res: Response) => {
  try { res.json(await q('SELECT * FROM PartnerApplication ORDER BY createdAt DESC LIMIT 500')); }
  catch (e: any) { res.status(500).json({ error: e?.message || 'Fout' }); }
});

router.get('/admin/new-count', ...admin, async (_req: Request, res: Response) => {
  try { res.json({ count: (await q("SELECT COUNT(*) n FROM PartnerApplication WHERE status = 'NEW'"))[0]?.n ?? 0 }); }
  catch { res.json({ count: 0 }); }
});

router.put('/admin/:id', ...admin, async (req: Request, res: Response) => {
  const status = String(req.body?.status || '');
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Ongeldige status' });
  try {
    await pool.execute('UPDATE `PartnerApplication` SET `status` = ?, `notes` = ? WHERE `id` = ?', [status, req.body?.notes ? String(req.body.notes).slice(0, 5000) : null, String(req.params.id)]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'Opslaan mislukt' }); }
});

router.delete('/admin/:id', ...admin, async (req: Request, res: Response) => {
  try { await pool.execute('DELETE FROM `PartnerApplication` WHERE `id` = ?', [String(req.params.id)]); res.json({ ok: true }); }
  catch (e: any) { res.status(500).json({ error: e?.message || 'Verwijderen mislukt' }); }
});

export default router;
