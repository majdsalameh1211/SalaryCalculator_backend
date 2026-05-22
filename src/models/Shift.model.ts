// src/models/Shift.model.ts
import mongoose, { Document } from 'mongoose';

export interface IShift extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'regular' | 'training';
  date: string;
  startTime: string;
  endTime: string;
  hourRate?: number;
  dailySalary?: number;
  totalHours: number;
  cash: number;
  transfer: number;
  status: 'red' | 'yellow' | 'green' | 'training';
  minWageApplied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new mongoose.Schema<IShift>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: { type: String, enum: ['regular', 'training'], required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    hourRate: { type: Number },
    dailySalary: { type: Number },
    totalHours: { type: Number, required: true },
    cash: { type: Number, required: true },
    transfer: { type: Number, required: true },
    status: { type: String, enum: ['red', 'yellow', 'green', 'training'], required: true },
    minWageApplied: { type: Boolean, required: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString?.();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes — always scoped by userId first
shiftSchema.index({ userId: 1, date: -1 });
shiftSchema.index({ userId: 1, type: 1, date: -1 });

export const Shift = mongoose.model<IShift>('Shift', shiftSchema);