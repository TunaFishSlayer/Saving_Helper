import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all goals for a user
export const getGoals = async (req, res, next) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(goals);
  } catch (error) {
    next(error);
  }
};

// Create a new goal
export const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, deadline } = req.body;
    const goal = await prisma.goal.create({
      data: {
        name,
        targetAmount,
        deadline: deadline ? new Date(deadline) : null,
        userId: req.user.id
      }
    });
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

// Add funds to a goal (update currentAmount)
export const addFunds = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Optional: add validation here

    const goal = await prisma.goal.update({
      where: { id, userId: req.user.id },
      data: {
        currentAmount: { increment: amount }
      }
    });
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

// Delete a goal
export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.goal.delete({
      where: { id, userId: req.user.id }
    });
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    next(error);
  }
};
