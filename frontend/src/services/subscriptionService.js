// src/services/subscriptionService.js

import api from './api';
import { localDb, generateUUID } from './localDb';
import syncService from './syncService';

class SubscriptionService {
  isOfflineMode() {
    return localStorage.getItem('auth_mode') === 'offline';
  }

  async getSubscriptions() {
    return await localDb.subscriptions.toArray();
  }

  async createSubscription(subscriptionData) {
    const id = generateUUID();
    const newSub = {
      ...subscriptionData,
      id,
      clientUuid: id,
      isActive: true,
      amount: Number(subscriptionData.amount)
    };

    await localDb.subscriptions.put(newSub);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'create',
        entityType: 'subscription',
        clientUuid: id,
        payload: newSub,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return newSub;
  }

  async deleteSubscription(id) {
    await localDb.subscriptions.delete(id);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'delete',
        entityType: 'subscription',
        clientUuid: id,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return { message: 'Subscription deleted' };
  }

  async toggleSubscription(id, isActive) {
    const existing = await localDb.subscriptions.get(id);
    if (!existing) throw new Error('Subscription not found locally');

    const updatedSub = {
      ...existing,
      isActive
    };

    await localDb.subscriptions.put(updatedSub);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'update',
        entityType: 'subscription',
        clientUuid: id,
        payload: updatedSub,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return updatedSub;
  }
}

export default new SubscriptionService();
