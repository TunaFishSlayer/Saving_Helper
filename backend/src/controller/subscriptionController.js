import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all subscriptions for a user
export const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      include: { category: true },
      orderBy: { nextBillingDate: 'asc' }
    });
    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

// Create a new subscription
export const createSubscription = async (req, res, next) => {
  try {
    const { name, amount, billingCycle, nextBillingDate, categoryId } = req.body;
    const subscription = await prisma.subscription.create({
      data: {
        name,
        amount,
        billingCycle,
        nextBillingDate: new Date(nextBillingDate),
        categoryId,
        userId: req.user.id
      },
      include: { category: true }
    });
    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
};

// Toggle subscription status
export const toggleSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const subscription = await prisma.subscription.update({
      where: { id, userId: req.user.id },
      data: { isActive },
      include: { category: true }
    });
    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

// Delete a subscription
export const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.subscription.delete({
      where: { id, userId: req.user.id }
    });
    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    next(error);
  }
};
