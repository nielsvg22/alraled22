import { Router } from 'express';
import { createQuotePdf } from '../controllers/quoteController';

const router = Router();

router.post('/pdf', createQuotePdf);

export default router;
