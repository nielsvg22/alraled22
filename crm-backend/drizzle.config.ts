import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL ?? '';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl.replace(/^file:/, ''),
  },
});
