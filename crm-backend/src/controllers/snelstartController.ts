import { Request, Response } from 'express';
import { db } from '../lib/db';
import { snelstartConfigs, snelstartSyncLogs, snelstartLedgers, orders, users } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const configSchema = z.object({
  apiKey: z.string().optional(),
  clientKey: z.string().optional(),
  ledgerNumberSales: z.string().optional(),
  ledgerNumberVat21: z.string().optional(),
  ledgerNumberVat9: z.string().optional(),
  ledgerNumberVat0: z.string().optional(),
  ledgerNumberShipping: z.string().optional(),
  snelstartVatCode21: z.string().optional(),
  snelstartVatCode9: z.string().optional(),
  snelstartVatCode0: z.string().optional(),
  enabled: z.number().int().min(0).max(1).optional(),
});

const ledgerSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['SALES', 'VAT', 'SHIPPING', 'OTHER']),
});

export const getSnelstartConfig = async (req: Request, res: Response) => {
  try {
    const config = db.select().from(snelstartConfigs).get();
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
};

export const updateSnelstartConfig = async (req: Request, res: Response) => {
  try {
    const payload = configSchema.parse(req.body);
    const existing = db.select().from(snelstartConfigs).get();

    if (existing) {
      db.update(snelstartConfigs)
        .set({ ...payload, updatedAt: new Date().toISOString() })
        .where(eq(snelstartConfigs.id, existing.id))
        .run();
    } else {
      db.insert(snelstartConfigs).values(payload).run();
    }

    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Failed to update config' });
  }
};

export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const logs = db.query.snelstartSyncLogs.findMany({
      orderBy: [desc(snelstartSyncLogs.syncedAt)],
      with: {
        order: {
          with: {
            user: true
          }
        }
      },
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    console.error('Sync logs error:', error);
    res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
};

export const retrySync = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });

  try {
    // Hier zou de echte Snelstart koppeling komen.
    // Voor nu maken we een succesvolle of mislukte log entry aan om de UI te kunnen testen.
    const success = Math.random() > 0.3; // 70% kans op succes voor demo doeleinden
    
    db.insert(snelstartSyncLogs).values({
      orderId,
      status: success ? 'SUCCESS' : 'FAILED',
      errorMessage: success ? null : 'Snelstart API Error: Authorization failed or connection timeout.',
    }).run();

    res.json({ ok: true, success });
  } catch (error) {
    res.status(500).json({ error: 'Retry failed' });
  }
};

export const getLedgers = async (req: Request, res: Response) => {
  try {
    const ledgers = db.select().from(snelstartLedgers).all();
    res.json(ledgers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ledgers' });
  }
};

export const createLedger = async (req: Request, res: Response) => {
  try {
    const payload = ledgerSchema.parse(req.body);
    db.insert(snelstartLedgers).values(payload).run();
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Failed to create ledger' });
  }
};

export const deleteLedger = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    db.delete(snelstartLedgers).where(eq(snelstartLedgers.id, id)).run();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ledger' });
  }
};
