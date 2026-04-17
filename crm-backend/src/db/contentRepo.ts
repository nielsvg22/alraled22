import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { siteContent } from './schema';

export function getContent(key: string): object | null {
  const row = db.select().from(siteContent).where(eq(siteContent.key, key)).get();
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

export function setContent(key: string, value: object): void {
  const existing = db.select().from(siteContent).where(eq(siteContent.key, key)).get();
  if (existing) {
    db.update(siteContent)
      .set({ value: JSON.stringify(value), updatedAt: new Date().toISOString() })
      .where(eq(siteContent.key, key))
      .run();
  } else {
    db.insert(siteContent).values({ key, value: JSON.stringify(value) }).run();
  }
}
