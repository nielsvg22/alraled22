import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (!connectionUrl) {
  throw new Error('DATABASE_URL or MYSQL_URL is not set. Please add a MySQL database in Railway and link it.');
}

// Create the connection pool with SSL support
const url = new URL(connectionUrl);
const sslEnabled = url.searchParams.get('ssl') === 'true' || process.env.TLS_ENABLED === 'true';

export const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', ''),
  ssl: sslEnabled ? { rejectUnauthorized: true } : undefined,
});

export const db = drizzle(pool, { schema, mode: 'default' });

console.log('[db] Connected to MySQL');
