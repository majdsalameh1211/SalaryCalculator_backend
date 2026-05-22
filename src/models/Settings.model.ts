// src/models/Settings.model.ts
import mongoose, { Document } from 'mongoose';

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  minWage: number;
  bonusRatePerHour: number;
  trainingHourRate: number;
  goodRateThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new mongoose.Schema<ISettings>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // one settings document per user
    },
    minWage: { type: Number, default: 32.3 },
    bonusRatePerHour: { type: Number, default: 10 },
    trainingHourRate: { type: Number, default: 25 },
    goodRateThreshold: { type: Number, default: 50 }
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

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);