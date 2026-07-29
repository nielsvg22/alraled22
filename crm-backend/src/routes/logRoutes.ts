import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { getLogs, getLogCount } from '../lib/logger';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;
    const logs = await getLogs(type, limit, offset);
    const total = await getLogCount(type);
    res.json({ logs, total, limit, offset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
