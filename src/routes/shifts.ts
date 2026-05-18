import { Router, Request, Response } from 'express';
import { Shift } from '../models/Shift';
import { Settings } from '../models/Settings';

const router = Router();

function calcShiftFields(
  hours: number,
  shiftType: 'regular' | 'training',
  inputMode: 'hourly' | 'daily',
  enteredRate: number | undefined,
  dailySalary: number | undefined,
  fuel: number,
  parking: number,
  minWage: number,
  bonusPerHour: number,
  defaultTrainingRate: number
) {
  let hourlyRate: number;
  if (inputMode === 'daily') {
    hourlyRate = hours > 0 ? (dailySalary || 0) / hours : minWage;
  } else if (shiftType === 'training') {
    hourlyRate = enteredRate && enteredRate > 0 ? enteredRate : defaultTrainingRate;
  } else {
    hourlyRate = Math.max(enteredRate || 0, minWage);
  }

  const bonus = parseFloat((hours * bonusPerHour).toFixed(2));

  if (shiftType === 'training') {
    const salary = parseFloat((hours * hourlyRate + bonus).toFixed(2));
    const netSalary = parseFloat((salary - fuel - parking).toFixed(2));
    return { hourlyRate, bonus, salary, netSalary, cash: undefined, monthTransfer: undefined };
  } else {
    const cash = parseFloat((hours * hourlyRate / 2).toFixed(2));
    const monthTransfer = parseFloat((hours * bonusPerHour + cash).toFixed(2));
    const salary = parseFloat((monthTransfer + cash).toFixed(2));
    const netSalary = parseFloat((salary - fuel - parking).toFixed(2));
    return { hourlyRate, bonus, salary, netSalary, cash, monthTransfer };
  }
}

// GET /api/shifts?month=5&year=2026
router.get('/', async (req: Request, res: Response) => {
  try {
    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);
    if (isNaN(month) || isNaN(year)) return res.status(400).json({ error: 'month and year required' });

    const shifts = await Shift.find({ month, year }).sort({ date: 1, startTime: 1 });

    const regular = shifts.filter(s => s.shiftType !== 'training');
    const training = shifts.filter(s => s.shiftType === 'training');

    const sumFields = (arr: typeof shifts) => arr.reduce((acc, s) => ({
      totalHours: acc.totalHours + s.hours,
      totalFuel: acc.totalFuel + s.fuel,
      totalParking: acc.totalParking + s.parking,
      totalBonus: acc.totalBonus + s.bonus,
      totalSalary: acc.totalSalary + s.salary,
      totalNetSalary: acc.totalNetSalary + s.netSalary,
      totalCash: acc.totalCash + (s.cash || 0),
      totalMonthTransfer: acc.totalMonthTransfer + (s.monthTransfer || 0),
    }), { totalHours: 0, totalFuel: 0, totalParking: 0, totalBonus: 0, totalSalary: 0, totalNetSalary: 0, totalCash: 0, totalMonthTransfer: 0 });

    const regularSummary = sumFields(regular);
    const trainingSummary = sumFields(training);
    const combined = sumFields(shifts);

    return res.json({ shifts, regularSummary, trainingSummary, summary: combined });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shifts/stats?mode=all or ?mode=month&month=5&year=2026
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const mode = req.query.mode as string;
    let filter: object = {};
    if (mode === 'month') {
      const month = parseInt(req.query.month as string);
      const year = parseInt(req.query.year as string);
      if (!isNaN(month) && !isNaN(year)) filter = { month, year };
    }

    const shifts = await Shift.find(filter).sort({ year: 1, month: 1 });

    // Group by month
    const byMonth: Record<string, typeof shifts> = {};
    shifts.forEach(s => {
      const key = `${s.year}-${String(s.month).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(s);
    });

    const monthlyRows = Object.entries(byMonth).map(([key, mShifts]) => {
      const [year, month] = key.split('-').map(Number);
      const regular = mShifts.filter(s => s.shiftType !== 'training');
      const training = mShifts.filter(s => s.shiftType === 'training');
      return {
        year, month,
        totalHours: mShifts.reduce((a, s) => a + s.hours, 0),
        regularShifts: regular.length,
        trainingShifts: training.length,
        shiftSalary: regular.reduce((a, s) => a + s.salary, 0),
        trainingSalary: training.reduce((a, s) => a + s.salary, 0),
        totalBonus: mShifts.reduce((a, s) => a + s.bonus, 0),
        totalSalary: mShifts.reduce((a, s) => a + s.salary, 0),
        totalFuel: mShifts.reduce((a, s) => a + s.fuel, 0),
        totalParking: mShifts.reduce((a, s) => a + s.parking, 0),
        netSalary: mShifts.reduce((a, s) => a + s.netSalary, 0),
      };
    });

    const totals = monthlyRows.reduce((acc, r) => ({
      totalHours: acc.totalHours + r.totalHours,
      shiftSalary: acc.shiftSalary + r.shiftSalary,
      trainingSalary: acc.trainingSalary + r.trainingSalary,
      totalBonus: acc.totalBonus + r.totalBonus,
      totalSalary: acc.totalSalary + r.totalSalary,
      totalFuel: acc.totalFuel + r.totalFuel,
      totalParking: acc.totalParking + r.totalParking,
      netSalary: acc.netSalary + r.netSalary,
    }), { totalHours: 0, shiftSalary: 0, trainingSalary: 0, totalBonus: 0, totalSalary: 0, totalFuel: 0, totalParking: 0, netSalary: 0 });

    return res.json({ monthlyRows, totals });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/shifts
router.post('/', async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findOne();
    const minWage = settings?.minWage ?? 32.3;
    const bonusPerHour = settings?.bonusPerHour ?? 10;
    const defaultTrainingRate = settings?.defaultTrainingRate ?? 32.3;

    const { date, startTime, endTime, isOvernight, hours, shiftType = 'regular', inputMode, enteredRate, dailySalary, fuel = 0, parking = 0 } = req.body;

    const calc = calcShiftFields(hours, shiftType, inputMode, enteredRate, dailySalary, fuel, parking, minWage, bonusPerHour, defaultTrainingRate);
    const dateObj = new Date(date);

    const shift = await Shift.create({
      date, startTime, endTime, isOvernight: isOvernight ?? false,
      hours, shiftType, inputMode, enteredRate, dailySalary,
      ...calc, fuel, parking,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
    });

    return res.status(201).json(shift);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/shifts/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findOne();
    const minWage = settings?.minWage ?? 32.3;
    const bonusPerHour = settings?.bonusPerHour ?? 10;
    const defaultTrainingRate = settings?.defaultTrainingRate ?? 32.3;

    const { date, startTime, endTime, isOvernight, hours, shiftType = 'regular', inputMode, enteredRate, dailySalary, fuel = 0, parking = 0 } = req.body;

    const calc = calcShiftFields(hours, shiftType, inputMode, enteredRate, dailySalary, fuel, parking, minWage, bonusPerHour, defaultTrainingRate);
    const dateObj = new Date(date);

    const shift = await Shift.findByIdAndUpdate(req.params.id, {
      date, startTime, endTime, isOvernight: isOvernight ?? false,
      hours, shiftType, inputMode, enteredRate, dailySalary,
      ...calc, fuel, parking,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
    }, { new: true });

    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    return res.json(shift);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/shifts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
