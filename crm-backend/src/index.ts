import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authJsonRoutes';
import orderRoutes from './routes/orderRoutes';
import rmaRoutes from './routes/rmaRoutes';
import quoteRoutes from './routes/quoteRoutes';
import customerGroupRoutes from './routes/customerGroupRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import uploadRoutes from './routes/uploadRoutes';
import contentRoutes from './routes/contentRoutes';
import aiRoutes from './routes/aiRoutes';
import geoRoutes from './routes/geoRoutes';
import snelstartRoutes from './routes/snelstartRoutes';
import discountCodeRoutes from './routes/discountCodeRoutes';
import { db } from './lib/db';
import { users } from './db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Ensure default admin exists
async function ensureAdmin() {
  try {
    const adminEmail = 'admin@alraled.nl';
    const adminPassword = 'admin1234';
    const adminEmailLower = adminEmail.toLowerCase();

    const existing = await db.select().from(users).where(eq(users.email, adminEmailLower));
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (existing.length === 0) {
      console.log('[server] Creating default admin...');
      await db.insert(users).values({
        email: adminEmailLower,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
      });
      console.log(`[server] Default admin created: ${adminEmail} / ${adminPassword}`);
      return;
    }

    await db.update(users).set({
      role: 'ADMIN',
      password: hashedPassword,
      name: existing[0]?.name ?? 'Admin',
      updatedAt: new Date(),
    }).where(eq(users.email, adminEmailLower));

    console.log('[server] Default admin ensured');
  } catch (err) {
    console.error('[server] Error ensuring admin:', err);
  }
}
ensureAdmin();

app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`[server] ${req.method} ${req.url}`);
  next();
});

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/rmas', rmaRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/customer-groups', customerGroupRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/ai',      aiRoutes);
app.use('/api/geo',     geoRoutes);
app.use('/api/snelstart', snelstartRoutes);
app.use('/api/discounts', discountCodeRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the CRM API' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[server] ${signal} received — shutting down gracefully`);
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

