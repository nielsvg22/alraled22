import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import { generateSecret, verifyTotp } from './totp';

export const TRUST_HOURS = 24; // "1 dag": een vertrouwd apparaat vraagt 24 uur geen nieuwe code

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export interface TwoFactorRow { userId: string; secret: string; enabled: number; backupCodes: string | null }

export async function getTwoFactor(userId: string): Promise<TwoFactorRow | null> {
  const [rows] = await pool.execute('SELECT userId, secret, enabled, backupCodes FROM `UserTwoFactor` WHERE userId = ? LIMIT 1', [userId]);
  const row = (rows as any[])[0];
  return row || null;
}

export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const row = await getTwoFactor(userId);
  return !!row && Number(row.enabled) === 1;
}

export async function beginSetup(userId: string): Promise<string> {
  const secret = generateSecret();
  await pool.execute(
    'INSERT INTO `UserTwoFactor` (userId, secret, enabled, backupCodes) VALUES (?, ?, 0, NULL) ON DUPLICATE KEY UPDATE secret = VALUES(secret), enabled = 0, backupCodes = NULL',
    [userId, secret],
  );
  return secret;
}

function makeBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 tekens
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

export async function finishSetup(userId: string, code: string): Promise<string[] | null> {
  const row = await getTwoFactor(userId);
  if (!row || !verifyTotp(row.secret, code)) return null;
  const codes = makeBackupCodes();
  const hashed = await Promise.all(codes.map(c => bcrypt.hash(c, 10)));
  await pool.execute('UPDATE `UserTwoFactor` SET enabled = 1, backupCodes = ? WHERE userId = ?', [JSON.stringify(hashed), userId]);
  return codes;
}

export async function disableTwoFactor(userId: string): Promise<void> {
  await pool.execute('DELETE FROM `UserTwoFactor` WHERE userId = ?', [userId]);
  await pool.execute('DELETE FROM `TrustedDevice` WHERE userId = ?', [userId]);
}

// Controleert een app-code of een herstelcode (eenmalig)
export async function verifyCode(userId: string, input: string): Promise<boolean> {
  const row = await getTwoFactor(userId);
  if (!row || Number(row.enabled) !== 1) return false;
  const code = String(input || '').trim();
  if (verifyTotp(row.secret, code)) return true;
  const normalized = code.toUpperCase().replace(/\s+/g, '');
  if (!/^[0-9A-F]{5}-?[0-9A-F]{5}$/.test(normalized)) return false;
  const withDash = normalized.includes('-') ? normalized : `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
  const hashes: string[] = row.backupCodes ? JSON.parse(row.backupCodes) : [];
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(withDash, hashes[i]!)) {
      hashes.splice(i, 1);
      await pool.execute('UPDATE `UserTwoFactor` SET backupCodes = ? WHERE userId = ?', [JSON.stringify(hashes), userId]);
      return true;
    }
  }
  return false;
}

export async function issueTrustedDevice(userId: string, userAgent: string | undefined): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await pool.execute(
    'INSERT INTO `TrustedDevice` (id, userId, tokenHash, expiresAt, userAgent) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR), ?)',
    [crypto.randomUUID(), userId, sha256(token), TRUST_HOURS, (userAgent || '').slice(0, 255)],
  );
  await pool.execute('DELETE FROM `TrustedDevice` WHERE expiresAt < NOW()');
  return token;
}

export async function isTrustedDevice(userId: string, token: string | undefined): Promise<boolean> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return false;
  const [rows] = await pool.execute('SELECT id FROM `TrustedDevice` WHERE userId = ? AND tokenHash = ? AND expiresAt > NOW() LIMIT 1', [userId, sha256(token)]);
  return (rows as any[]).length > 0;
}

// Pogingen beperken: 5 foute codes per account binnen 10 minuten → 10 minuten blokkade (in geheugen)
const WINDOW_MS = 10 * 60 * 1000;
const failures = new Map<string, { count: number; last: number }>();
export function isLocked(userId: string): boolean {
  const f = failures.get(userId);
  return !!f && f.count >= 5 && Date.now() - f.last < WINDOW_MS;
}
export function registerFailure(userId: string): void {
  const f = failures.get(userId);
  const count = f && Date.now() - f.last < WINDOW_MS ? f.count + 1 : 1;
  failures.set(userId, { count, last: Date.now() });
}
export function clearFailures(userId: string): void { failures.delete(userId); }
