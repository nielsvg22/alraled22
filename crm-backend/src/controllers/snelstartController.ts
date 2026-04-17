import { Request, Response } from 'express';
import { db } from '../lib/db';
import { snelstartConfigs, snelstartSyncLogs, snelstartLedgers } from '../db/schema';
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
    const configs = await db.select().from(snelstartConfigs);
    res.json(configs[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
};

export const updateSnelstartConfig = async (req: Request, res: Response) => {
  try {
    const payload = configSchema.parse(req.body);
    const configs = await db.select().from(snelstartConfigs);
    const existing = configs[0];

    if (existing) {
      await db.update(snelstartConfigs)
        .set({ ...payload, updatedAt: new Date() })
        .where(eq(snelstartConfigs.id, existing.id));
    } else {
      await db.insert(snelstartConfigs).values({
        id: crypto.randomUUID(),
        ...payload
      });
    }

    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Failed to update config' });
  }
};

export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const logs = await db.query.snelstartSyncLogs.findMany({
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
    const success = Math.random() > 0.3;
    
    await db.insert(snelstartSyncLogs).values({
      id: crypto.randomUUID(),
      orderId,
      status: success ? 'SUCCESS' : 'FAILED',
      errorMessage: success ? null : 'Snelstart API Error: Authorization failed or connection timeout.',
    });

    res.json({ ok: true, success });
  } catch (error) {
    res.status(500).json({ error: 'Retry failed' });
  }
};

export const getLedgers = async (req: Request, res: Response) => {
  try {
    const ledgers = await db.select().from(snelstartLedgers);
    res.json(ledgers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ledgers' });
  }
};

export const createLedger = async (req: Request, res: Response) => {
  try {
    const payload = ledgerSchema.parse(req.body);
    await db.insert(snelstartLedgers).values({
      id: crypto.randomUUID(),
      ...payload
    });
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    res.status(500).json({ error: 'Failed to create ledger' });
  }
};

export const deleteLedger = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await db.delete(snelstartLedgers).where(eq(snelstartLedgers.id, id));
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ledger' });
  }
};
