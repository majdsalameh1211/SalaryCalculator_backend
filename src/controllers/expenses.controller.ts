// src/controllers/expenses.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Expense } from '../models/Expense.model';

export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { year, month } = req.query;

    const query: Record<string, any> = { userId };

    if (year) {
      const prefix = month !== undefined
        ? `${year}-${(Number(month) + 1).toString().padStart(2, '0')}`
        : `${year}`;
      query.date = { $regex: `^${prefix}` };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) { next(err); }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const expense = await Expense.create({ ...req.body, userId });
    res.status(201).json(expense);
  } catch (err) { next(err); }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId }, // scoped to user — prevents updating another user's expense
      req.body,
      { new: true }
    );

    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    res.json(expense);
  } catch (err) { next(err); }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId });

    if (!expense) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    res.json({ message: 'Expense deleted' });
  } catch (err) { next(err); }
};