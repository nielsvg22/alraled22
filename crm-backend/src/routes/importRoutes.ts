import { Router } from 'express';
import { importWordpress } from '../controllers/importController';

const router = Router();

router.post('/wordpress', importWordpress);

export default router;
