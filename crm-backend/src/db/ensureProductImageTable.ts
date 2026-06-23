import { randomUUID } from 'node:crypto';
import { pool } from '../lib/db';

const PRODUCT_IMAGE_DDL = `CREATE TABLE IF NOT EXISTS \`ProductImage\` (
  \`id\` varchar(36) NOT NULL,
  \`productId\` varchar(36) NOT NULL,
  \`url\` varchar(512) NOT NULL,
  \`sortOrder\` int NOT NULL DEFAULT 0,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`ProductImage_productId_idx\` (\`productId\`),
  CONSTRAINT \`ProductImage_productId_Product_id_fk\` FOREIGN KEY (\`productId\`) REFERENCES \`Product\` (\`id\`) ON DELETE CASCADE
)`;

type LegacyProductImage = {
  id: string;
  imageUrl: string | null;
  imageCount: number | string | null;
};

export async function ensureProductImageTable(): Promise<void> {
  await pool.execute(PRODUCT_IMAGE_DDL);

  const [rows] = await pool.query(
    `SELECT p.\`id\`, p.\`imageUrl\`, COUNT(pi.\`id\`) AS imageCount
     FROM \`Product\` p
     LEFT JOIN \`ProductImage\` pi ON pi.\`productId\` = p.\`id\`
     WHERE p.\`imageUrl\` IS NOT NULL AND p.\`imageUrl\` <> ''
     GROUP BY p.\`id\`, p.\`imageUrl\``
  );

  const products = rows as LegacyProductImage[];
  for (const product of products) {
    if (Number(product.imageCount || 0) > 0 || !product.imageUrl) continue;
    await pool.execute(
      `INSERT INTO \`ProductImage\` (\`id\`, \`productId\`, \`url\`, \`sortOrder\`) VALUES (?, ?, ?, 0)`,
      [randomUUID(), product.id, product.imageUrl]
    );
  }

  console.log('[db] ProductImage table ensured and legacy images backfilled');
}
