import { Router, Response } from 'express';
import { createQuotePdf, getDesign, saveDesign, previewDesign } from '../controllers/quoteController';
import { db } from '../lib/db';
import { quotes, notifications } from '../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.post('/pdf', createQuotePdf);
router.get('/design', authMiddleware, getDesign);
router.put('/design', authMiddleware, saveDesign);
router.post('/design/preview', authMiddleware, previewDesign);

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const all = await db.select().from(quotes).orderBy(desc(quotes.createdAt));
    res.json(all);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    await db.update(quotes).set({ status, updatedAt: new Date() }).where(eq(quotes.id, String(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const all = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(50);
    res.json(all);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notifications/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.read, 0));
    res.json({ count: result?.count || 0 });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/notifications/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await db.update(notifications).set({ read: 1 }).where(eq(notifications.read, 0));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
