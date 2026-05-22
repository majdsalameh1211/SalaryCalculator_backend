// src/controllers/shifts.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Shift } from '../models/Shift.model';
import { calculateShift } from '../services/calc.service';

export const getShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { year, month } = req.query;

    const query: Record<string, any> = { userId };

    if (year) {
      const monthStr = month !== undefined ? (Number(month) + 1).toString().padStart(2, '0') : '';
      const prefix = month !== undefined ? `${year}-${monthStr}` : `${year}`;
      query.date = { $regex: `^${prefix}` };
    }

    const shifts = await Shift.find(query).sort({ date: -1 }).lean();

    const formattedShifts = shifts.map(({ _id, __v, ...rest }) => ({
      id: (_id as any).toString(),
      ...rest
    }));

    res.json(formattedShifts);
  } catch (err) { next(err); }
};

export const createShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const calculatedData = await calculateShift(req.body, userId);
    const shift = await Shift.create({ ...calculatedData, userId });
    res.status(201).json(shift);
  } catch (err) { next(err); }
};

export const updateShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const calculatedData = await calculateShift(req.body, userId);

    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, userId }, // scoped to user — prevents updating another user's shift
      calculatedData,
      { new: true }
    );

    if (!shift) {
      res.status(404).json({ message: 'Shift not found' });
      return;
    }

    res.json(shift);
  } catch (err) { next(err); }
};

export const deleteShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const shift = await Shift.findOneAndDelete({ _id: req.params.id, userId });

    if (!shift) {
      res.status(404).json({ message: 'Shift not found' });
      return;
    }

    res.json({ message: 'Shift deleted' });
  } catch (err) { next(err); }
};