import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = "file:c:/Users/NielsVanGortel/Documents/projects/aldraled2/crm-backend/prisma/dev.db";

const adapter = new PrismaLibSql({
  url: dbPath,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@aldra.com';
  const password = 'admin';
  const name = 'Admin User';

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
    },
  });

  console.log(`Admin account created: ${user.email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
