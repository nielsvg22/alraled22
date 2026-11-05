import { Router } from 'express';
import { createOrder, getOrderById, getOrders, getOrderInvoicePdf, updateOrderStatus } from '../controllers/orderController';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Bestellen kan altijd, ook zonder account (gast). Alle andere order-routes vragen om inloggen.
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please try again later' } });
router.post('/', orderLimiter, optionalAuthMiddleware, createOrder);

router.use(authMiddleware);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/:id/invoice', getOrderInvoicePdf);
router.patch('/:id/status', adminMiddleware, updateOrderStatus);

export default router;
