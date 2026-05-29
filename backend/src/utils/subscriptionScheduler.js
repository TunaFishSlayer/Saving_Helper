import { prisma } from "../config/db.js";
import logger from "./logger.js";

/**
 * Calculates the next billing date based on the billing cycle
 * @param {Date} currentDate 
 * @param {string} cycle - weekly, monthly, yearly
 * @returns {Date}
 */
const getNextBillingDate = (currentDate, cycle) => {
  const nextDate = new Date(currentDate);
  switch (cycle) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Fallback monthly
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  return nextDate;
};

/**
 * Iterates over all active subscriptions whose next billing date has arrived
 * and automatically records transaction expenses for them.
 */
export const processSubscriptions = async () => {
  try {
    const now = new Date();
    
    // Find all active subscriptions that are due or overdue
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        isActive: true,
        nextBillingDate: {
          lte: now
        }
      }
    });

    if (dueSubscriptions.length === 0) {
      return;
    }

    logger.info(`[SubscriptionScheduler] Found ${dueSubscriptions.length} due subscriptions. Processing...`);

    for (const sub of dueSubscriptions) {
      await prisma.$transaction(async (tx) => {
        // 1. Record the transaction expense
        await tx.transaction.create({
          data: {
            amount: sub.amount,
            description: `Subscription: ${sub.name}`,
            type: "expense",
            date: sub.nextBillingDate,
            userId: sub.userId,
            categoryId: sub.categoryId
          }
        });

        // 2. Increment nextBillingDate
        const nextDate = getNextBillingDate(sub.nextBillingDate, sub.billingCycle);

        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate: nextDate
          }
        });

        logger.info(`[SubscriptionScheduler] Processed subscription "${sub.name}" for user ${sub.userId}. Next billing: ${nextDate.toISOString()}`);
      });
    }

    logger.info(`[SubscriptionScheduler] Successfully processed all due subscriptions.`);
  } catch (error) {
    logger.error(`[SubscriptionScheduler] Error processing subscriptions: ${error.message}`);
  }
};

/**
 * Starts the interval task for processing subscriptions
 * Runs on boot, and then checks every interval
 * @param {number} intervalMs - defaults to 12 hours
 */
export const startSubscriptionScheduler = (intervalMs = 12 * 60 * 60 * 1000) => {
  logger.info("[SubscriptionScheduler] Initializing subscription scheduler...");
  
  // Run on startup
  processSubscriptions();

  // Schedule periodic runs
  setInterval(() => {
    logger.info("[SubscriptionScheduler] Running periodic check...");
    processSubscriptions();
  }, intervalMs);
};
