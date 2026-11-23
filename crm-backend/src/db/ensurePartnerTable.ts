import { pool } from '../lib/db';

// Aanvragen "Word groothandelspartner" (formulier op de Groothandels-pagina), beheerd in het CRM.
const DDL = `CREATE TABLE IF NOT EXISTS \`PartnerApplication\` (
  \`id\` varchar(36) NOT NULL,
  \`company\` varchar(255) NOT NULL,
  \`contactName\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`phone\` varchar(50),
  \`website\` varchar(255),
  \`kvk\` varchar(30),
  \`vatNumber\` varchar(32),
  \`region\` varchar(255),
  \`message\` text,
  \`language\` varchar(2) NOT NULL DEFAULT 'nl',
  \`ip\` varchar(45),
  \`status\` varchar(12) NOT NULL DEFAULT 'NEW',
  \`notes\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`PartnerApplication_status_idx\` (\`status\`),
  KEY \`PartnerApplication_createdAt_idx\` (\`createdAt\`)
)`;

export async function ensurePartnerTable(): Promise<void> {
  await pool.execute(DDL);
  console.log('[db] PartnerApplication table ensured');
}
