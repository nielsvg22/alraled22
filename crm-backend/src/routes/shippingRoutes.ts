import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getSettings,
  updateSettings,
  listShippingMethods,
  getRates,
  createShipmentLabel,
  downloadLabel,
  testShipment,
  uploadCarrierLogo,
  deleteCarrierLogo,
} from '../controllers/shippingController';

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `carrier-${randomUUID()}${ext}`);
  },
});

const logoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Alleen afbeeldingen zijn toegestaan'));
    }
  },
});

const router = Router();

router.get('/settings', authMiddleware, getSettings);
router.put('/settings', authMiddleware, updateSettings);
router.get('/methods', authMiddleware, listShippingMethods);
router.get('/rates', authMiddleware, getRates);
router.post('/shipment', authMiddleware, createShipmentLabel);
router.get('/label/:id', authMiddleware, downloadLabel);
router.post('/test-shipment', authMiddleware, testShipment);
router.post('/carrier-logo/:carrierCode', authMiddleware, logoUpload.single('logo'), uploadCarrierLogo);
router.delete('/carrier-logo/:carrierCode', authMiddleware, deleteCarrierLogo);

// Public endpoint for checkout
router.get('/methods/public', async (req, res) => {
  try {
    const { getShippingMethods } = await import('../lib/sendcloud');
    const country = (req.query.country as string) || 'NL';
    const methods = await getShippingMethods(country);
    res.json(methods);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
