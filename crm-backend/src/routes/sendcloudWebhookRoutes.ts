import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { eq, like } from 'drizzle-orm';
import { db } from '../lib/db';
import { orders } from '../db/schema';
import { getOrderWithRelations } from '../controllers/orderController';
import { sendStatusUpdate } from '../lib/emailService';
import { getSendcloudSettings } from '../lib/sendcloud';

// Ontvangt statusupdates van Sendcloud (parcel_status_changed) en zet de bestelstatus bij:
// onderweg -> SHIPPED, bezorgd -> DELIVERED. De klant krijgt dan de bestaande statusmail.
// Beveiliging: de handtekening (header Sendcloud-Signature, HMAC-SHA256 over de ruwe body) wordt gecontroleerd
// met de sleutel uit SENDCLOUD_WEBHOOK_KEY (of, als alternatief, de CRM-instelling `webhookSignatureKey`).
const router = Router();

const RANK: Record<string, number> = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3 };

function mapStatus(id: unknown, message: unknown): 'SHIPPED' | 'DELIVERED' | null {
  const msg = String(message || '').toLowerCase();
  if (Number(id) === 11 || (/deliver/.test(msg) && !/fail|attempt|unable|not |delay|expect|ready/.test(msg))) return 'DELIVERED';
  if (/en route|in transit|sorted|picked up|collected by|driver|out for delivery|parcel en route|shipped/.test(msg) && !/not sorted/.test(msg)) return 'SHIPPED';
  return null;
}

async function signatureKey(): Promise<string> {
  const env = (process.env.SENDCLOUD_WEBHOOK_KEY || '').trim();
  if (env) return env;
  try { return String((await getSendcloudSettings() as any).webhookSignatureKey || '').trim(); } catch { return ''; }
}

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const key = await signatureKey();
    if (!key) return res.status(503).json({ error: 'Webhook niet geconfigureerd' });
    const raw: Buffer | undefined = (req as any).rawBody;
    const given = String(req.headers['sendcloud-signature'] || '').trim().toLowerCase();
    if (!raw || !given) return res.status(401).json({ error: 'Handtekening ontbreekt' });
    const expected = crypto.createHmac('sha256', key).update(raw).digest('hex');
    const a = Buffer.from(expected); const b = Buffer.from(given);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Ongeldige handtekening' });

    const body = req.body || {};
    if (body.action && body.action !== 'parcel_status_changed') return res.json({ ok: true, ignored: body.action });
    const parcel = body.parcel || {};
    const newStatus = mapStatus(parcel.status?.id, parcel.status?.message);
    if (!newStatus) return res.json({ ok: true, ignored: 'status' });

    // Order vinden: via shipment-id, anders via ordernummer (eerste 8 tekens van het order-id)
    let found = parcel.id ? (await db.select().from(orders).where(eq(orders.sendcloudShipmentId, String(parcel.id))))[0] : undefined;
    const num = String(parcel.order_number || '').trim();
    if (!found && /^[0-9a-f]{8}$/i.test(num)) found = (await db.select().from(orders).where(like(orders.id, `${num.toLowerCase()}%`)))[0];
    if (!found) return res.json({ ok: true, ignored: 'order niet gevonden' });

    const current = String((found as any).status);
    const changes: Record<string, unknown> = {};
    if (parcel.tracking_number && !(found as any).trackingNumber) changes.trackingNumber = String(parcel.tracking_number).slice(0, 255);
    if (parcel.tracking_url && !(found as any).trackingUrl) changes.trackingUrl = String(parcel.tracking_url).slice(0, 512);
    const advance = (RANK[newStatus] ?? 0) > (RANK[current] ?? 99); // nooit terug; geannuleerd blijft geannuleerd
    if (advance) changes.status = newStatus;
    if (Object.keys(changes).length) await db.update(orders).set({ ...changes, updatedAt: new Date() } as any).where(eq(orders.id, found.id));

    if (advance) {
      const full = await getOrderWithRelations(found.id);
      if (full) sendStatusUpdate(full as any).catch(() => {});
    }
    res.json({ ok: true, status: advance ? newStatus : current });
  } catch (e: any) {
    console.error('[sendcloud-webhook]', e?.message);
    res.status(500).json({ error: 'Fout' });
  }
});

export default router;
