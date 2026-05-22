import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createPayment,
  getPaymentStatus,
  handleWebhook,
  getPaymentsForOrder,
  getPaymentMethods,
} from '../controllers/paymentController';

const router = Router();

router.post('/', authMiddleware, createPayment);
router.get('/methods', authMiddleware, getPaymentMethods);
router.get('/order/:orderId', authMiddleware, getPaymentsForOrder);
router.get('/status/:orderId', authMiddleware, getPaymentStatus);
router.post('/webhook', handleWebhook);

export default router;
