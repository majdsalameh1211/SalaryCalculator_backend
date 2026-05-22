// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';

// ── Helpers ────────────────────────────────────────────────────────

const isValidDate = (date: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(date);

const isValidTime = (time: string): boolean =>
  /^\d{2}:\d{2}$/.test(time);

const isPositiveNumber = (val: any): boolean =>
  typeof val === 'number' && val > 0;

// ── Shift validation ───────────────────────────────────────────────

export const validateShift = (req: Request, res: Response, next: NextFunction): void => {
  const { type, date, startTime, endTime, hourRate, dailySalary } = req.body;
  const errors: string[] = [];

  if (!type || !['regular', 'training'].includes(type)) {
    errors.push('type must be "regular" or "training"');
  }

  if (!date || !isValidDate(date)) {
    errors.push('date must be in YYYY-MM-DD format');
  }

  if (!startTime || !isValidTime(startTime)) {
    errors.push('startTime must be in HH:MM format');
  }

  if (!endTime || !isValidTime(endTime)) {
    errors.push('endTime must be in HH:MM format');
  }

  if (type === 'regular') {
    if (hourRate === undefined && dailySalary === undefined) {
      errors.push('regular shifts require either hourRate or dailySalary');
    }
    if (hourRate !== undefined && !isPositiveNumber(hourRate)) {
      errors.push('hourRate must be a positive number');
    }
    if (dailySalary !== undefined && !isPositiveNumber(dailySalary)) {
      errors.push('dailySalary must be a positive number');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ message: errors.join(', ') });
    return;
  }

  next();
};

// ── Expense validation ─────────────────────────────────────────────

export const validateExpense = (req: Request, res: Response, next: NextFunction): void => {
  const { type, date, amount } = req.body;
  const errors: string[] = [];

  if (!type || !['fuel', 'parking'].includes(type)) {
    errors.push('type must be "fuel" or "parking"');
  }

  if (!date || !isValidDate(date)) {
    errors.push('date must be in YYYY-MM-DD format');
  }

  if (amount === undefined || !isPositiveNumber(amount)) {
    errors.push('amount must be a positive number');
  }

  if (errors.length > 0) {
    res.status(400).json({ message: errors.join(', ') });
    return;
  }

  next();
};