// src/services/goalService.js

import api from './api';
import { localDb, generateUUID } from './localDb';
import syncService from './syncService';

class GoalService {
  isOfflineMode() {
    return localStorage.getItem('auth_mode') === 'offline';
  }

  async getGoals() {
    return await localDb.goals.toArray();
  }

  async createGoal(goalData) {
    const id = generateUUID();
    const newGoal = {
      ...goalData,
      id,
      clientUuid: id,
      currentAmount: Number(goalData.currentAmount || 0)
    };

    await localDb.goals.put(newGoal);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'create',
        entityType: 'goal',
        clientUuid: id,
        payload: newGoal,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return newGoal;
  }

  async addFunds(id, amount) {
    const existing = await localDb.goals.get(id);
    if (!existing) throw new Error('Goal not found locally');

    const updatedGoal = {
      ...existing,
      currentAmount: Number(existing.currentAmount || 0) + Number(amount)
    };

    await localDb.goals.put(updatedGoal);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'update',
        entityType: 'goal',
        clientUuid: id,
        payload: updatedGoal,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return updatedGoal;
  }

  async deleteGoal(id) {
    await localDb.goals.delete(id);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'delete',
        entityType: 'goal',
        clientUuid: id,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return { message: 'Goal deleted' };
  }
}

export default new GoalService();
