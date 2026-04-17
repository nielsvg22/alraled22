import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import { createRma, getRmaById, getRmas, updateRma } from '../controllers/rmaController';

const router = Router();

router.use(authMiddleware);

router.post('/', createRma);
router.get('/', getRmas);
router.get('/:id', getRmaById);
router.patch('/:id', adminMiddleware, updateRma);

export default router;

