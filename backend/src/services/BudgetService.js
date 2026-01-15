// backend/src/services/BudgetService.js
import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";

class BudgetService {
  
  // Create a new budget
  static async createBudget(userId, budgetData) {
    const { categoryId, amount, period, startDate, endDate, alertThreshold } = budgetData;

    // Verify category exists and belongs to user
    const category = await Category.findOne({
      _id: categoryId,
      userId
    });

    if (!category) {
      throw new Error("Category not found or access denied");
    }

    // Only allow budgets for expense categories
    if (category.type !== "expense") {
      throw new Error("Budgets can only be created for expense categories");
    }

    // Check if active budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      userId,
      categoryId,
      period,
      isActive: true
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

    const budget = await Budget.create({
      userId,
      categoryId,
      amount,
      period,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      alertThreshold: alertThreshold || 80,
      isActive: true
    });

    return budget;
  }

  // Get all budgets for a user
  static async getUserBudgets(userId, options = {}) {
    const { period, isActive, categoryId } = options;

    const query = { userId };
    
    if (period) query.period = period;
    if (typeof isActive !== 'undefined') query.isActive = isActive;
    if (categoryId) query.categoryId = categoryId;

    const budgets = await Budget.find(query)
      .populate('categoryId', 'name type')
      .sort({ createdAt: -1 });

    return budgets;
  }

  // Get budget by ID
  static async getBudgetById(budgetId, userId) {
    const budget = await Budget.findOne({
      _id: budgetId,
      userId
    }).populate('categoryId', 'name type');

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    return budget;
  }

  // Update budget
  static async updateBudget(budgetId, userId, updateData) {
    const budget = await Budget.findOne({
      _id: budgetId,
      userId
    });

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    // Validate category if being updated
    if (updateData.categoryId) {
      const category = await Category.findOne({
        _id: updateData.categoryId,
        userId
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

    // Update fields
    Object.keys(updateData).forEach(key => {
      budget[key] = updateData[key];
    });

    await budget.save();

    return budget;
  }

  // Delete budget
  static async deleteBudget(budgetId, userId) {
    const budget = await Budget.findOneAndDelete({
      _id: budgetId,
      userId
    });

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    return budget;
  }

  // Deactivate budget (soft delete)
  static async deactivateBudget(budgetId, userId) {
    const budget = await Budget.findOne({
      _id: budgetId,
      userId
    });

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    budget.isActive = false;
    await budget.save();

    return budget;
  }

  // Get budget status with spending information
  static async getBudgetStatus(budgetId, userId) {
    const budget = await Budget.findOne({
      _id: budgetId,
      userId
    }).populate('categoryId', 'name type');

    if (!budget) {
      throw new Error("Budget not found or access denied");
    }

    const now = new Date();
    let periodStart = new Date(budget.startDate);
    // If no end date is set for custom, use 'now' to track up to the present moment
    let periodEnd = budget.endDate ? new Date(budget.endDate) : now;

    // Override dates ONLY for standard periods
    if (budget.period === "weekly") {
      const dayOfWeek = now.getDay(); 
      const daysSinceSunday = dayOfWeek;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - daysSinceSunday);
      periodStart.setHours(0, 0, 0, 0); // Normalize to start of day
      
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999); // Normalize to end of day
    } 
    else if (budget.period === "monthly") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } 
    else if (budget.period === "yearly") {
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31);
    }
    // else if (budget.period === "custom") { 

    const spending = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId), 
          categoryId: new mongoose.Types.ObjectId(budget.categoryId._id), 
          type: "expense",
          date: {
            $gte: periodStart,
            $lte: periodEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    const totalSpent = spending[0]?.total || 0;
    const remaining = budget.amount - totalSpent;
    const percentageUsed = (totalSpent / budget.amount) * 100;
    const isOverBudget = totalSpent > budget.amount;
    const isNearLimit = percentageUsed >= budget.alertThreshold;

    return {
      budget: {
        id: budget._id,
        categoryId: budget.categoryId._id,
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
    const query = { userId, isActive: true };
    if (period) query.period = period;

    const budgets = await Budget.find(query).populate('categoryId', 'name type');

    const budgetStatuses = await Promise.all(
      budgets.map(budget => this.getBudgetStatus(budget._id, userId))
    );

    // Calculate summary statistics
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
    const activeBudgets = await Budget.find({
      userId,
      isActive: true
    });

    const alerts = [];

    for (const budget of activeBudgets) {
      const status = await this.getBudgetStatus(budget._id, userId);
      
      if (status.spending.isOverBudget) {
        alerts.push({
          type: 'over_budget',
          severity: 'high',
          budgetId: budget._id,
          categoryName: status.budget.categoryName,
          message: `You have exceeded your ${budget.period} budget for ${status.budget.categoryName} by ${status.spending.overBudgetAmount.toFixed(2)}`,
          data: status
        });
      } else if (status.spending.isNearLimit) {
        alerts.push({
          type: 'near_limit',
          severity: 'medium',
          budgetId: budget._id,
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