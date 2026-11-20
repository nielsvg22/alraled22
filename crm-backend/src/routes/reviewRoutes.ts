import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pool } from '../lib/db';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

async function q(query: string, params: any[] = []): Promise<any[]> {
  const [rows] = (await pool.query(query, params)) as any;
  return rows as any[];
}

const lang = (l: unknown): 'nl' | 'en' | 'de' => (l === 'en' || l === 'de' ? l : 'nl');

// ── Publiek: gepubliceerde reviews, in de gevraagde taal (terugval op Nederlands) ──
router.get('/', async (req: Request, res: Response) => {
  try {
    const l = lang(req.query.lang);
    const where = ['published = 1'];
    const params: any[] = [];
    if (req.query.home === '1') where.push('showOnHome = 1');
    if (req.query.productId) { where.push('(productId = ? OR productId IS NULL)'); params.push(String(req.query.productId)); }
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const rows = await q(`SELECT * FROM Review WHERE ${where.join(' AND ')} ORDER BY sortOrder ASC, createdAt DESC LIMIT ?`, [...params, limit]);
    res.json(rows.map((r) => ({
      id: r.id, author: r.author, rating: r.rating, title: r.title, source: r.source, reviewedAt: r.reviewedAt, productId: r.productId,
      role: (l === 'en' ? r.roleEn : l === 'de' ? r.roleDe : r.role) || r.role || '',
      quote: (l === 'en' ? r.bodyEn : l === 'de' ? r.bodyDe : r.body) || r.body,
    })));
  } catch { res.status(500).json({ error: 'Reviews ophalen mislukt' }); }
});

// ── Beheer (alleen admin) ──
const admin = [authMiddleware, adminMiddleware];

const reviewSchema = z.object({
  author: z.string().trim().min(1, 'Naam is verplicht').max(255),
  role: z.string().trim().max(255).optional().nullable(),
  roleEn: z.string().trim().max(255).optional().nullable(),
  roleDe: z.string().trim().max(255).optional().nullable(),
  rating: z.coerce.number().int().min(0).max(5).default(5),
  title: z.string().trim().max(255).optional().nullable(),
  body: z.string().trim().min(1, 'Vul de reviewtekst in').max(5000),
  bodyEn: z.string().trim().max(5000).optional().nullable(),
  bodyDe: z.string().trim().max(5000).optional().nullable(),
  productId: z.string().trim().max(36).optional().nullable(),
  source: z.string().trim().max(100).optional().nullable(),
  reviewedAt: z.string().trim().max(40).optional().nullable(),
  published: z.coerce.boolean().default(true),
  showOnHome: z.coerce.boolean().default(true),
});
const nn = (v: unknown) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
const toDate = (v: unknown) => { const s = nn(v); if (!s) return null; const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d; };

router.get('/admin', ...admin, async (_req: Request, res: Response) => {
  try {
    const rows = await q('SELECT r.*, p.name AS productName FROM Review r LEFT JOIN `Product` p ON p.id = r.productId ORDER BY r.sortOrder ASC, r.createdAt DESC');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e?.message || 'Fout' }); }
});

router.post('/admin', ...admin, async (req: Request, res: Response) => {
  const p = reviewSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Ongeldige invoer' });
  try {
    const d = p.data; const id = randomUUID();
    const next = (await q('SELECT COALESCE(MAX(sortOrder), -1) + 1 AS n FROM Review'))[0]?.n ?? 0;
    await pool.execute(
      'INSERT INTO `Review` (`id`,`author`,`role`,`roleEn`,`roleDe`,`rating`,`title`,`body`,`bodyEn`,`bodyDe`,`productId`,`source`,`reviewedAt`,`published`,`showOnHome`,`sortOrder`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, d.author, nn(d.role), nn(d.roleEn), nn(d.roleDe), d.rating, nn(d.title), d.body, nn(d.bodyEn), nn(d.bodyDe), nn(d.productId), nn(d.source), toDate(d.reviewedAt), d.published ? 1 : 0, d.showOnHome ? 1 : 0, next],
    );
    res.status(201).json({ id });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'Opslaan mislukt' }); }
});

router.put('/admin/:id', ...admin, async (req: Request, res: Response) => {
  const p = reviewSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || 'Ongeldige invoer' });
  try {
    const d = p.data;
    await pool.execute(
      'UPDATE `Review` SET `author`=?,`role`=?,`roleEn`=?,`roleDe`=?,`rating`=?,`title`=?,`body`=?,`bodyEn`=?,`bodyDe`=?,`productId`=?,`source`=?,`reviewedAt`=?,`published`=?,`showOnHome`=? WHERE `id`=?',
      [d.author, nn(d.role), nn(d.roleEn), nn(d.roleDe), d.rating, nn(d.title), d.body, nn(d.bodyEn), nn(d.bodyDe), nn(d.productId), nn(d.source), toDate(d.reviewedAt), d.published ? 1 : 0, d.showOnHome ? 1 : 0, String(req.params.id)],
    );
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'Opslaan mislukt' }); }
});

router.post('/admin/reorder', ...admin, async (req: Request, res: Response) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
  try {
    for (let i = 0; i < ids.length; i++) await pool.execute('UPDATE `Review` SET `sortOrder` = ? WHERE `id` = ?', [i, ids[i]]);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e?.message || 'Volgorde opslaan mislukt' }); }
});

router.delete('/admin/:id', ...admin, async (req: Request, res: Response) => {
  try { await pool.execute('DELETE FROM `Review` WHERE `id` = ?', [String(req.params.id)]); res.json({ ok: true }); }
  catch (e: any) { res.status(500).json({ error: e?.message || 'Verwijderen mislukt' }); }
});

export default router;
