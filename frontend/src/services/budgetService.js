// src/services/budgetService.js

import api from './api';
import { localDb, generateUUID } from './localDb';
import syncService from './syncService';

class BudgetService {
  isOfflineMode() {
    return localStorage.getItem('auth_mode') === 'offline';
  }

  async getBudgets(params = {}) {
    let budgets = await localDb.budgets.toArray();
    if (params.categoryId) {
      budgets = budgets.filter(b => b.categoryId === params.categoryId);
    }
    return budgets;
  }

  async getBudgetById(id) {
    return await localDb.budgets.get(id);
  }

  async createBudget(budgetData) {
    const id = generateUUID();
    const newBudget = {
      ...budgetData,
      id,
      clientUuid: id,
      isActive: true,
      amount: Number(budgetData.amount),
      alertThreshold: Number(budgetData.alertThreshold || 80)
    };

    await localDb.budgets.put(newBudget);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'create',
        entityType: 'budget',
        clientUuid: id,
        payload: newBudget,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return newBudget;
  }

  async updateBudget(id, budgetData) {
    const existing = await localDb.budgets.get(id);
    if (!existing) throw new Error('Budget not found locally');

    const updatedBudget = {
      ...existing,
      ...budgetData,
      amount: Number(budgetData.amount || existing.amount),
      alertThreshold: Number(budgetData.alertThreshold || existing.alertThreshold)
    };

    await localDb.budgets.put(updatedBudget);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'update',
        entityType: 'budget',
        clientUuid: id,
        payload: updatedBudget,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return updatedBudget;
  }

  async deleteBudget(id) {
    await localDb.budgets.delete(id);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'delete',
        entityType: 'budget',
        clientUuid: id,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return { message: 'Budget deleted' };
  }

  async deactivateBudget(id) {
    return this.updateBudget(id, { isActive: false });
  }

  async getBudgetStatus(id) {
    const budget = await this.getBudgetById(id);
    if (!budget) throw new Error('Budget not found');

    const now = new Date();
    let periodStart = new Date(budget.startDate);
    let periodEnd = budget.endDate ? new Date(budget.endDate) : now;

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

    // Fetch transactions inside category
    const txs = await localDb.transactions.toArray();
    const categoryTxs = txs.filter(t => 
      t.categoryId === budget.categoryId && 
      t.type === 'expense' &&
      new Date(t.date) >= periodStart &&
      new Date(t.date) <= periodEnd
    );
    const totalSpent = categoryTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const remaining = budget.amount - totalSpent;
    const percentageUsed = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;
    const isOverBudget = totalSpent > budget.amount;
    const isNearLimit = percentageUsed >= (budget.alertThreshold || 80);

    const cats = await localDb.categories.toArray();
    const cat = cats.find(c => c.id === budget.categoryId);

    return {
      budget: {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: cat?.name || 'Unknown',
        amount: budget.amount,
        period: budget.period,
        alertThreshold: budget.alertThreshold || 80,
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

  async getBudgetOverview(period = null) {
    let budgets = await this.getBudgets();
    if (period) {
      budgets = budgets.filter(b => b.period === period);
    }

    const budgetStatuses = [];
    for (const b of budgets) {
      try {
        const status = await this.getBudgetStatus(b.id);
        budgetStatuses.push(status);
      } catch (err) {
        console.error(`Failed to get status for budget ${b.id}:`, err);
      }
    }

    const summary = {
      totalBudgets: budgetStatuses.length,
      totalBudgeted: budgetStatuses.reduce((sum, b) => sum + b.budget.amount, 0),
      totalSpent: budgetStatuses.reduce((sum, b) => sum + b.spending.totalSpent, 0),
      overBudgetCount: budgetStatuses.filter(b => b.spending.isOverBudget).length,
      nearLimitCount: budgetStatuses.filter(b => b.spending.isNearLimit).length
    };

    return {
      data: {
        summary,
        budgets: budgetStatuses
      }
    };
  }

  async getBudgetAlerts() {
    const budgets = await this.getBudgets();
    const alerts = [];

    for (const b of budgets) {
      try {
        const status = await this.getBudgetStatus(b.id);
        if (status.spending.isOverBudget) {
          alerts.push({
            type: 'over_budget',
            severity: 'high',
            budgetId: b.id,
            categoryName: status.budget.categoryName,
            message: `You have exceeded your ${b.period} budget for ${status.budget.categoryName} by ${parseFloat(status.spending.overBudgetAmount).toFixed(2)}`,
            data: status
          });
        } else if (status.spending.isNearLimit) {
          alerts.push({
            type: 'near_limit',
            severity: 'medium',
            budgetId: b.id,
            categoryName: status.budget.categoryName,
            message: `You have used ${status.spending.percentageUsed}% of your ${b.period} budget for ${status.budget.categoryName}`,
            data: status
          });
        }
      } catch (err) {
        console.error(`Failed to check alerts for budget ${b.id}:`, err);
      }
    }

    return {
      data: {
        alerts
      }
    };
  }
}

export default new BudgetService();