import { db } from './db';
import { systemLogs } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export async function logEvent(
  type: string,
  level: LogLevel,
  source: string,
  message: string,
  details?: any,
  orderId?: string
): Promise<void> {
  try {
    await db.insert(systemLogs).values({
      type,
      level,
      source,
      message,
      details: details ? JSON.stringify(details) : null,
      orderId: orderId || null,
    });
  } catch (err) {
    console.error('[log] Failed to write log:', err);
  }
}

export async function getLogs(
  type?: string,
  limit: number = 100,
  offset: number = 0
): Promise<any[]> {
  const where = type ? eq(systemLogs.type, type) : undefined;
  return db.select().from(systemLogs)
    .where(where)
    .orderBy(desc(systemLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getLogCount(type?: string): Promise<number> {
  const where = type ? eq(systemLogs.type, type) : undefined;
  const [result] = await db.select({ count: sql<number>`count(*)` })
    .from(systemLogs)
    .where(where);
  return result?.count || 0;
}
