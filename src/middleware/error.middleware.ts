// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MongoServerError } from 'mongodb';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't log in test environment
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  // Mongoose — invalid ObjectId (e.g. /api/shifts/not-a-valid-id)
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    return;
  }

  // Mongoose — schema validation failed
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({ message: messages.join(', ') });
    return;
  }

  // MongoDB — duplicate key (e.g. username already exists)
  if (err instanceof MongoServerError && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    res.status(409).json({ message: `${field} already exists` });
    return;
  }

  // CORS error
  if (err.message?.startsWith('CORS:')) {
    res.status(403).json({ message: err.message });
    return;
  }

  // JWT errors are handled in auth.middleware — but catch any that leak through
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  // Never expose stack traces or internal details in production
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    message: err.status ? err.message : 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  });
};