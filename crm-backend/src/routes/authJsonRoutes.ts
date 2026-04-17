import { Router } from 'express';
import { listUsers, login, me, register, setUserCustomerGroup } from '../controllers/authJsonController';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.get('/users', authMiddleware, adminMiddleware, listUsers);
router.patch('/users/:id/customer-group', authMiddleware, adminMiddleware, setUserCustomerGroup);

export default router;
