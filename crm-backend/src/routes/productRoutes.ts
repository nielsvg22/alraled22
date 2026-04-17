import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductRelations,
  getProductPriceTiers,
  setProductPriceTiers,
  addProductRelation,
  deleteProductRelation,
} from '../controllers/productController';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/relations', getProductRelations);
router.get('/:id/price-tiers', getProductPriceTiers);
router.post('/', authMiddleware, adminMiddleware, createProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);
router.put('/:id/price-tiers', authMiddleware, adminMiddleware, setProductPriceTiers);
router.post('/:id/relations', authMiddleware, adminMiddleware, addProductRelation);
router.delete('/:id/relations/:relationId', authMiddleware, adminMiddleware, deleteProductRelation);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

export default router;
