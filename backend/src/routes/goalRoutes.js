import express from 'express';
import { getGoals, createGoal, addFunds, deleteGoal } from '../controller/goalController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id/add-funds', addFunds);
router.delete('/:id', deleteGoal);

export default router;
