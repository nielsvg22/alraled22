import { eq, sql } from 'drizzle-orm';
import { db } from '../lib/db';
import { customerGroups, users } from './schema';
import bcrypt from 'bcryptjs';

export type Role = 'USER' | 'ADMIN';

export async function countUsers(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(result[0]?.count ?? 0);
}

export async function findUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  return result[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] ?? null;
}

export async function findUserByEmailWithGroup(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: { customerGroup: true },
  });
  return user ?? null;
}

export async function findUserByIdWithGroup(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { customerGroup: true },
  });
  return user ?? null;
}

export async function listUsers() {
  return await db.query.users.findMany({
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      customerGroupId: true,
      createdAt: true,
      updatedAt: true,
    },
    with: { customerGroup: true },
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });
}

export async function createUser(input: { email: string; name: string; password: string; role: Role }) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    await db.insert(users).values({
      email: input.email.toLowerCase(),
      name: input.name,
      password: passwordHash,
      role: input.role,
    });
    return await findUserByEmail(input.email);
  } catch (error: any) {
    // MySQL error code for duplicate entry
    if (error?.code === 'ER_DUP_ENTRY' || error?.message?.includes('Duplicate entry')) {
      const err = new Error('User already exists');
      (err as any).code = 'USER_EXISTS';
      throw err;
    }
    throw error;
  }
}

export async function verifyPassword(user: { password: string }, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

export async function setUserCustomerGroup(userId: string, customerGroupId: string | null) {
  if (customerGroupId) {
    const groupResult = await db.select().from(customerGroups).where(eq(customerGroups.id, customerGroupId));
    if (groupResult.length === 0) {
      const err = new Error('Customer group not found');
      (err as any).code = 'GROUP_NOT_FOUND';
      throw err;
    }
  }

  await db.update(users).set({
    customerGroupId,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
  
  return await findUserByIdWithGroup(userId);
}
