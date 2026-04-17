import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../lib/db';
import { customerGroups, users } from './schema';
import bcrypt from 'bcryptjs';

export type Role = 'USER' | 'ADMIN';

export async function countUsers(): Promise<number> {
  const result = db.select({ count: sql<number>`count(*)` }).from(users).get();
  return result?.count ?? 0;
}

export async function findUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email.toLowerCase())).get() ?? null;
}

export async function findUserById(id: string) {
  return db.select().from(users).where(eq(users.id, id)).get() ?? null;
}

export async function findUserByEmailWithGroup(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    with: { customerGroup: true },
  }).sync() ?? null;
}

export async function findUserByIdWithGroup(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
    with: { customerGroup: true },
  }).sync() ?? null;
}

export async function listUsers() {
  return db.query.users.findMany({
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
  }).sync();
}

export async function createUser(input: { email: string; name: string; password: string; role: Role }) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const result = db.insert(users).values({
      email: input.email.toLowerCase(),
      name: input.name,
      password: passwordHash,
      role: input.role,
    }).returning().get();
    return result;
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE constraint failed')) {
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
  const group = customerGroupId
    ? db.select().from(customerGroups).where(eq(customerGroups.id, customerGroupId)).get()
    : null;
  if (customerGroupId && !group) {
    const err = new Error('Customer group not found');
    (err as any).code = 'GROUP_NOT_FOUND';
    throw err;
  }

  db.update(users).set({
    customerGroupId,
    updatedAt: new Date().toISOString(),
  }).where(eq(users.id, userId)).run();
  return findUserByIdWithGroup(userId);
}
