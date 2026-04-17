import { Router } from 'express';
import { createQuotePdf } from '../controllers/quoteController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/pdf', authMiddleware, createQuotePdf);

export default router;
