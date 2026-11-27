import { pool } from '../lib/db';

// Product: eigen URL-naam (slug), SEO-titel en meta-omschrijving. Alleen toevoegen (bestaande data blijft ongemoeid).
export async function ensureProductSeoColumns(): Promise<void> {
  const [rows] = (await pool.query(
    "SELECT COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Product' AND COLUMN_NAME IN ('slug','seoTitle','metaDescription')",
  )) as any;
  const have = new Set((rows as any[]).map((r) => r.c));
  if (!have.has('slug')) await pool.execute('ALTER TABLE `Product` ADD COLUMN `slug` varchar(255) NULL');
  if (!have.has('seoTitle')) await pool.execute('ALTER TABLE `Product` ADD COLUMN `seoTitle` varchar(255) NULL');
  if (!have.has('metaDescription')) await pool.execute('ALTER TABLE `Product` ADD COLUMN `metaDescription` varchar(500) NULL');
  const [idx] = (await pool.query(
    "SELECT INDEX_NAME i FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Product' AND INDEX_NAME = 'Product_slug_unique'",
  )) as any;
  if (!(idx as any[]).length) await pool.execute('ALTER TABLE `Product` ADD UNIQUE INDEX `Product_slug_unique` (`slug`)');
  const [vc] = (await pool.query(
    "SELECT COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Product' AND COLUMN_NAME = 'videos'",
  )) as any;
  if (!(vc as any[]).length) await pool.execute('ALTER TABLE `Product` ADD COLUMN `videos` text NULL'); // JSON: [{ url, title }]
  console.log('[db] Product slug/seoTitle/metaDescription/videos ensured');
}
