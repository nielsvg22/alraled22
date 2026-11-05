import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dotenv from 'dotenv';
import * as usersRepo from '../db/usersRepo';
import { AuthRequest } from '../middleware/authMiddleware';
import { pool } from '../lib/db';
import { isTwoFactorEnabled, verifyCode, isTrustedDevice, issueTrustedDevice, isLocked, registerFailure, clearFailures } from '../lib/twoFactor';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'alra-led-jwt-secret-change-in-production';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  code: z.string().optional(),
  rememberDevice: z.boolean().optional(),
  deviceToken: z.string().optional(),
});

function serializeUser(user: { id: string; email: string; name: string | null; role: usersRepo.Role }) {
  const anyUser = user as any;
  const group = anyUser.customerGroup
    ? {
        id: anyUser.customerGroup.id,
        name: anyUser.customerGroup.name,
        discountPercent: anyUser.customerGroup.discountPercent,
        vatReverseCharge: !!anyUser.customerGroup.vatReverseCharge,
        netPrices: !!anyUser.customerGroup.netPrices,
      }
    : null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerGroupId: anyUser.customerGroupId ?? null,
    customerGroup: group,
  };
}

// Kortlevend token (15 min) dat alleen de 2FA-instelling tijdens het inloggen toestaat
export function signSetupToken(userId: string) {
  return jwt.sign({ userId, purpose: '2fa-setup' }, JWT_SECRET, { expiresIn: '15m' });
}

export function verifySetupToken(token: string): string | null {
  try {
    const p = jwt.verify(token, JWT_SECRET) as { userId?: string; purpose?: string };
    return p.purpose === '2fa-setup' && p.userId ? p.userId : null;
  } catch { return null; }
}

export { serializeUser, signToken };

function signToken(user: { id: string; role: usersRepo.Role }) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const userCount = await usersRepo.countUsers();
    const role: usersRepo.Role = userCount === 0 ? 'ADMIN' : 'USER';

    const created = await usersRepo.createUser({ email, password, name, role });
    if (!created) return res.status(500).json({ error: 'Registration failed' });
    const user = await usersRepo.findUserByIdWithGroup(created.id);
    if (!user) return res.status(500).json({ error: 'Registration failed' });
    const token = signToken(user);
    res.status(201).json({ user: serializeUser(user), token });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    if (error?.code === 'USER_EXISTS' || error?.message === 'User already exists') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Registration failed', message: error?.message || String(error) });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password, code, rememberDevice, deviceToken } = loginSchema.parse(req.body);
    const user = await usersRepo.findUserByEmailWithGroup(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await usersRepo.verifyPassword(user, password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    // Twee-staps verificatie voor admins (alleen als die is ingesteld)
    let newDeviceToken: string | undefined;
    if (user.role === 'ADMIN' && await isTwoFactorEnabled(user.id)) {
      const trusted = await isTrustedDevice(user.id, deviceToken);
      if (!trusted) {
        if (!code) return res.json({ twoFactorRequired: true });
        if (isLocked(user.id)) return res.status(429).json({ error: 'Te veel foute codes. Probeer het over 10 minuten opnieuw.' });
        if (!(await verifyCode(user.id, code))) {
          registerFailure(user.id);
          return res.status(400).json({ error: 'Code klopt niet', twoFactorRequired: true });
        }
        clearFailures(user.id);
        if (rememberDevice) newDeviceToken = await issueTrustedDevice(user.id, req.headers['user-agent'] as string | undefined);
      }
    }

    // Admin zonder 2FA: verplicht eerst instellen (tenzij REQUIRE_ADMIN_2FA=false). Geen sessie-token tot dat gelukt is.
    if (user.role === 'ADMIN' && process.env.REQUIRE_ADMIN_2FA !== 'false' && !(await isTwoFactorEnabled(user.id))) {
      return res.json({ twoFactorSetupRequired: true, setupToken: signSetupToken(user.id) });
    }

    const token = signToken(user);
    const twoFactorEnabled = user.role === 'ADMIN' ? await isTwoFactorEnabled(user.id) : false;
    res.json({ user: { ...serializeUser(user), twoFactorEnabled }, token, ...(newDeviceToken ? { deviceToken: newDeviceToken } : {}) });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    res.status(500).json({ error: 'Login failed', message: error?.message || String(error) });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await usersRepo.findUserByIdWithGroup(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const twoFactorEnabled = user.role === 'ADMIN' ? await isTwoFactorEnabled(user.id) : false;
    return res.json({ ...serializeUser(user), twoFactorEnabled });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to load profile', message: error?.message || String(error) });
  }
}

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const users = (await usersRepo.listUsers()).filter((u: any) => !String(u.email || '').endsWith('@gast.alra-led.invalid'));
    // Per admin tonen of twee-staps verificatie aan staat (om te kunnen resetten)
    const [rows] = await pool.execute('SELECT userId FROM `UserTwoFactor` WHERE enabled = 1');
    const enabled = new Set((rows as any[]).map(r => r.userId));
    return res.json(users.map((u: any) => ({ ...u, twoFactorEnabled: u.role === 'ADMIN' ? enabled.has(u.id) : false })));
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to load users', message: error?.message || String(error) });
  }
}

export async function setUserCustomerGroup(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const body = z.object({ customerGroupId: z.string().uuid().nullable() }).parse(req.body);
    const updated = await usersRepo.setUserCustomerGroup(id, body.customerGroupId);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json(serializeUser(updated as any));
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid data', details: error.issues });
    if (error?.code === 'GROUP_NOT_FOUND') return res.status(404).json({ error: 'Customer group not found' });
    return res.status(500).json({ error: 'Failed to update user', message: error?.message || String(error) });
  }
}
