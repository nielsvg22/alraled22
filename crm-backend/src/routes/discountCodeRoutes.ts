import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import { getDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode, validateDiscountCode } from '../controllers/discountCodeController';

const router = Router();

router.post('/validate', validateDiscountCode);

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', getDiscountCodes);
router.post('/', createDiscountCode);
router.put('/:id', updateDiscountCode);
router.delete('/:id', deleteDiscountCode);

export default router;
