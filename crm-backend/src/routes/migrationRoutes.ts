import { Router, Response } from 'express';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/run', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const statements = [
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingName` varchar(255) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingCompany` varchar(255) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingAddress` varchar(255) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingPostcode` varchar(20) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingCity` varchar(100) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingCountry` varchar(2) DEFAULT 'NL'",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingPhone` varchar(50) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingMethod` varchar(100) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `shippingCost` double NOT NULL DEFAULT 0",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `trackingNumber` varchar(255) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `trackingUrl` varchar(512) DEFAULT NULL",
      "ALTER TABLE `Order` ADD COLUMN IF NOT EXISTS `sendcloudShipmentId` varchar(50) DEFAULT NULL",
    ];

    const results: string[] = [];
    for (const stmt of statements) {
      try {
        await db.execute(sql.raw(stmt));
        results.push(`OK: ${stmt.split('`')[1]}`);
      } catch (err: any) {
        if (err.message?.includes('Duplicate column')) {
          results.push(`SKIP: ${stmt.split('`')[1]} (bestaat al)`);
        } else {
          results.push(`ERR: ${stmt.split('`')[1]} - ${err.message}`);
        }
      }
    }

    // Create SendcloudConfig table
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS SendcloudConfig (
          \`key\` varchar(255) NOT NULL,
          value text NOT NULL,
          updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `));
      results.push('OK: SendcloudConfig tabel');
    } catch (err: any) {
      results.push(`ERR: SendcloudConfig - ${err.message}`);
    }

    res.json({ ok: true, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
