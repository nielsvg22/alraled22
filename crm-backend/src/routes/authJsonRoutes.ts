import { Router } from 'express';
import {
  adminResetPassword,
  changePassword,
  listUsers,
  login,
  me,
  register,
  setUserCustomerGroup,
} from '../controllers/authJsonController';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.post('/change-password', authMiddleware, changePassword);
router.get('/users', authMiddleware, adminMiddleware, listUsers);
router.patch('/users/:id/customer-group', authMiddleware, adminMiddleware, setUserCustomerGroup);
// AIG/ADMIN-only. There is intentionally no endpoint anywhere that can read back
// an existing password — this route only ever returns a freshly generated one.
router.post('/users/:id/reset-password', authMiddleware, adminMiddleware, adminResetPassword);

export default router;
