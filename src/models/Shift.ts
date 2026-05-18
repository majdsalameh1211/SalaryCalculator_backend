import mongoose, { Document, Schema } from 'mongoose';

export interface IShift extends Document {
  date: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  hours: number;
  shiftType: 'regular' | 'training';
  inputMode: 'hourly' | 'daily';
  enteredRate?: number;
  dailySalary?: number;
  hourlyRate: number;
  fuel: number;
  parking: number;
  // regular only
  cash?: number;
  monthTransfer?: number;
  // both
  bonus: number;
  salary: number;
  netSalary: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShiftSchema = new Schema<IShift>(
  {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isOvernight: { type: Boolean, default: false },
    hours: { type: Number, required: true },
    shiftType: { type: String, enum: ['regular', 'training'], default: 'regular' },
    inputMode: { type: String, enum: ['hourly', 'daily'], required: true },
    enteredRate: { type: Number },
    dailySalary: { type: Number },
    hourlyRate: { type: Number, required: true },
    fuel: { type: Number, default: 0 },
    parking: { type: Number, default: 0 },
    cash: { type: Number },
    monthTransfer: { type: Number },
    bonus: { type: Number, required: true },
    salary: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

ShiftSchema.index({ year: 1, month: 1 });

export const Shift = mongoose.model<IShift>('Shift', ShiftSchema);
