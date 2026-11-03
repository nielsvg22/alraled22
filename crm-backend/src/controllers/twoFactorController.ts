import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import * as usersRepo from '../db/usersRepo';
import { otpauthUrl } from '../lib/totp';
import {
  beginSetup, finishSetup, disableTwoFactor, getTwoFactor, isTwoFactorEnabled,
  verifyCode, isLocked, registerFailure, clearFailures,
} from '../lib/twoFactor';

export async function status(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const row = await getTwoFactor(userId);
  const backup = row?.backupCodes ? (JSON.parse(row.backupCodes) as string[]).length : 0;
  res.json({ enabled: !!row && Number(row.enabled) === 1, backupCodesLeft: backup });
}

// Stap 1: nieuw geheim aanmaken (nog niet actief); de gebruiker scant de QR-code
export async function setup(req: AuthRequest, res: Response) {
  const user = await usersRepo.findUserById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (await isTwoFactorEnabled(user.id)) return res.status(400).json({ error: 'Twee-staps verificatie staat al aan' });
  const secret = await beginSetup(user.id);
  res.json({ secret, otpauthUrl: otpauthUrl(secret, user.email) });
}

// Stap 2: met de eerste code bevestigen; levert eenmalig de herstelcodes op
export async function enable(req: AuthRequest, res: Response) {
  const { code } = z.object({ code: z.string().min(6).max(12) }).parse(req.body);
  const userId = req.user!.userId;
  if (isLocked(userId)) return res.status(429).json({ error: 'Te veel foute codes. Probeer het over 10 minuten opnieuw.' });
  const codes = await finishSetup(userId, code);
  if (!codes) { registerFailure(userId); return res.status(400).json({ error: 'Code klopt niet. Controleer de tijd op je telefoon en probeer opnieuw.' }); }
  clearFailures(userId);
  res.json({ enabled: true, backupCodes: codes });
}

// Uitzetten kan alleen met wachtwoord + een geldige code
export async function disable(req: AuthRequest, res: Response) {
  const { password, code } = z.object({ password: z.string().min(1), code: z.string().min(6).max(12) }).parse(req.body);
  const user = await usersRepo.findUserById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (isLocked(user.id)) return res.status(429).json({ error: 'Te veel foute codes. Probeer het over 10 minuten opnieuw.' });
  const pwOk = await bcrypt.compare(password, user.password);
  const codeOk = pwOk && await verifyCode(user.id, code);
  if (!pwOk || !codeOk) { registerFailure(user.id); return res.status(400).json({ error: 'Wachtwoord of code klopt niet' }); }
  clearFailures(user.id);
  await disableTwoFactor(user.id);
  res.json({ enabled: false });
}

// Een admin kan de 2FA van een ander account resetten (bv. telefoon kwijt)
export async function adminReset(req: AuthRequest, res: Response) {
  const id = String(req.params.id || '');
  if (!id) return res.status(400).json({ error: 'User id is required' });
  await disableTwoFactor(id);
  res.json({ enabled: false });
}

// ── Instellen tijdens het inloggen (admin zonder 2FA; alleen met het korte setup-token uit /login) ──
import { verifySetupToken, serializeUser, signToken } from './authJsonController';
import { issueTrustedDevice } from '../lib/twoFactor';
import { Request } from 'express';

async function adminFromSetupToken(raw: unknown) {
  const userId = typeof raw === 'string' ? verifySetupToken(raw) : null;
  if (!userId) return null;
  const user = await usersRepo.findUserByIdWithGroup(userId);
  if (!user || user.role !== 'ADMIN') return null;
  if (await isTwoFactorEnabled(user.id)) return null;
  return user;
}

export async function loginSetup(req: Request, res: Response) {
  const user = await adminFromSetupToken(req.body?.setupToken);
  if (!user) return res.status(401).json({ error: 'Instelling verlopen. Log opnieuw in.' });
  const secret = await beginSetup(user.id);
  res.json({ secret, otpauthUrl: otpauthUrl(secret, user.email) });
}

export async function loginEnable(req: Request, res: Response) {
  const body = z.object({ setupToken: z.string(), code: z.string().min(6).max(12), rememberDevice: z.boolean().optional() }).parse(req.body);
  const user = await adminFromSetupToken(body.setupToken);
  if (!user) return res.status(401).json({ error: 'Instelling verlopen. Log opnieuw in.' });
  if (isLocked(user.id)) return res.status(429).json({ error: 'Te veel foute codes. Probeer het over 10 minuten opnieuw.' });
  const codes = await finishSetup(user.id, body.code);
  if (!codes) { registerFailure(user.id); return res.status(400).json({ error: 'Code klopt niet. Controleer de tijd op je telefoon en probeer opnieuw.' }); }
  clearFailures(user.id);
  const deviceToken = body.rememberDevice ? await issueTrustedDevice(user.id, req.headers['user-agent'] as string | undefined) : undefined;
  res.json({
    user: { ...serializeUser(user), twoFactorEnabled: true },
    token: signToken(user),
    backupCodes: codes,
    ...(deviceToken ? { deviceToken } : {}),
  });
}
