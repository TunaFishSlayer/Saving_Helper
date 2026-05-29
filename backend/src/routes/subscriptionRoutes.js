import express from 'express';
import { getSubscriptions, createSubscription, toggleSubscription, deleteSubscription } from '../controller/subscriptionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getSubscriptions);
router.post('/', createSubscription);
router.put('/:id/toggle', toggleSubscription);
router.delete('/:id', deleteSubscription);

export default router;
