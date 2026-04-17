import { db } from '../lib/db';
import { orders } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Response } from 'express';
import * as productsRepo from '../db/productsRepo';
import { AuthRequest } from '../middleware/authMiddleware';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || !role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orderWhere = role === 'ADMIN' ? undefined : eq(orders.userId, userId);

    const inventory = await productsRepo.getInventorySummary();

    const allOrders = db.query.orders.findMany({
      where: orderWhere,
      with: { items: true },
    }).sync();

    const latestOrders = db.query.orders.findMany({
      where: orderWhere,
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 5,
      with: {
        user: { columns: { name: true, email: true } },
        items: {
          with: {
            product: { columns: { id: true, name: true } },
          },
        },
      },
    }).sync();

    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders = allOrders.filter((order) => ['PENDING', 'PROCESSING'].includes(order.status)).length;

    const monthlyRevenueMap = new Map<string, number>();
    for (const order of allOrders) {
      const key = order.createdAt.slice(0, 7);
      monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) ?? 0) + order.total);
    }

    const revenueSeries = Array.from(monthlyRevenueMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({ month, revenue }));

    res.json({
      totalProducts: inventory.totalProducts,
      totalOrders,
      totalRevenue,
      avgOrderValue,
      pendingOrders,
      lowStockProducts: inventory.lowStockProducts,
      outOfStockProducts: inventory.outOfStockProducts,
      healthyInventoryProducts: inventory.healthyInventoryProducts,
      recentOrders: latestOrders,
      revenueSeries,
      scope: role === 'ADMIN' ? 'global' : 'personal',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load dashboard stats', message: error?.message || String(error) });
  }
}
