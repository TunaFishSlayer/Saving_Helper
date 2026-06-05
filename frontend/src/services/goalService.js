// src/services/goalService.js

import api from './api';

class GoalService {
  async getGoals() {
    return await api.get('/goals');
  }

  async createGoal(goalData) {
    return await api.post('/goals', goalData);
  }

  async addFunds(id, amount) {
    return await api.put(`/goals/${id}/add-funds`, { amount });
  }

  async deleteGoal(id) {
    return await api.delete(`/goals/${id}`);
  }
}

export default new GoalService();
