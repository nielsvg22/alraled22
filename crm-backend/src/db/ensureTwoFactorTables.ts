import { pool } from '../lib/db';

// Twee-staps verificatie voor admins. Eigen tabellen (geen wijziging aan de User-tabel), veilig bij elke start.
const TWO_FACTOR_DDL = `CREATE TABLE IF NOT EXISTS \`UserTwoFactor\` (
  \`userId\` varchar(36) NOT NULL,
  \`secret\` varchar(64) NOT NULL,
  \`enabled\` tinyint(1) NOT NULL DEFAULT 0,
  \`backupCodes\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`userId\`)
)`;

const TRUSTED_DEVICE_DDL = `CREATE TABLE IF NOT EXISTS \`TrustedDevice\` (
  \`id\` varchar(36) NOT NULL,
  \`userId\` varchar(36) NOT NULL,
  \`tokenHash\` varchar(64) NOT NULL,
  \`expiresAt\` timestamp NOT NULL,
  \`userAgent\` varchar(255),
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`TrustedDevice_user_idx\` (\`userId\`),
  KEY \`TrustedDevice_hash_idx\` (\`tokenHash\`)
)`;

export async function ensureTwoFactorTables(): Promise<void> {
  await pool.execute(TWO_FACTOR_DDL);
  await pool.execute(TRUSTED_DEVICE_DDL);
  console.log('[db] UserTwoFactor/TrustedDevice tables ensured');
}
