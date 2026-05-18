import { Router, Request, Response } from 'express';
import { Settings } from '../models/Settings';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const { minWage, hoursThreshold, bonusPerHour, defaultFuel, defaultParking, defaultTrainingRate } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ minWage, hoursThreshold, bonusPerHour, defaultFuel, defaultParking, defaultTrainingRate });
    } else {
      if (minWage !== undefined) settings.minWage = minWage;
      if (hoursThreshold !== undefined) settings.hoursThreshold = hoursThreshold;
      if (bonusPerHour !== undefined) settings.bonusPerHour = bonusPerHour;
      if (defaultFuel !== undefined) settings.defaultFuel = defaultFuel;
      if (defaultParking !== undefined) settings.defaultParking = defaultParking;
      if (defaultTrainingRate !== undefined) settings.defaultTrainingRate = defaultTrainingRate;
      await settings.save();
    }
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
