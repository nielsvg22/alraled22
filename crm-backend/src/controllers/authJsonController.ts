import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dotenv from 'dotenv';
import * as usersRepo from '../db/usersRepo';
import { AuthRequest } from '../middleware/authMiddleware';

dotenv.config();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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

function signToken(user: { id: string; role: usersRepo.Role }) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const userCount = await usersRepo.countUsers();
    const role: usersRepo.Role = userCount === 0 ? 'ADMIN' : 'USER';

    const created = await usersRepo.createUser({ email, password, name, role });
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
    const { email, password } = loginSchema.parse(req.body);
    const user = await usersRepo.findUserByEmailWithGroup(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await usersRepo.verifyPassword(user, password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ user: serializeUser(user), token });
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

    return res.json(serializeUser(user));
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to load profile', message: error?.message || String(error) });
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
    return res.json(serializeUser(updated as any));
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid data', details: error.issues });
    if (error?.code === 'GROUP_NOT_FOUND') return res.status(404).json({ error: 'Customer group not found' });
    return res.status(500).json({ error: 'Failed to update user', message: error?.message || String(error) });
  }
}
