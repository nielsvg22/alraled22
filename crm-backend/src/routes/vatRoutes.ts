import { Router } from 'express';
import { checkVatNumber, qualifiesForReverseCharge } from '../lib/vat';

const router = Router();

// Publiek (de webshop controleert het BTW-nummer tijdens het afrekenen); de server controleert het bij bestellen opnieuw.
router.post('/validate', async (req, res) => {
  const vatNumber = String(req.body?.vatNumber || '');
  const shippingCountry = String(req.body?.shippingCountry || 'NL');
  const t = req.body?.trader || {};
  const check = await checkVatNumber(vatNumber, shippingCountry, {
    name: String(t.name || '').slice(0, 120), street: String(t.street || '').slice(0, 120),
    postcode: String(t.postcode || '').slice(0, 20), city: String(t.city || '').slice(0, 80),
  });
  res.json({ ...check, reverseCharge: qualifiesForReverseCharge(check, shippingCountry) });
});

export default router;
