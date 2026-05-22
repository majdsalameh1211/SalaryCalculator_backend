// src/routes/shifts.routes.ts
import { Router } from 'express';
import { getShifts, createShift, updateShift, deleteShift } from '../controllers/shifts.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateShift } from '../middleware/validate.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', getShifts);
router.post('/', validateShift, createShift);
router.put('/:id', validateShift, updateShift);
router.delete('/:id', deleteShift);

export default router;  