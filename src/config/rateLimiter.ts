// src/config/rateLimiter.ts
import rateLimit from 'express-rate-limit';

// Strict limiter for auth routes (login, signup)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 attempts per IP per window
  standardHeaders: true,     // return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in 15 minutes' },
  skipSuccessfulRequests: true // only count failed requests against the limit
});

// General API limiter — loose, just prevents hammering
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down' }
});