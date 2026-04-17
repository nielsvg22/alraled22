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

    const existingUser = db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userCountResult = db.select({ count: sql<number>`count(*)` }).from(users).get();
    const userCount = userCountResult?.count ?? 0;
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: userCount === 0 ? 'ADMIN' : 'USER',
    }).returning().get();

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
    process.stdout.write(`Login attempt for: ${email}\n`);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    process.stdout.write('Finding user...\n');
    const user = db.select().from(users).where(eq(users.email, email)).get();
    process.stdout.write(`User found: ${!!user}\n`);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    process.stdout.write('Comparing passwords...\n');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    process.stdout.write(`Password valid: ${isPasswordValid}\n`);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (error: any) {
    process.stdout.write(`Login error: ${error.message}\n`);
    process.stdout.write(`Login error stack: ${error.stack}\n`);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const userList = db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).all();
    res.json(userList);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
