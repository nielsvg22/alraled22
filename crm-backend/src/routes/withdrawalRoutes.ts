import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitWithdrawal } from '../controllers/withdrawalController';

const router = Router();
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Te veel meldingen. Probeer het later opnieuw of mail naar info@alra-led.nl.' } });
router.post('/', limiter, submitWithdrawal);
export default router;
