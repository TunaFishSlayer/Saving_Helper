// src/services/subscriptionService.js

import api from './api';

class SubscriptionService {
  async getSubscriptions() {
    return await api.get('/subscriptions');
  }

  async createSubscription(subscriptionData) {
    return await api.post('/subscriptions', subscriptionData);
  }

  async deleteSubscription(id) {
    return await api.delete(`/subscriptions/${id}`);
  }

  async toggleSubscription(id, isActive) {
    return await api.put(`/subscriptions/${id}/toggle`, { isActive });
  }
}

export default new SubscriptionService();
