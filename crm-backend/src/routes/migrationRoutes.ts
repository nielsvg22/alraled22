import { Router, Response } from 'express';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/run', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const columns = [
      { name: 'shippingName', def: 'varchar(255) DEFAULT NULL' },
      { name: 'shippingCompany', def: 'varchar(255) DEFAULT NULL' },
      { name: 'shippingAddress', def: 'varchar(255) DEFAULT NULL' },
      { name: 'shippingPostcode', def: 'varchar(20) DEFAULT NULL' },
      { name: 'shippingCity', def: 'varchar(100) DEFAULT NULL' },
      { name: 'shippingCountry', def: "varchar(2) DEFAULT 'NL'" },
      { name: 'shippingPhone', def: 'varchar(50) DEFAULT NULL' },
      { name: 'shippingMethod', def: 'varchar(100) DEFAULT NULL' },
      { name: 'shippingCost', def: 'double NOT NULL DEFAULT 0' },
      { name: 'trackingNumber', def: 'varchar(255) DEFAULT NULL' },
      { name: 'trackingUrl', def: 'varchar(512) DEFAULT NULL' },
      { name: 'sendcloudShipmentId', def: 'varchar(50) DEFAULT NULL' },
    ];

    const results: string[] = [];

    for (const col of columns) {
      try {
        await db.execute(sql.raw(`ALTER TABLE \`Order\` ADD COLUMN \`${col.name}\` ${col.def}`));
        results.push(`OK: ${col.name}`);
      } catch (err: any) {
        if (err.message?.includes('Duplicate column') || err.errno === 1060) {
          results.push(`SKIP: ${col.name} (bestaat al)`);
        } else {
          results.push(`ERR: ${col.name} - ${err.message}`);
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

    // Create SystemLog table
    try {
      await db.execute(sql.raw(`
        CREATE TABLE IF NOT EXISTS SystemLog (
          id varchar(36) NOT NULL,
          type varchar(50) NOT NULL,
          level enum('INFO','WARN','ERROR') NOT NULL DEFAULT 'INFO',
          source varchar(100) NOT NULL,
          message text NOT NULL,
          details text DEFAULT NULL,
          orderId varchar(36) DEFAULT NULL,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX idx_type (type),
          INDEX idx_level (level),
          INDEX idx_createdAt (createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `));
      results.push('OK: SystemLog tabel');
    } catch (err: any) {
      results.push(`ERR: SystemLog - ${err.message}`);
    }

    res.json({ ok: true, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
