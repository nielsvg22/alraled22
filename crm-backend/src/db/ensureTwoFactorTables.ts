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

// Noodhulp: staat RESET_2FA_EMAILS (komma-gescheiden e-mailadressen) in de serveromgeving, dan wordt de 2FA van die accounts
// bij het opstarten gewist; ze stellen het daarna opnieuw in. Variabele daarna weer verwijderen.
export async function resetTwoFactorFromEnv(): Promise<void> {
  const emails = String(process.env.RESET_2FA_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  for (const email of emails) {
    const [rows] = await pool.execute('SELECT id FROM `User` WHERE LOWER(email) = ? LIMIT 1', [email]);
    const user = (rows as any[])[0];
    if (!user) { console.log(`[2fa] reset: geen account voor ${email}`); continue; }
    await pool.execute('DELETE FROM `UserTwoFactor` WHERE userId = ?', [user.id]);
    await pool.execute('DELETE FROM `TrustedDevice` WHERE userId = ?', [user.id]);
    console.log(`[2fa] reset: twee-staps verificatie van ${email} gewist`);
  }
}

export async function ensureTwoFactorTables(): Promise<void> {
  await pool.execute(TWO_FACTOR_DDL);
  await pool.execute(TRUSTED_DEVICE_DDL);
  console.log('[db] UserTwoFactor/TrustedDevice tables ensured');
}
