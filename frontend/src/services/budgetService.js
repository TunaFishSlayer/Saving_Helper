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
      limitAmount: Number(budgetData.limitAmount)
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
      limitAmount: Number(budgetData.limitAmount)
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

    // Fetch transactions inside category
    const txs = await localDb.transactions.toArray();
    const categoryTxs = txs.filter(t => t.categoryId === budget.categoryId && t.type === 'expense');
    const totalSpent = categoryTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      budget,
      totalSpent,
      remaining: budget.limitAmount - totalSpent,
      percentage: (totalSpent / budget.limitAmount) * 100
    };
  }

  async getBudgetOverview(period = null) {
    let budgets = await this.getBudgets();
    if (period) {
      budgets = budgets.filter(b => b.period === period);
    }

    const txs = await localDb.transactions.toArray();
    const overviewList = [];

    for (const b of budgets) {
      const categoryTxs = txs.filter(t => t.categoryId === b.categoryId && t.type === 'expense');
      const totalSpent = categoryTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      overviewList.push({
        id: b.id,
        limitAmount: b.limitAmount,
        period: b.period,
        categoryId: b.categoryId,
        totalSpent,
        remaining: b.limitAmount - totalSpent,
        percentage: (totalSpent / b.limitAmount) * 100
      });
    }

    return overviewList;
  }

  async getBudgetAlerts() {
    const budgets = await this.getBudgets();
    const txs = await localDb.transactions.toArray();
    const alerts = [];

    for (const b of budgets) {
      const categoryTxs = txs.filter(t => t.categoryId === b.categoryId && t.type === 'expense');
      const totalSpent = categoryTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const percentage = (totalSpent / b.limitAmount) * 100;

      if (percentage >= 80) {
        alerts.push({
          budgetId: b.id,
          categoryId: b.categoryId,
          limitAmount: b.limitAmount,
          totalSpent,
          percentage,
          message: `You have spent ${percentage.toFixed(1)}% of your category budget!`
        });
      }
    }

    return alerts;
  }
}

export default new BudgetService();