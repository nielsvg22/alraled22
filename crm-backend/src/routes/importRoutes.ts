import { Router } from 'express';
import { importWordpress, scrapeSpecs } from '../controllers/importController';

const router = Router();

router.post('/wordpress', importWordpress);
router.post('/scrape-specs', scrapeSpecs);

export default router;
