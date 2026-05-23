// src/services/stats.service.ts
import mongoose from 'mongoose';
import { Shift } from '../models/Shift.model';
import { Expense } from '../models/Expense.model';
import { getSettingsForUser } from './calc.service';

const round = (num: number) => Math.round(num * 100) / 100;

export interface StatsResult {
  totalShiftsCount: number;
  workingDays: number;
  regularCount: number;
  trainingCount: number;
  regularHours: number;
  trainingHours: number;
  totalHours: number;
  cashSalary: number;
  regularTransfer: number;
  trainingIncome: number;
  bonus: number;
  totalTransfer: number;
  totalIncome: number;
  totalFuel: number;
  totalParking: number;
  netProfit: number;
  avgHourRate: number;
  avgIncome: number;
  avgBonus: number;
}

export const generateStats = async (
  userId: string,
  year: number,
  month?: number
): Promise<StatsResult> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const monthStr = month !== undefined ? (month + 1).toString().padStart(2, '0') : '';
  const datePrefix = month !== undefined ? `${year}-${monthStr}` : `${year}`;
  const dateRegex = new RegExp(`^${datePrefix}`);

  // Run all three in parallel — independent queries, no reason to sequence them
  const [shiftStats, expenseStats, settings] = await Promise.all([
    Shift.aggregate([
      { $match: { userId: userObjectId, date: dateRegex } },
      {
        $group: {
          _id: null,
          totalShiftsCount: { $sum: 1 },
          uniqueDates: { $addToSet: '$date' },
          regularCount: { $sum: { $cond: [{ $eq: ['$type', 'regular'] }, 1, 0] } },
          trainingCount: { $sum: { $cond: [{ $eq: ['$type', 'training'] }, 1, 0] } },
          regularHours: { $sum: { $cond: [{ $eq: ['$type', 'regular'] }, '$totalHours', 0] } },
          trainingHours: { $sum: { $cond: [{ $eq: ['$type', 'training'] }, '$totalHours', 0] } },
          cashSalary: { $sum: { $cond: [{ $eq: ['$type', 'regular'] }, '$cash', 0] } },
          regularTransfer: { $sum: { $cond: [{ $eq: ['$type', 'regular'] }, '$transfer', 0] } },
          trainingIncome: { $sum: { $cond: [{ $eq: ['$type', 'training'] }, '$dailySalary', 0] } }
        }
      }
    ]),
    Expense.aggregate([
      { $match: { userId: userObjectId, date: dateRegex } },
      {
        $group: {
          _id: null,
          totalFuel: { $sum: { $cond: [{ $eq: ['$type', 'fuel'] }, '$amount', 0] } },
          totalParking: { $sum: { $cond: [{ $eq: ['$type', 'parking'] }, '$amount', 0] } }
        }
      }
    ]),
    getSettingsForUser(userId) // reuses the per-user cache from calc.service
  ]);

  const s = shiftStats[0] || {
    totalShiftsCount: 0, uniqueDates: [], regularCount: 0, trainingCount: 0,
    regularHours: 0, trainingHours: 0, cashSalary: 0, regularTransfer: 0, trainingIncome: 0
  };

  const e = expenseStats[0] || { totalFuel: 0, totalParking: 0 };

  const workingDays = s.uniqueDates.length;
  const totalHours = s.regularHours + s.trainingHours;
  const bonus = totalHours * settings.bonusRatePerHour;
  const totalTransfer = s.regularTransfer + s.trainingIncome + bonus;
  const totalIncome = s.cashSalary + totalTransfer;
  const netProfit = totalIncome - e.totalFuel - e.totalParking;

  const regularIncome = s.cashSalary + s.regularTransfer;
  const avgHourRate = s.regularHours > 0 ? regularIncome / s.regularHours : 0;
  const avgIncome = s.regularCount > 0 ? regularIncome / s.regularCount : 0;
  const avgBonus = s.regularCount > 0 ? bonus / s.regularCount : 0;

  return {
    totalShiftsCount: s.totalShiftsCount,
    workingDays,
    regularCount: s.regularCount,
    trainingCount: s.trainingCount,
    regularHours: round(s.regularHours),
    trainingHours: round(s.trainingHours),
    totalHours: round(totalHours),
    cashSalary: round(s.cashSalary),
    regularTransfer: round(s.regularTransfer),
    trainingIncome: round(s.trainingIncome),
    bonus: round(bonus),
    totalTransfer: round(totalTransfer),
    totalIncome: round(totalIncome),
    totalFuel: round(e.totalFuel),
    totalParking: round(e.totalParking),
    netProfit: round(netProfit),
    avgHourRate: round(avgHourRate),
    avgIncome: round(avgIncome),
    avgBonus: round(avgBonus)
  };
};