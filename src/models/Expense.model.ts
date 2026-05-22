// src/models/Expense.model.ts
import mongoose, { Document } from 'mongoose';

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'fuel' | 'parking';
  date: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new mongoose.Schema<IExpense>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: { type: String, enum: ['fuel', 'parking'], required: true },
    date: { type: String, required: true },
    amount: { type: Number, required: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index — always scoped by userId first
expenseSchema.index({ userId: 1, date: -1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);