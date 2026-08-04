import { prisma } from "../config/db.js";
import logger from "../utils/logger.js";

const safeParseDate = (val) => {
  if (val === undefined || val === null || val === "") return null;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const syncData = async (req, res) => {
  const { userId } = req.user;
  const { mutations } = req.body;

  if (!Array.isArray(mutations)) {
    return res.status(400).json({ message: "Invalid mutations format" });
  }

  const processedIds = [];
  const errors = [];

  // Use a transaction to ensure all sync operations succeed or roll back together
  try {
    await prisma.$transaction(async (tx) => {
      for (const mut of mutations) {
        try {
          const { id: queueId, action, entityType, clientUuid, payload } = mut;
          
          // Sanitization: Keep only schema-valid fields for each model
          const sanitizedData = { userId };
          
          if (entityType === "category") {
            const allowed = ["clientUuid", "name", "type", "description", "createdAt"];
            allowed.forEach(k => { if (payload[k] !== undefined) sanitizedData[k] = payload[k]; });
          } else if (entityType === "transaction") {
            const allowed = ["clientUuid", "amount", "description", "type", "date", "createdAt", "categoryId"];
            allowed.forEach(k => { if (payload[k] !== undefined) sanitizedData[k] = payload[k]; });
          } else if (entityType === "budget") {
            const allowed = ["clientUuid", "amount", "period", "startDate", "endDate", "alertThreshold", "isActive", "createdAt", "updatedAt", "categoryId"];
            allowed.forEach(k => { if (payload[k] !== undefined) sanitizedData[k] = payload[k]; });
          } else if (entityType === "goal") {
            const allowed = ["clientUuid", "name", "targetAmount", "currentAmount", "deadline", "createdAt", "updatedAt"];
            allowed.forEach(k => { if (payload[k] !== undefined) sanitizedData[k] = payload[k]; });
          } else if (entityType === "subscription") {
            const allowed = ["clientUuid", "name", "amount", "billingCycle", "nextBillingDate", "isActive", "createdAt", "updatedAt", "categoryId"];
            allowed.forEach(k => { if (payload[k] !== undefined) sanitizedData[k] = payload[k]; });
          }

          // Force userId to the authenticated user's ID
          sanitizedData.userId = userId;
          const data = sanitizedData;

          // Make sure date fields are parsed properly into Date objects for Prisma
          if (data.date !== undefined) data.date = safeParseDate(data.date);
          if (data.startDate !== undefined) data.startDate = safeParseDate(data.startDate);
          if (data.endDate !== undefined) data.endDate = safeParseDate(data.endDate);
          if (data.deadline !== undefined) data.deadline = safeParseDate(data.deadline);
          if (data.nextBillingDate !== undefined) data.nextBillingDate = safeParseDate(data.nextBillingDate);

          if (entityType === "category") {
            if (action === "create" || action === "update") {
              let existing = await tx.category.findUnique({ where: { clientUuid } });
              
              if (!existing) {
                // Check if a category with the same name already exists for this user
                existing = await tx.category.findFirst({
                  where: { userId, name: data.name }
                });
                
                if (existing) {
                  // Link the existing category with the incoming clientUuid
                  existing = await tx.category.update({
                    where: { id: existing.id },
                    data: { clientUuid }
                  });
                }
              }

              if (existing) {
                if (existing.userId !== userId) throw new Error("Unauthorized update for category");
                await tx.category.update({ where: { clientUuid }, data });
              } else {
                await tx.category.create({ data: { ...data, clientUuid } });
              }
            } else if (action === "delete") {
              await tx.category.deleteMany({
                where: { clientUuid: clientUuid, userId: userId }
              });
            }
          } else if (entityType === "transaction") {
            // Ensure categoryId points to the correct Category in the database
            if (data.categoryId) {
              const cat = await tx.category.findUnique({
                where: { clientUuid: data.categoryId }
              });
              if (cat) {
                data.categoryId = cat.id;
              }
            }

            if (action === "create" || action === "update") {
              const existing = await tx.transaction.findUnique({ where: { clientUuid } });
              if (existing) {
                if (existing.userId !== userId) throw new Error("Unauthorized update for transaction");
                await tx.transaction.update({ where: { clientUuid }, data });
              } else {
                await tx.transaction.create({ data: { ...data, clientUuid } });
              }
            } else if (action === "delete") {
              await tx.transaction.deleteMany({
                where: { clientUuid: clientUuid, userId: userId }
              });
            }
          } else if (entityType === "budget") {
            if (data.categoryId) {
              const cat = await tx.category.findUnique({
                where: { clientUuid: data.categoryId }
              });
              if (cat) {
                data.categoryId = cat.id;
              }
            }

            if (action === "create" || action === "update") {
              const existing = await tx.budget.findUnique({ where: { clientUuid } });
              if (existing) {
                if (existing.userId !== userId) throw new Error("Unauthorized update for budget");
                await tx.budget.update({ where: { clientUuid }, data });
              } else {
                await tx.budget.create({ data: { ...data, clientUuid } });
              }
            } else if (action === "delete") {
              await tx.budget.deleteMany({
                where: { clientUuid: clientUuid, userId: userId }
              });
            }
          } else if (entityType === "goal") {
            if (action === "create" || action === "update") {
              const existing = await tx.goal.findUnique({ where: { clientUuid } });
              if (existing) {
                if (existing.userId !== userId) throw new Error("Unauthorized update for goal");
                await tx.goal.update({ where: { clientUuid }, data });
              } else {
                await tx.goal.create({ data: { ...data, clientUuid } });
              }
            } else if (action === "delete") {
              await tx.goal.deleteMany({
                where: { clientUuid: clientUuid, userId: userId }
              });
            }
          } else if (entityType === "subscription") {
            if (data.categoryId) {
              const cat = await tx.category.findUnique({
                where: { clientUuid: data.categoryId }
              });
              if (cat) {
                data.categoryId = cat.id;
              }
            }

            if (action === "create" || action === "update") {
              const existing = await tx.subscription.findUnique({ where: { clientUuid } });
              if (existing) {
                if (existing.userId !== userId) throw new Error("Unauthorized update for subscription");
                await tx.subscription.update({ where: { clientUuid }, data });
              } else {
                await tx.subscription.create({ data: { ...data, clientUuid } });
              }
            } else if (action === "delete") {
              await tx.subscription.deleteMany({
                where: { clientUuid: clientUuid, userId: userId }
              });
            }
          }

          processedIds.push(queueId);
        } catch (err) {
          logger.error(`Sync error on mutation: ${JSON.stringify(mut)}. Error: ${err.message}`);
          errors.push({ mutationId: mut.id, error: err.message });
        }
      }
    });

    // Pull the latest updates to return to the client
    const updates = await fetchUserUpdates(userId);

    res.status(200).json({
      message: "Sync completed",
      processedIds,
      errors,
      updates
    });

  } catch (error) {
    logger.error(`Sync transaction failed: ${error.message}`);
    res.status(500).json({ message: "Sync transaction failed", error: error.message });
  }
};

export const pullUpdates = async (req, res) => {
  const { userId } = req.user;
  try {
    const updates = await fetchUserUpdates(userId);
    res.status(200).json({ updates });
  } catch (error) {
    res.status(500).json({ message: "Failed to pull updates", error: error.message });
  }
};

// Helper function to fetch all user data from DB
async function fetchUserUpdates(userId) {
  const categories = await prisma.category.findMany({ where: { userId } });
  const transactions = await prisma.transaction.findMany({ where: { userId } });
  const budgets = await prisma.budget.findMany({ where: { userId } });
  const goals = await prisma.goal.findMany({ where: { userId } });
  const subscriptions = await prisma.subscription.findMany({ where: { userId } });

  // Self-heal any legacy or seeded database records missing a clientUuid
  for (const cat of categories) {
    if (!cat.clientUuid) {
      cat.clientUuid = cat.id;
      await prisma.category.update({ where: { id: cat.id }, data: { clientUuid: cat.id } });
    }
  }
  for (const tx of transactions) {
    if (!tx.clientUuid) {
      tx.clientUuid = tx.id;
      await prisma.transaction.update({ where: { id: tx.id }, data: { clientUuid: tx.id } });
    }
  }
  for (const b of budgets) {
    if (!b.clientUuid) {
      b.clientUuid = b.id;
      await prisma.budget.update({ where: { id: b.id }, data: { clientUuid: b.id } });
    }
  }
  for (const g of goals) {
    if (!g.clientUuid) {
      g.clientUuid = g.id;
      await prisma.goal.update({ where: { id: g.id }, data: { clientUuid: g.id } });
    }
  }
  for (const s of subscriptions) {
    if (!s.clientUuid) {
      s.clientUuid = s.id;
      await prisma.subscription.update({ where: { id: s.id }, data: { clientUuid: s.id } });
    }
  }

  return {
    categories,
    transactions,
    budgets,
    goals,
    subscriptions
  };
}
