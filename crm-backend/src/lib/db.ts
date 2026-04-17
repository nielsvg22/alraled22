import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (!connectionUrl) {
  throw new Error('DATABASE_URL or MYSQL_URL is not set. Please add a MySQL database in Railway and link it.');
}

// Create the connection pool
const poolConnection = mysql.createPool(connectionUrl);

export const db = drizzle(poolConnection, { schema, mode: 'default' });

console.log('[db] Connected to MySQL');
