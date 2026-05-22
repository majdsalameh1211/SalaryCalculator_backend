// src/controllers/stats.controller.ts
import { Request, Response, NextFunction } from 'express';
import { generateStats } from '../services/stats.service';

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { year, month } = req.query;

    if (!year) {
      res.status(400).json({ message: 'Year is required' });
      return;
    }

    const stats = await generateStats(
      userId,
      Number(year),
      month !== undefined ? Number(month) : undefined
    );

    res.json(stats);
  } catch (err) { next(err); }
};