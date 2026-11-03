import { Router } from 'express';
import { listUsers, login, me, register, setUserCustomerGroup } from '../controllers/authJsonController';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware';
import * as twoFactor from '../controllers/twoFactorController';

const wrap = (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res)).catch((err) => {
  if (err && err.name === 'ZodError') return res.status(400).json({ error: 'Invalid data' });
  return next(err);
});

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.get('/users', authMiddleware, adminMiddleware, listUsers);
router.patch('/users/:id/customer-group', authMiddleware, adminMiddleware, setUserCustomerGroup);

// Twee-staps verificatie (alleen admins)
router.get('/2fa/status', authMiddleware, adminMiddleware, wrap(twoFactor.status));
// Instellen tijdens het inloggen (setup-token uit /login, geen sessie nodig)
router.post('/2fa/login-setup', wrap(twoFactor.loginSetup));
router.post('/2fa/login-enable', wrap(twoFactor.loginEnable));
router.post('/2fa/setup', authMiddleware, adminMiddleware, wrap(twoFactor.setup));
router.post('/2fa/enable', authMiddleware, adminMiddleware, wrap(twoFactor.enable));
router.post('/2fa/disable', authMiddleware, adminMiddleware, wrap(twoFactor.disable));
router.post('/users/:id/2fa/reset', authMiddleware, adminMiddleware, wrap(twoFactor.adminReset));

export default router;
