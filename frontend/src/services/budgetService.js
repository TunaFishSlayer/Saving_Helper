// src/services/budgetService.js

import api from './api';

class BudgetService {
  async getBudgets(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/budgets?${queryString}` : '/budgets';
    
    return await api.get(endpoint);
  }

  async getBudgetById(id) {
    return await api.get(`/budgets/${id}`);
  }

  async createBudget(budgetData) {
    return await api.post('/budgets', budgetData);
  }

  async updateBudget(id, budgetData) {
    return await api.put(`/budgets/${id}`, budgetData);
  }

  async deleteBudget(id) {
    return await api.delete(`/budgets/${id}`);
  }

  async deactivateBudget(id) {
    return await api.patch(`/budgets/${id}/deactivate`, {});
  }

  async getBudgetStatus(id) {
    return await api.get(`/budgets/${id}/status`);
  }

  async getBudgetOverview(period = null) {
    const endpoint = period ? `/budgets/overview?period=${period}` : '/budgets/overview';
    return await api.get(endpoint);
  }

  async getBudgetAlerts() {
    return await api.get('/budgets/alerts');
  }
}

export default new BudgetService();