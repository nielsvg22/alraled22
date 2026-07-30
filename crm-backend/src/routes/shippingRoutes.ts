import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getSettings,
  updateSettings,
  listShippingMethods,
  getRates,
  createShipmentLabel,
  downloadLabel,
  testShipment,
} from '../controllers/shippingController';

const router = Router();

router.get('/settings', authMiddleware, getSettings);
router.put('/settings', authMiddleware, updateSettings);
router.get('/methods', authMiddleware, listShippingMethods);
router.get('/rates', authMiddleware, getRates);
router.post('/shipment', authMiddleware, createShipmentLabel);
router.get('/label/:id', authMiddleware, downloadLabel);
router.post('/test-shipment', authMiddleware, testShipment);

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
