// src/types/index.ts

export interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include typed user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}