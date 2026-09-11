import { pool } from '../lib/db';

const CONTACT_SUBMISSION_DDL = `CREATE TABLE IF NOT EXISTS \`ContactSubmission\` (
  \`id\` varchar(36) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`subject\` varchar(255),
  \`message\` text NOT NULL,
  \`ip\` varchar(45),
  \`status\` enum('NEW','READ','ARCHIVED') NOT NULL DEFAULT 'NEW',
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`ContactSubmission_status_idx\` (\`status\`),
  KEY \`ContactSubmission_createdAt_idx\` (\`createdAt\`)
)`;

export async function ensureContactTable(): Promise<void> {
  await pool.execute(CONTACT_SUBMISSION_DDL);
  console.log('[db] ContactSubmission table ensured');
}