import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional().or(z.literal('')),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const userCount = Number(userCountResult[0]?.count ?? 0);
    const hashedPassword = await bcrypt.hash(password, 12);
    
    await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: userCount === 0 ? 'ADMIN' : 'USER',
    });

    const newUserResult = await db.select().from(users).where(eq(users.email, email));
    const user = newUserResult[0];

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.issues });
    }
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Registration failed', message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(`[auth] Login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, email));
    const user = foundUsers[0];
    if (!user) {
      console.log(`[auth] User not found: ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`[auth] Invalid password for: ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    console.log(`[auth] Login successful: ${email} (${user.role})`);
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (error: any) {
    console.error(`[auth] Login error:`, error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const userList = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users);
    res.json(userList);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await db.update(users).set({ role }).where(eq(users.id, id));
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
