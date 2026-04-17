import { Router } from 'express';
import { fetchContent, saveContent } from '../controllers/contentController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/:key', fetchContent);
router.put('/:key', authMiddleware, adminMiddleware, saveContent);

export default router;
