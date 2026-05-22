import { prisma } from "../config/db.js";

class BudgetService {
  
  // Helper to format Prisma results to match Mongoose population structure
  static _formatBudget(budget) {
    if (!budget) return null;
    const formatted = { ...budget };
    
    if (budget.category) {
      formatted.categoryId = {
        ...budget.category
      };
      delete formatted.category;
    }
    
    return formatted;
  }

  // Create a new budget
  static async createBudget(userId, budgetData) {
    const { categoryId, amount, period, startDate, endDate, alertThreshold } = budgetData;

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId
      }
    });

    if (!category) {
      throw new Error("Category not found or access denied");
    }

    // Only allow budgets for expense categories
    if (category.type !== "expense") {
      throw new Error("Budgets can only be created for expense categories");
    }

    // Check if active budget already exists for this category and period
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId,
        categoryId,
        period,
        isActive: true
      }
    });

    if (existingBudget) {
      throw new Error(`Active ${period} budget already exists for this category`);
    }

    // Validate dates
    const start = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      if (end <= start) {
        throw new Error("End date must be after start date");
      }
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId,
        amount: parseFloat(amount),
        period,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        alertThreshold: alertThreshold ? parseFloat(alertThreshold) : 80,
        isActive: true
      }
    });

    return budget;
  }

  // Get all budgets for a user
  static async getUserBudgets(userId, options = {}) {
    const { period, isActive, categoryId } = options;

    const where = { userId };
    
    if (period) where.period = period;
    if (typeof isActive !== 'undefined') {
      where.isActive = isActive === 'true' || isActive === true;
    }
    if (categoryId) where.categoryId = categoryId;

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return budgets.map(this._formatBudget);
  }

  // Get budget by ID
  static async getBudgetById(budgetId, userId) {
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    return this._formatBudget(budget);
  }

  // Update budget
  static async updateBudget(budgetId, userId, updateData) {
    // Verify ownership
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId
      }
    });

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    // Validate category if being updated
    if (updateData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: updateData.categoryId,
          userId
        }
      });

      if (!category) {
        throw new Error("Category not found or access denied");
      }

      if (category.type !== "expense") {
        throw new Error("Budgets can only be created for expense categories");
      }
    }

    // Validate dates if being updated
    if (updateData.startDate || updateData.endDate) {
      const start = updateData.startDate ? new Date(updateData.startDate) : budget.startDate;
      const end = updateData.endDate ? new Date(updateData.endDate) : budget.endDate;

      if (end && end <= start) {
        throw new Error("End date must be after start date");
      }
    }

    const { id, userId: uId, ...safeUpdateData } = updateData;
    
    // Cast explicit data types safely
    if (safeUpdateData.amount) safeUpdateData.amount = parseFloat(safeUpdateData.amount);
    if (safeUpdateData.alertThreshold) safeUpdateData.alertThreshold = parseFloat(safeUpdateData.alertThreshold);
    if (safeUpdateData.startDate) safeUpdateData.startDate = new Date(safeUpdateData.startDate);
    if (safeUpdateData.endDate) safeUpdateData.endDate = new Date(safeUpdateData.endDate);

    // Run update
    return prisma.budget.update({
      where: {
        id: budgetId
      },
      data: safeUpdateData
    });
  }

  // Delete budget
  static async deleteBudget(budgetId, userId) {
    // Verify ownership first
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId
      }
    });

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    return prisma.budget.delete({
      where: {
        id: budgetId
      }
    });
  }

  // Deactivate budget (soft delete)
  static async deactivateBudget(budgetId, userId) {
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId
      }
    });

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    return prisma.budget.update({
      where: {
        id: budgetId
      },
      data: {
        isActive: false
      }
    });
  }

  // Get budget status with spending information
  static async getBudgetStatus(budgetId, userId) {
    // Load full budget with category info
    const rawBudget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    if (!rawBudget) {
      throw new Error("Budget not found or access denied");
    }

    const budget = this._formatBudget(rawBudget);
    const now = new Date();
    let periodStart = new Date(budget.startDate);
    let periodEnd = budget.endDate ? new Date(budget.endDate) : now;

    // Standard logic to override start/end boundings by period type
    if (budget.period === "weekly") {
      const dayOfWeek = now.getDay(); 
      const daysSinceSunday = dayOfWeek;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - daysSinceSunday);
      periodStart.setHours(0, 0, 0, 0);
      
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
    } 
    else if (budget.period === "monthly") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } 
    else if (budget.period === "yearly") {
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    // Calculate total expense in range using relational Prisma aggregates
    const spendingResult = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      },
      where: {
        userId,
        categoryId: budget.categoryId.id,
        type: "expense",
        date: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    const totalSpent = spendingResult._sum.amount || 0;
    const remaining = budget.amount - totalSpent;
    const percentageUsed = (totalSpent / budget.amount) * 100;
    const isOverBudget = totalSpent > budget.amount;
    const isNearLimit = percentageUsed >= budget.alertThreshold;

    return {
      budget: {
        id: budget.id,
        categoryId: budget.categoryId.id,
        categoryName: budget.categoryId.name,
        amount: budget.amount,
        period: budget.period,
        alertThreshold: budget.alertThreshold,
        isActive: budget.isActive
      },
      spending: {
        totalSpent,
        remaining: remaining > 0 ? remaining : 0,
        percentageUsed: Math.min(percentageUsed, 100).toFixed(2),
        isOverBudget,
        isNearLimit: isNearLimit && !isOverBudget,
        overBudgetAmount: isOverBudget ? Math.abs(remaining) : 0
      },
      period: {
        start: periodStart,
        end: periodEnd
      }
    };
  }

  // Get overview of all budgets with their statuses
  static async getBudgetOverview(userId, period) {
    const where = { userId, isActive: true };
    if (period) where.period = period;

    const budgets = await prisma.budget.findMany({
      where,
      select: {
        id: true
      }
    });

    // Collect statuses sequential (or parallelized since single SQL pool supports concurrently)
    const budgetStatuses = await Promise.all(
      budgets.map(budget => this.getBudgetStatus(budget.id, userId))
    );

    const summary = {
      totalBudgets: budgetStatuses.length,
      totalBudgeted: budgetStatuses.reduce((sum, b) => sum + b.budget.amount, 0),
      totalSpent: budgetStatuses.reduce((sum, b) => sum + b.spending.totalSpent, 0),
      overBudgetCount: budgetStatuses.filter(b => b.spending.isOverBudget).length,
      nearLimitCount: budgetStatuses.filter(b => b.spending.isNearLimit).length
    };

    return {
      summary,
      budgets: budgetStatuses
    };
  }

  // Check if any budget alerts should be triggered
  static async checkBudgetAlerts(userId) {
    const activeBudgets = await prisma.budget.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        id: true,
        period: true
      }
    });

    const alerts = [];

    for (const budget of activeBudgets) {
      const status = await this.getBudgetStatus(budget.id, userId);
      
      if (status.spending.isOverBudget) {
        alerts.push({
          type: 'over_budget',
          severity: 'high',
          budgetId: budget.id,
          categoryName: status.budget.categoryName,
          message: `You have exceeded your ${budget.period} budget for ${status.budget.categoryName} by ${parseFloat(status.spending.overBudgetAmount).toFixed(2)}`,
          data: status
        });
      } else if (status.spending.isNearLimit) {
        alerts.push({
          type: 'near_limit',
          severity: 'medium',
          budgetId: budget.id,
          categoryName: status.budget.categoryName,
          message: `You have used ${status.spending.percentageUsed}% of your ${budget.period} budget for ${status.budget.categoryName}`,
          data: status
        });
      }
    }

    return alerts;
  }
}

export default BudgetService;