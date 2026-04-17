import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import { createCustomerGroup, deleteCustomerGroup, listCustomerGroups, updateCustomerGroup } from '../controllers/customerGroupController';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', listCustomerGroups);
router.post('/', createCustomerGroup);
router.patch('/:id', updateCustomerGroup);
router.delete('/:id', deleteCustomerGroup);

export default router;

