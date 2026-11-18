import { pool } from '../lib/db';

// Uitgaande e-mails (verstuurd, mislukt of alleen bewaard omdat SMTP ontbreekt), zodat de beheerder niets mist.
const DDL = `CREATE TABLE IF NOT EXISTS \`EmailLog\` (
  \`id\` varchar(36) NOT NULL,
  \`toEmail\` varchar(255) NOT NULL,
  \`fromEmail\` varchar(255),
  \`replyTo\` varchar(255),
  \`subject\` varchar(500) NOT NULL,
  \`bodyText\` mediumtext,
  \`bodyHtml\` mediumtext,
  \`status\` varchar(12) NOT NULL,
  \`error\` varchar(600),
  \`seen\` boolean NOT NULL DEFAULT false,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`EmailLog_createdAt_idx\` (\`createdAt\`),
  KEY \`EmailLog_seen_idx\` (\`seen\`)
)`;

export async function ensureEmailLogTable(): Promise<void> {
  await pool.execute(DDL);
  console.log('[db] EmailLog table ensured');
}
