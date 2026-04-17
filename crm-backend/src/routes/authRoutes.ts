import { Router } from 'express';
import { login, register, getUsers } from '../controllers/authController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', authMiddleware, adminMiddleware, getUsers);

export default router;
