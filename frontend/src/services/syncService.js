import Dexie from 'dexie';
import { localDb } from './localDb';
import api from './api';

class SyncService {
  // Checks if there are any unsynced changes in the queue
  async hasUnsyncedChanges() {
    const count = await localDb.syncQueue.count();
    return count > 0;
  }

  // Push local modifications to the cloud backend and pull changes
  async sync(token) {
    if (!token) return;

    try {
      const queue = await localDb.syncQueue.toArray();
      if (queue.length === 0) {
        // No local changes, pull latest from cloud instead
        await this.pullLatestData();
        return;
      }

      // Group changes to send as a batch
      const mutations = queue.map(q => ({
        id: q.id,
        action: q.action,
        entityType: q.entityType,
        clientUuid: q.clientUuid,
        timestamp: q.timestamp,
        payload: q.payload
      }));

      // Send mutations batch to backend
      const response = await api.post('/sync', { mutations });

      // Clear successfully processed items from the syncQueue
      const processedIds = response.processedIds || [];
      if (processedIds.length > 0) {
        await localDb.syncQueue.bulkDelete(processedIds);
      }

      // Import database entries returned by server (server wins or pulls updates)
      await this.applyServerUpdates(response.updates);

    } catch (error) {
      console.error('Synchronization failed:', error);
      throw error;
    }
  }

  // Pull all tables from cloud to populate local SQLite cache
  async pullLatestData() {
    try {
      const response = await api.get('/sync/pull');
      await this.applyServerUpdates(response.updates);
    } catch (e) {
      console.error('Failed to pull updates from server:', e);
    }
  }

  async applyServerUpdates(updates) {
    if (!updates) return;

    await localDb.transaction('rw', [localDb.categories, localDb.transactions, localDb.budgets, localDb.goals, localDb.subscriptions], async () => {
      // 1. Sync Categories
      if (updates.categories) {
        for (const cat of updates.categories) {
          await localDb.categories.put(cat);
        }
      }
      // 2. Sync Transactions
      if (updates.transactions) {
        for (const tx of updates.transactions) {
          await localDb.transactions.put(tx);
        }
      }
      // 3. Sync Budgets
      if (updates.budgets) {
        for (const b of updates.budgets) {
          await localDb.budgets.put(b);
        }
      }
      // 4. Sync Goals
      if (updates.goals) {
        for (const g of updates.goals) {
          await localDb.goals.put(g);
        }
      }
      // 5. Sync Subscriptions
      if (updates.subscriptions) {
        for (const sub of updates.subscriptions) {
          await localDb.subscriptions.put(sub);
        }
      }
    });
  }

  // Push local guest records to the server on login (Merge)
  async mergeGuestDataToServer() {
    try {
      const categories = await localDb.categories.toArray();
      const transactions = await localDb.transactions.toArray();
      const budgets = await localDb.budgets.toArray();
      const goals = await localDb.goals.toArray();
      const subscriptions = await localDb.subscriptions.toArray();

      // Send everything as create mutations
      const mutations = [];
      
      categories.forEach(c => mutations.push({ action: 'create', entityType: 'category', clientUuid: c.clientUuid, payload: c }));
      transactions.forEach(t => mutations.push({ action: 'create', entityType: 'transaction', clientUuid: t.clientUuid, payload: t }));
      budgets.forEach(b => mutations.push({ action: 'create', entityType: 'budget', clientUuid: b.clientUuid, payload: b }));
      goals.forEach(g => mutations.push({ action: 'create', entityType: 'goal', clientUuid: g.clientUuid, payload: g }));
      subscriptions.forEach(s => mutations.push({ action: 'create', entityType: 'subscription', clientUuid: s.clientUuid, payload: s }));

      if (mutations.length > 0) {
        await api.post('/sync', { mutations });
      }

      // Clear sync queue and local db tables to download clean synced records
      await this.clearLocalDatabase();
      await this.pullLatestData();

    } catch (error) {
      console.error('Failed to merge local data to server:', error);
      throw error;
    }
  }

  async clearLocalDatabase() {
    await Promise.all([
      localDb.categories.clear(),
      localDb.transactions.clear(),
      localDb.budgets.clear(),
      localDb.goals.clear(),
      localDb.subscriptions.clear(),
      localDb.syncQueue.clear(),
      localDb.appMeta.clear()
    ]);
  }
}

export default new SyncService();
