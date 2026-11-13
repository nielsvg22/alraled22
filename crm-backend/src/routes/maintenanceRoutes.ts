import { Router, Response } from 'express';
import { sql } from 'drizzle-orm';
import { pool } from '../lib/db';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { GUEST_EMAIL_DOMAIN } from '../controllers/orderController';

// Opruimen van testdata (bestellingen, offertes, retouren) vóór de échte livegang.
// Twee stappen: eerst een voorbeeld met aantallen, dan verwijderen met een bevestigingswoord.
// Alleen items die vóór het tijdstip van het voorbeeld zijn aangemaakt worden verwijderd (nieuwe bestellingen blijven staan).
const router = Router();
router.use(authMiddleware, adminMiddleware);

const CONFIRM_WORD = 'VERWIJDER';

async function q(query: string, params: any[] = []): Promise<any[]> {
  const [rows] = (await pool.query(query, params)) as any;
  return rows as any[];
}

router.get('/test-data/preview', async (_req: AuthRequest, res: Response) => {
  try {
    const cutoff = new Date();
    const c = cutoff;
    const orders = (await q('SELECT COUNT(*) n, MIN(createdAt) oldest, MAX(createdAt) newest, COALESCE(SUM(total),0) total FROM `Order` WHERE createdAt < ?', [c]))[0];
    const paid = (await q("SELECT COUNT(*) n FROM `Payment` p JOIN `Order` o ON o.id = p.orderId WHERE o.createdAt < ? AND p.molliePaymentId IS NOT NULL", [c]))[0];
    const shipments = (await q('SELECT COUNT(*) n FROM `Order` WHERE createdAt < ? AND sendcloudShipmentId IS NOT NULL', [c]))[0];
    const sample = await q('SELECT o.id, o.createdAt, o.status, o.total, o.customerEmail, o.shippingName FROM `Order` o WHERE o.createdAt < ? ORDER BY o.createdAt DESC LIMIT 8', [c]);
    const quotes = (await q('SELECT COUNT(*) n, MIN(createdAt) oldest, MAX(createdAt) newest FROM `Quote` WHERE createdAt < ?', [c]))[0];
    const rmas = (await q('SELECT COUNT(*) n FROM `Rma` r JOIN `Order` o ON o.id = r.orderId WHERE o.createdAt < ?', [c]))[0];
    const guests = (await q("SELECT COUNT(*) n FROM `User` WHERE email LIKE ?", [`gast-%${GUEST_EMAIL_DOMAIN}`]))[0];
    const notes = (await q("SELECT COUNT(*) n FROM `Notification` WHERE type = 'quote' AND createdAt < ?", [c]))[0];
    res.json({
      cutoff: cutoff.toISOString(),
      orders: { count: Number(orders.n), oldest: orders.oldest, newest: orders.newest, total: Number(orders.total), withMolliePayment: Number(paid.n), withShipment: Number(shipments.n), sample },
      quotes: { count: Number(quotes.n), oldest: quotes.oldest, newest: quotes.newest },
      rmas: Number(rmas.n),
      guestAccounts: Number(guests.n),
      quoteNotifications: Number(notes.n),
    });
  } catch (err: any) {
    console.error('[maintenance] preview', err);
    res.status(500).json({ error: 'Voorbeeld ophalen mislukt' });
  }
});

router.post('/test-data/purge', async (req: AuthRequest, res: Response) => {
  const cutoff = new Date(String(req.body?.cutoff || ''));
  if (Number.isNaN(cutoff.getTime()) || req.body?.confirm !== CONFIRM_WORD) {
    return res.status(400).json({ error: `Bevestiging ontbreekt (typ ${CONFIRM_WORD}) of tijdstip ongeldig` });
  }
  if (cutoff.getTime() > Date.now() + 60_000) return res.status(400).json({ error: 'Tijdstip ligt in de toekomst' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ids = ((await conn.query('SELECT id, status FROM `Order` WHERE createdAt < ?', [cutoff]) as any)[0] as any[]);
    const orderIds = ids.map((o) => o.id);
    let restored = 0;
    if (orderIds.length) {
      // Voorraad terugzetten voor bestellingen die niet geannuleerd zijn (die hadden de voorraad verlaagd)
      const live = ids.filter((o) => o.status !== 'CANCELLED').map((o) => o.id);
      if (live.length) {
        const items = ((await conn.query('SELECT productId, quantity FROM `OrderItem` WHERE orderId IN (?) AND productId IS NOT NULL', [live]) as any)[0] as any[]);
        for (const it of items) {
          await conn.query('UPDATE `Product` SET stock = stock + ? WHERE id = ?', [it.quantity, it.productId]);
          restored += Number(it.quantity);
        }
      }
      await conn.query('DELETE FROM `RmaItem` WHERE rmaId IN (SELECT id FROM `Rma` WHERE orderId IN (?))', [orderIds]);
      await conn.query('DELETE FROM `Rma` WHERE orderId IN (?)', [orderIds]);
      await conn.query('DELETE FROM `SnelstartSyncLog` WHERE orderId IN (?)', [orderIds]);
      await conn.query('DELETE FROM `Payment` WHERE orderId IN (?)', [orderIds]);
      await conn.query('DELETE FROM `OrderItem` WHERE orderId IN (?)', [orderIds]);
      await conn.query('DELETE FROM `Order` WHERE id IN (?)', [orderIds]);
    }
    const quotes = ((await conn.query('DELETE FROM `Quote` WHERE createdAt < ?', [cutoff]) as any)[0]);
    const notes = ((await conn.query("DELETE FROM `Notification` WHERE type = 'quote' AND createdAt < ?", [cutoff]) as any)[0]);
    // Gastaccounts zonder bestellingen opruimen (alleen de automatisch aangemaakte gastaccounts)
    const guests = ((await conn.query("DELETE FROM `User` WHERE email LIKE ? AND id NOT IN (SELECT userId FROM `Order`) AND id NOT IN (SELECT userId FROM `Rma`)", [`gast-%${GUEST_EMAIL_DOMAIN}`]) as any)[0]);
    await conn.commit();
    res.json({ ok: true, deleted: { orders: orderIds.length, quotes: quotes.affectedRows, quoteNotifications: notes.affectedRows, guestAccounts: guests.affectedRows }, stockRestoredUnits: restored });
  } catch (err: any) {
    await conn.rollback();
    console.error('[maintenance] purge', err);
    res.status(500).json({ error: 'Verwijderen mislukt; er is niets gewijzigd' });
  } finally {
    conn.release();
  }
});

export default router;
