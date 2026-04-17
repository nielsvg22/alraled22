import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { siteContent } from './schema';

export async function getContent(key: string): Promise<object | null> {
  const result = await db.select().from(siteContent).where(eq(siteContent.key, key));
  const row = result[0];
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

export async function setContent(key: string, value: object): Promise<void> {
  const result = await db.select().from(siteContent).where(eq(siteContent.key, key));
  const existing = result[0];
  if (existing) {
    await db.update(siteContent)
      .set({ value: JSON.stringify(value), updatedAt: new Date() })
      .where(eq(siteContent.key, key));
  } else {
    await db.insert(siteContent).values({ key, value: JSON.stringify(value) });
  }
}
