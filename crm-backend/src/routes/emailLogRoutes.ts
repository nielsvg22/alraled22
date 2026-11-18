import { Router, Response } from 'express';
import { pool } from '../lib/db';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { resendLoggedEmail } from '../lib/emailService';

// Overzicht van alle uitgaande e-mails voor de beheerder (ook als SMTP niet is gekoppeld).
const router = Router();
router.use(authMiddleware, adminMiddleware);

async function q(query: string, params: any[] = []): Promise<any[]> {
  const [rows] = (await pool.query(query, params)) as any;
  return rows as any[];
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const status = String(req.query.status || '');
    const search = String(req.query.search || '').trim();
    const where: string[] = []; const params: any[] = [];
    if (status && ['SENT', 'FAILED', 'NOT_SENT'].includes(status)) { where.push('status = ?'); params.push(status); }
    if (req.query.unseen === '1') where.push('seen = 0');
    if (search) { where.push('(toEmail LIKE ? OR subject LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await q(`SELECT id, toEmail, fromEmail, subject, status, error, seen, createdAt FROM EmailLog ${w} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    const total = (await q(`SELECT COUNT(*) n FROM EmailLog ${w}`, params))[0]?.n ?? 0;
    const unseen = (await q('SELECT COUNT(*) n FROM EmailLog WHERE seen = 0'))[0]?.n ?? 0;
    res.json({ items: rows, total, unseen });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'Fout' }); }
});

router.get('/unseen-count', async (_req: AuthRequest, res: Response) => {
  try { res.json({ unseen: (await q('SELECT COUNT(*) n FROM EmailLog WHERE seen = 0'))[0]?.n ?? 0 }); }
  catch { res.json({ unseen: 0 }); }
});

router.post('/mark-all-seen', async (_req: AuthRequest, res: Response) => {
  try { await pool.execute('UPDATE EmailLog SET seen = 1 WHERE seen = 0'); res.json({ ok: true }); }
  catch (e: any) { res.status(500).json({ error: e?.message || 'Fout' }); }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const row = (await q('SELECT * FROM EmailLog WHERE id = ?', [String(req.params.id)]))[0];
    if (!row) return res.status(404).json({ error: 'Niet gevonden' });
    if (!row.seen) await pool.execute('UPDATE EmailLog SET seen = 1 WHERE id = ?', [String(req.params.id)]);
    res.json(row);
  } catch (e: any) { res.status(500).json({ error: e?.message || 'Fout' }); }
});

router.post('/:id/resend', async (req: AuthRequest, res: Response) => {
  try {
    const r = await resendLoggedEmail(String(req.params.id));
    res.status(r.ok ? 200 : 400).json(r);
  } catch (e: any) { res.status(500).json({ ok: false, error: e?.message || 'Fout' }); }
});

export default router;
