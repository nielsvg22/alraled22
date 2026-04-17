import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error('DATABASE_URL is not set (Render: add env var DATABASE_URL like file:/var/data/db.sqlite)');

// Always resolve to an absolute path so the db file is stable regardless of CWD
const relativePath = rawUrl.replace(/^file:/, '');
const dbPath = path.isAbsolute(relativePath)
  ? relativePath
  : path.resolve(process.cwd(), relativePath);

try {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
} catch (error: any) {
  if (error?.code === 'EACCES') {
    throw new Error(
      `Cannot create database directory for ${dbPath}. ` +
      `On Render, ensure a persistent disk is attached and mounted at the parent directory (e.g. mount /var/data) ` +
      `and that DATABASE_URL points inside it (e.g. file:/var/data/db.sqlite).`
    );
  }
  throw error;
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('synchronous = NORMAL');

// Auto-create all tables if they don't exist yet.
// Safe to run on every startup — existing data is never touched.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS "CustomerGroup" (
    "id"              TEXT PRIMARY KEY,
    "name"            TEXT NOT NULL UNIQUE,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "vatReverseCharge" INTEGER NOT NULL DEFAULT 0,
    "netPrices"       INTEGER NOT NULL DEFAULT 1,
    "createdAt"       TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt"       TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "User" (
    "id"        TEXT PRIMARY KEY,
    "email"     TEXT NOT NULL UNIQUE,
    "password"  TEXT NOT NULL,
    "name"      TEXT,
    "role"      TEXT NOT NULL DEFAULT 'USER',
    "customerGroupId" TEXT REFERENCES "CustomerGroup"("id") ON DELETE SET NULL,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "Product" (
    "id"          TEXT PRIMARY KEY,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "price"       REAL NOT NULL,
    "stock"       INTEGER NOT NULL DEFAULT 0,
    "imageUrl"    TEXT,
    "category"    TEXT,
    "createdAt"   TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt"   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "ProductPriceTier" (
    "id"        TEXT PRIMARY KEY,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "minQty"    INTEGER NOT NULL,
    "price"     REAL NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "Order" (
    "id"             TEXT PRIMARY KEY,
    "userId"         TEXT NOT NULL REFERENCES "User"("id"),
    "total"          REAL NOT NULL,
    "discountCodeId" TEXT REFERENCES "DiscountCode"("id"),
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt"      TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt"      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "ProductRelation" (
    "id"               TEXT PRIMARY KEY,
    "productId"        TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "relatedProductId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "type"             TEXT NOT NULL DEFAULT 'RELATED'
  );

  CREATE TABLE IF NOT EXISTS "DiscountCode" (
    "id"             TEXT PRIMARY KEY,
    "code"           TEXT NOT NULL UNIQUE,
    "type"           TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value"          REAL NOT NULL,
    "minOrderAmount" REAL NOT NULL DEFAULT 0,
    "startDate"      TEXT,
    "endDate"        TEXT,
    "usageLimit"     INTEGER,
    "usageCount"     INTEGER NOT NULL DEFAULT 0,
    "active"         INTEGER NOT NULL DEFAULT 1,
    "createdAt"      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id"        TEXT PRIMARY KEY,
    "orderId"   TEXT NOT NULL REFERENCES "Order"("id"),
    "productId" TEXT REFERENCES "Product"("id") ON DELETE SET NULL,
    "quantity"  INTEGER NOT NULL,
    "price"     REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "Rma" (
    "id"        TEXT PRIMARY KEY,
    "orderId"   TEXT NOT NULL REFERENCES "Order"("id"),
    "userId"    TEXT NOT NULL REFERENCES "User"("id"),
    "status"    TEXT NOT NULL DEFAULT 'REQUESTED',
    "reason"    TEXT,
    "message"   TEXT,
    "adminNote" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "RmaItem" (
    "id"          TEXT PRIMARY KEY,
    "rmaId"       TEXT NOT NULL REFERENCES "Rma"("id"),
    "orderItemId" TEXT NOT NULL REFERENCES "OrderItem"("id"),
    "quantity"    INTEGER NOT NULL,
    "createdAt"   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "SiteContent" (
    "key"       TEXT PRIMARY KEY,
    "value"     TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "SnelstartConfig" (
    "id"                   TEXT PRIMARY KEY,
    "apiKey"               TEXT,
    "clientKey"            TEXT,
    "ledgerNumberSales"    TEXT,
    "ledgerNumberVat21"    TEXT,
    "ledgerNumberVat9"     TEXT,
    "ledgerNumberVat0"     TEXT,
    "ledgerNumberShipping" TEXT,
    "snelstartVatCode21"   TEXT,
    "snelstartVatCode9"    TEXT,
    "snelstartVatCode0"    TEXT,
    "enabled"              INTEGER NOT NULL DEFAULT 0,
    "updatedAt"            TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "SnelstartSyncLog" (
    "id"           TEXT PRIMARY KEY,
    "orderId"      TEXT NOT NULL REFERENCES "Order"("id"),
    "status"       TEXT NOT NULL,
    "errorMessage" TEXT,
    "syncedAt"     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS "SnelstartLedger" (
    "id"        TEXT PRIMARY KEY,
    "code"      TEXT NOT NULL UNIQUE,
    "name"      TEXT NOT NULL,
    "type"      TEXT NOT NULL DEFAULT 'OTHER',
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log(`[db] Connected to ${dbPath}`);

// ── Migration: add discount columns to Order ──
try {
  const cols = sqlite.pragma('table_info(Order)') as { name: string }[];
  if (!cols.find(c => c.name === 'discountCodeId')) {
    sqlite.exec(`ALTER TABLE "Order" ADD COLUMN "discountCodeId" TEXT REFERENCES "DiscountCode"("id")`);
    console.log('[db] Migration: added Order.discountCodeId');
  }
  if (!cols.find(c => c.name === 'discountAmount')) {
    sqlite.exec(`ALTER TABLE "Order" ADD COLUMN "discountAmount" REAL NOT NULL DEFAULT 0`);
    console.log('[db] Migration: added Order.discountAmount');
  }
} catch (e) {
  console.error('[db] Migration (Order columns) failed:', e);
}

// ── Migration: make OrderItem.productId nullable (ON DELETE SET NULL) ──
// SQLite doesn't support ALTER COLUMN, so we recreate the table if needed.
try {
  const cols = sqlite.pragma('table_info(OrderItem)') as { name: string; notnull: number }[];
  const productIdCol = cols.find(c => c.name === 'productId');
  if (productIdCol && productIdCol.notnull === 1) {
    sqlite.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN TRANSACTION;
      CREATE TABLE "OrderItem_new" (
        "id"        TEXT PRIMARY KEY,
        "orderId"   TEXT NOT NULL REFERENCES "Order"("id"),
        "productId" TEXT REFERENCES "Product"("id") ON DELETE SET NULL,
        "quantity"  INTEGER NOT NULL,
        "price"     REAL NOT NULL
      );
      INSERT INTO "OrderItem_new" SELECT "id","orderId","productId","quantity","price" FROM "OrderItem";
      DROP TABLE "OrderItem";
      ALTER TABLE "OrderItem_new" RENAME TO "OrderItem";
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
    console.log('[db] Migration: OrderItem.productId is now nullable');
  }
} catch (e) {
  console.error('[db] Migration failed:', e);
}

export const db = drizzle(sqlite, { schema });
