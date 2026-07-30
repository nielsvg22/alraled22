import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  getSendcloudSettings,
  setSendcloudSettings,
  getShippingMethods,
  createShipment,
  createTestShipment,
  getShipmentLabel,
} from '../lib/sendcloud';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await getSendcloudSettings();
    const safe = { ...settings } as any;
    if (safe.apiKey) safe.apiKey = '••••' + safe.apiKey.slice(-4);
    if (safe.apiSecret) safe.apiSecret = '••••' + safe.apiSecret.slice(-4);
    res.json(safe);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    await setSendcloudSettings(req.body);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listShippingMethods = async (req: AuthRequest, res: Response) => {
  try {
    const country = (req.query.country as string) || 'NL';
    const methods = await getShippingMethods(country);
    res.json(methods);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getRates = async (req: AuthRequest, res: Response) => {
  try {
    const methods = await getShippingMethods((req.query.country as string) || 'NL');
    res.json(methods);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createShipmentLabel = async (req: AuthRequest, res: Response) => {
  try {
    const shipment = await createShipment(req.body);
    res.json(shipment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const downloadLabel = async (req: AuthRequest, res: Response) => {
  try {
    const label = await getShipmentLabel(Number(req.params.id));
    if (!label) return res.status(404).json({ error: 'Label niet gevonden' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="label-${req.params.id}.pdf"`);
    res.send(label);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testShipment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      receiverName,
      receiverAddress,
      receiverHouseNumber,
      receiverCity,
      receiverPostalCode,
      receiverCountry,
      receiverPhone,
      receiverEmail,
      orderNumber,
    } = req.body;

    if (!receiverName || !receiverAddress || !receiverCity || !receiverPostalCode) {
      return res.status(400).json({
        error: 'Verplichte velden ontbreken: receiverName, receiverAddress, receiverCity, receiverPostalCode',
      });
    }

    const shipment = await createTestShipment({
      receiverName,
      receiverAddress,
      receiverHouseNumber: receiverHouseNumber || '',
      receiverCity,
      receiverPostalCode,
      receiverCountry: receiverCountry || 'NL',
      receiverPhone,
      receiverEmail,
      orderNumber,
    });

    res.json({
      ok: true,
      message: 'Test shipment aangemaakt (Unstamped Letter - gratis)',
      shipment,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
