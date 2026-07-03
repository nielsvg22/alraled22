import { randomUUID } from 'node:crypto';
import { pool } from '../lib/db';

export async function runMigrations(): Promise<void> {
  const conn = await pool.getConnection();

  try {
    // Category table
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`Category\` (
      \`id\` varchar(36) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`slug\` varchar(255) NOT NULL,
      \`description\` text,
      \`imageUrl\` varchar(512),
      \`sortOrder\` int NOT NULL DEFAULT 0,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`Category_name_unique\` (\`name\`),
      UNIQUE KEY \`Category_slug_unique\` (\`slug\`)
    )`);

    // Add new columns to Product
    const columns = [
      { name: 'specs', def: 'text' },
      { name: 'categoryId', def: 'varchar(36)' },
      { name: 'pdfUrl', def: 'varchar(512)' },
      { name: 'videoUrl', def: 'varchar(512)' },
    ];

    for (const col of columns) {
      try {
        await conn.execute(`ALTER TABLE \`Product\` ADD COLUMN \`${col.name}\` ${col.def}`);
      } catch {
        // Column already exists
      }
    }

    // Add foreign key if not exists
    try {
      await conn.execute(
        `ALTER TABLE \`Product\` ADD CONSTRAINT \`Product_categoryId_Category_id_fk\` FOREIGN KEY (\`categoryId\`) REFERENCES \`Category\`(\`id\`) ON DELETE SET NULL`
      );
    } catch {
      // Constraint already exists
    }

    // Payment table
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`Payment\` (
      \`id\` varchar(36) NOT NULL,
      \`orderId\` varchar(36) NOT NULL,
      \`molliePaymentId\` varchar(255),
      \`molliePaymentUrl\` varchar(512),
      \`amount\` double NOT NULL,
      \`currency\` varchar(3) NOT NULL DEFAULT 'EUR',
      \`method\` varchar(50),
      \`status\` enum('PENDING','OPEN','CANCELLED','EXPIRED','FAILED','PAID') NOT NULL DEFAULT 'PENDING',
      \`paidAt\` timestamp NULL,
      \`metadata\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`Payment_orderId_index\` (\`orderId\`)
    )`);

    // Order table
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`Order\` (
      \`id\` varchar(36) NOT NULL,
      \`userId\` varchar(36) NOT NULL,
      \`total\` double NOT NULL,
      \`discountCodeId\` varchar(36),
      \`discountAmount\` double NOT NULL DEFAULT 0,
      \`status\` enum('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    )`);

    // OrderItem table
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`OrderItem\` (
      \`id\` varchar(36) NOT NULL,
      \`orderId\` varchar(36) NOT NULL,
      \`productId\` varchar(36) NOT NULL,
      \`quantity\` int NOT NULL,
      \`price\` double NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    )`);

    // ProductImage table
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`ProductImage\` (
      \`id\` varchar(36) NOT NULL,
      \`productId\` varchar(36) NOT NULL,
      \`url\` varchar(512) NOT NULL,
      \`sortOrder\` int NOT NULL DEFAULT 0,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    )`);

    // DiscountCode table
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`DiscountCode\` (
      \`id\` varchar(36) NOT NULL,
      \`code\` varchar(50) NOT NULL,
      \`type\` enum('PERCENTAGE','FIXED') NOT NULL DEFAULT 'PERCENTAGE',
      \`value\` double NOT NULL,
      \`minOrderAmount\` double NOT NULL DEFAULT 0,
      \`startDate\` timestamp NULL,
      \`endDate\` timestamp NULL,
      \`usageLimit\` int,
      \`usageCount\` int NOT NULL DEFAULT 0,
      \`active\` int NOT NULL DEFAULT 1,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`DiscountCode_code_unique\` (\`code\`)
    )`);

    console.log('[migrate] All migrations completed');
  } finally {
    conn.release();
  }
}
