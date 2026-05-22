// src/controllers/settings.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Settings } from '../models/Settings.model';

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) { next(err); }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {}, 
      { $set: req.body }, 
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
  } catch (err) { next(err); }
};