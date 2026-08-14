import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

const rawUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || '';
const url = new URL(rawUrl);
url.searchParams.delete('ssl');
const cleanUrl = url.toString();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: cleanUrl,
    ssl: process.env.TLS_ENABLED === 'true' ? { rejectUnauthorized: true } : undefined,
  },
});
