import { pool } from '../lib/db';

// Klantreviews (beheerd in het CRM onder "Reviews", getoond op de homepage en eventueel bij een product).
const DDL = `CREATE TABLE IF NOT EXISTS \`Review\` (
  \`id\` varchar(36) NOT NULL,
  \`author\` varchar(255) NOT NULL,
  \`role\` varchar(255),
  \`roleEn\` varchar(255),
  \`roleDe\` varchar(255),
  \`rating\` int NOT NULL DEFAULT 5,
  \`title\` varchar(255),
  \`body\` text NOT NULL,
  \`bodyEn\` text,
  \`bodyDe\` text,
  \`productId\` varchar(36),
  \`source\` varchar(100),
  \`reviewedAt\` timestamp NULL,
  \`published\` boolean NOT NULL DEFAULT true,
  \`showOnHome\` boolean NOT NULL DEFAULT true,
  \`sortOrder\` int NOT NULL DEFAULT 0,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`Review_published_idx\` (\`published\`),
  KEY \`Review_sortOrder_idx\` (\`sortOrder\`)
)`;

export async function ensureReviewTable(): Promise<void> {
  await pool.execute(DDL);
  console.log('[db] Review table ensured');
}
