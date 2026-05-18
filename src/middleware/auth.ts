import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    jwt.verify(header.split(' ')[1], process.env.JWT_SECRET || 'changeme');
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
