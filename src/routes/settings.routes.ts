// src/routes/settings.routes.ts
import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;