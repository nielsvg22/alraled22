import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || '';
const url = new URL(rawUrl);
const sslEnabled = url.searchParams.get('ssl') === 'true' || process.env.TLS_ENABLED === 'true';
url.searchParams.delete('ssl');
const cleanUrl = url.toString();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    ssl: sslEnabled ? { rejectUnauthorized: true } : undefined,
  },
});
