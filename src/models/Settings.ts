import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  minWage: number;
  hoursThreshold: number;
  bonusPerHour: number;
  defaultFuel: number;
  defaultParking: number;
  defaultTrainingRate: number;
}

const SettingsSchema = new Schema<ISettings>(
  {
    minWage: { type: Number, default: 32.3 },
    hoursThreshold: { type: Number, default: 50 },
    bonusPerHour: { type: Number, default: 10 },
    defaultFuel: { type: Number, default: 0 },
    defaultParking: { type: Number, default: 0 },
    defaultTrainingRate: { type: Number, default: 32.3 },
  },
  { timestamps: true }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
