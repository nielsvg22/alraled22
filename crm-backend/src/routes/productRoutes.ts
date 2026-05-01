import { Router } from 'express';
import multer from 'multer';
import path from 'path';
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
  importProducts,
  improveImage,
} from '../controllers/productController';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware';

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), 'uploads');

const upload = multer({ dest: uploadsDir, limits: { fileSize: 10 * 1024 * 1024 } });

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
router.post('/import', authMiddleware, adminMiddleware, upload.single('file'), importProducts);
router.post('/improve-image', authMiddleware, adminMiddleware, improveImage);

export default router;
