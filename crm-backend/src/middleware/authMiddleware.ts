import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'alra-led-jwt-secret-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      role?: string;
    };

    if (!payload?.userId || !payload?.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = { userId: payload.userId, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Optioneel inloggen: geldig token → req.user gezet; geen of een verlopen token → gewoon doorgaan als gast
export const optionalAuthMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId?: string; role?: string };
      if (payload?.userId && payload?.role) req.user = { userId: payload.userId, role: payload.role };
    } catch { /* verlopen of ongeldig token: als gast verder */ }
  }
  return next();
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};
