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

    console.log('[migrate] All migrations completed');
  } finally {
    conn.release();
  }
}
