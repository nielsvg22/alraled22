import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dotenv from 'dotenv';
import * as usersRepo from '../db/usersRepo';
import { AuthRequest } from '../middleware/authMiddleware';
import { hashPassword, verifyPasswordHash, generateStrongPassword } from '../lib/password';

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
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const resetPasswordSchema = z.object({
  mode: z.enum(['auto', 'manual']).default('auto'),
  password: z.string().min(8).optional(),
}).refine((v) => v.mode === 'auto' || !!v.password, {
  message: 'password is required when mode is "manual"',
  path: ['password'],
});

async function serializeUser(user: { id: string; email: string; name: string | null; role: usersRepo.Role }) {
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

  let passwordResetBy: { id: string; name: string | null; email: string } | null = null;
  if (anyUser.passwordResetByUserId) {
    const resetter = await usersRepo.findUserById(anyUser.passwordResetByUserId);
    if (resetter) passwordResetBy = { id: resetter.id, name: resetter.name, email: resetter.email };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerGroupId: anyUser.customerGroupId ?? null,
    customerGroup: group,
    security: {
      mustChangePassword: !!anyUser.mustChangePassword,
      lastLoginAt: anyUser.lastLoginAt ?? null,
      passwordChangedAt: anyUser.passwordChangedAt ?? null,
      passwordResetAt: anyUser.passwordResetAt ?? null,
      passwordResetBy,
    },
  };
}

function signToken(user: { id: string; role: usersRepo.Role; sessionVersion: number }) {
  return jwt.sign({ userId: user.id, role: user.role, sv: user.sessionVersion }, JWT_SECRET, { expiresIn: '7d' });
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
    const token = signToken(user as any);
    res.status(201).json({ user: await serializeUser(user), token });
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
    const { email, password } = loginSchema.parse(req.body);
    const user = await usersRepo.findUserByEmailWithGroup(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await usersRepo.verifyPassword(user, password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    await usersRepo.touchLastLogin(user.id);
    const token = signToken(user as any);
    res.json({ user: await serializeUser(user), token });
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

    return res.json(await serializeUser(user));
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to load profile', message: error?.message || String(error) });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await usersRepo.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await usersRepo.verifyPassword(user, currentPassword);
    if (!ok) return res.status(400).json({ error: 'Huidig wachtwoord is onjuist' });

    const newHash = await hashPassword(newPassword);
    const updated = await usersRepo.setOwnPassword(userId, newHash);
    if (!updated) return res.status(500).json({ error: 'Wachtwoord wijzigen mislukt' });

    const token = signToken(updated as any);
    return res.json({ user: await serializeUser(updated), token });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid data', details: error.issues });
    return res.status(500).json({ error: 'Wachtwoord wijzigen mislukt', message: error?.message || String(error) });
  }
}

export async function adminResetPassword(req: AuthRequest, res: Response) {
  try {
    const adminId = req.user?.userId;
    if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    const targetId = req.params.id as string;
    const target = await usersRepo.findUserById(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const { mode, password } = resetPasswordSchema.parse(req.body ?? {});
    const temporaryPassword = mode === 'auto' ? generateStrongPassword() : (password as string);

    const newHash = await hashPassword(temporaryPassword);
    const updated = await usersRepo.adminResetPassword(targetId, newHash, adminId);
    if (!updated) return res.status(500).json({ error: 'Wachtwoord resetten mislukt' });

    // Note: the temporary password is returned ONLY in this response body. It is
    // never persisted in plaintext, never logged, and cannot be retrieved again.
    return res.json({ success: true, temporaryPassword, user: await serializeUser(updated) });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid data', details: error.issues });
    return res.status(500).json({ error: 'Wachtwoord resetten mislukt', message: error?.message || String(error) });
  }
}

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const users = await usersRepo.listUsers();
    return res.json(users);
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
    return res.json(await serializeUser(updated as any));
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid data', details: error.issues });
    if (error?.code === 'GROUP_NOT_FOUND') return res.status(404).json({ error: 'Customer group not found' });
    return res.status(500).json({ error: 'Failed to update user', message: error?.message || String(error) });
  }
}
