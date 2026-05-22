// src/services/calc.service.ts
import { Settings } from '../models/Settings.model';

const round = (num: number) => Math.round(num * 100) / 100;

const parseTime = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
};

// Per-user settings cache
interface CacheEntry {
  settings: any;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60_000; // 60 seconds

export const getSettingsForUser = async (userId: string) => {
  const entry = cache.get(userId);
  if (entry && Date.now() - entry.cachedAt < CACHE_TTL) {
    return entry.settings;
  }

  let settings = await Settings.findOne({ userId }).lean();
  if (!settings) {
    settings = await Settings.create({ userId });
  }

  cache.set(userId, { settings, cachedAt: Date.now() });
  return settings;
};

export const invalidateSettingsCache = (userId: string): void => {
  cache.delete(userId);
};

export interface ShiftInput {
  type: 'regular' | 'training';
  date: string;
  startTime: string;
  endTime: string;
  hourRate?: number;
  dailySalary?: number;
}

export interface ShiftResult extends ShiftInput {
  totalHours: number;
  dailySalary: number;
  cash: number;
  transfer: number;
  status: 'red' | 'yellow' | 'green' | 'training';
  minWageApplied: boolean;
}

export const calculateShift = async (data: ShiftInput, userId: string): Promise<ShiftResult> => {
  const settings = await getSettingsForUser(userId);

  let hours = parseTime(data.endTime) - parseTime(data.startTime);
  if (hours <= 0) hours += 24;
  const totalHours = round(hours);

  let cash = 0;
  let transfer = 0;
  let status: ShiftResult['status'] = 'yellow';
  let minWageApplied = false;
  let dailySalary = 0;

  if (data.type === 'training') {
    dailySalary = round(totalHours * settings.trainingHourRate);
    transfer = dailySalary;
    status = 'training';
  } else {
    let effectiveRate = 0;

    if (data.hourRate) {
      effectiveRate = data.hourRate;
      dailySalary = effectiveRate * totalHours;
    } else if (data.dailySalary) {
      dailySalary = data.dailySalary;
      effectiveRate = dailySalary / totalHours;
    }

    if (effectiveRate < settings.minWage) {
      effectiveRate = settings.minWage;
      dailySalary = effectiveRate * totalHours;
      minWageApplied = true;
    }

    dailySalary = round(dailySalary);
    cash = round(dailySalary / 2);
    transfer = round(dailySalary / 2);

    if (minWageApplied) {
      status = 'red';
    } else if (effectiveRate >= settings.goodRateThreshold) {
      status = 'green';
    }
  }

  return {
    ...data,
    totalHours,
    dailySalary,
    cash,
    transfer,
    status,
    minWageApplied
  };
};