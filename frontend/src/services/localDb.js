import Dexie from 'dexie';

export const localDb = new Dexie('SavingsHelperLocalDB');

// Define the database tables and key indexes
// clientUuid is the primary key to allow offline item creation.
localDb.version(1).stores({
  categories: 'clientUuid, id, name, userId',
  transactions: 'clientUuid, id, amount, type, categoryId, date, userId, synced',
  budgets: 'clientUuid, id, limitAmount, period, categoryId, userId',
  goals: 'clientUuid, id, name, targetAmount, currentAmount, userId',
  syncQueue: '++id, action, entityType, clientUuid, timestamp'
});

localDb.version(2).stores({
  subscriptions: 'clientUuid, id, name, amount, billingCycle, nextBillingDate, userId'
});

// Helper to generate v4 UUIDs client-side without external dependencies
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
