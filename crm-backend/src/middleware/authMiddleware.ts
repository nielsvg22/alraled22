import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findUserById } from '../db/usersRepo';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'alra-led-jwt-secret-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    mustChangePassword?: boolean;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      role?: string;
      sv?: number;
    };

    if (!payload?.userId || !payload?.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // A password reset (self-service or AIG-initiated) bumps the user's sessionVersion,
    // which immediately invalidates every JWT issued before that reset.
    const dbUser = await findUserById(payload.userId);
    if (!dbUser || dbUser.sessionVersion !== payload.sv) {
      return res.status(401).json({ error: 'Sessie verlopen, log opnieuw in' });
    }

    req.user = { userId: payload.userId, role: payload.role, mustChangePassword: !!dbUser.mustChangePassword };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};
