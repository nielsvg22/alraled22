import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPasswordHash(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%^&*-_+=?';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

function randomChar(set: string): string {
  return set.charAt(crypto.randomInt(set.length));
}

/** Generates a random password >=14 chars with upper, lower, digit and special chars. */
export function generateStrongPassword(length = 16): string {
  const required = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SPECIAL)];
  const rest = Array.from({ length: Math.max(length, 14) - required.length }, () => randomChar(ALL));
  const chars = [...required, ...rest];
  // Fisher-Yates shuffle so the required chars aren't always in the first positions
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    const tmp = chars[i] as string;
    chars[i] = chars[j] as string;
    chars[j] = tmp;
  }
  return chars.join('');
}
