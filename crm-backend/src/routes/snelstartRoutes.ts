import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import { 
  getSnelstartConfig, updateSnelstartConfig, 
  getSyncLogs, retrySync,
  getLedgers, createLedger, deleteLedger
} from '../controllers/snelstartController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/config', getSnelstartConfig);
router.put('/config', updateSnelstartConfig);
router.get('/logs', getSyncLogs);
router.post('/retry', retrySync);

router.get('/ledgers', getLedgers);
router.post('/ledgers', createLedger);
router.delete('/ledgers/:id', deleteLedger);

export default router;
