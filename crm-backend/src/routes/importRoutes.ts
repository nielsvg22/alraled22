import { Router } from 'express';
import { importWordpress, scrapeSpecs, importText } from '../controllers/importController';

const router = Router();

router.post('/wordpress', importWordpress);
router.post('/scrape-specs', scrapeSpecs);
router.post('/text', importText);

export default router;
