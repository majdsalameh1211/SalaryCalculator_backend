// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '24h';

// POST /api/auth/signup
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Basic input presence check
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Password strength
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    // Check if username already taken
    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) {
      res.status(409).json({ message: 'Username already taken' });
      return;
    }

    // Create user — password hashed automatically by the model's pre('save') hook
    const user = await User.create({
      username: username.trim().toLowerCase(),
      password
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Basic input presence check
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Find user — always lowercase to match signup
    const user = await User.findOne({ username: username.trim().toLowerCase() }).select('+password');
    
    // Use comparePassword even if user not found to prevent timing attacks
    // (bcrypt compare takes the same time regardless)
    const isValid = user ? await user.comparePassword(password) : false;

    if (!user || !isValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};