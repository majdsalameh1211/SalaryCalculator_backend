// src/routes/expenses.routes.ts
import { Router } from 'express';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/expenses.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateExpense } from '../middleware/validate.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', getExpenses);
router.post('/', validateExpense, createExpense);
router.put('/:id', validateExpense, updateExpense);
router.delete('/:id', deleteExpense);

export default router;