import { Router } from 'express';
import { createOrder, getOrders, getOrderInvoicePdf, updateOrderStatus } from '../controllers/orderController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id/invoice', getOrderInvoicePdf);
router.patch('/:id/status', adminMiddleware, updateOrderStatus);

export default router;
