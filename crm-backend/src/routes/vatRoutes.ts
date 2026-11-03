import { Router } from 'express';
import { checkVatNumber, qualifiesForReverseCharge } from '../lib/vat';

const router = Router();

// Publiek (de webshop controleert het BTW-nummer tijdens het afrekenen); de server controleert het bij bestellen opnieuw.
router.post('/validate', async (req, res) => {
  const vatNumber = String(req.body?.vatNumber || '');
  const shippingCountry = String(req.body?.shippingCountry || 'NL');
  const check = await checkVatNumber(vatNumber, shippingCountry);
  res.json({ ...check, reverseCharge: qualifiesForReverseCharge(check, shippingCountry) });
});

export default router;
