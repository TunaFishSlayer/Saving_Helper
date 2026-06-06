// src/services/transactionService.js

import api from './api';
import { localDb, generateUUID } from './localDb';
import syncService from './syncService';

class TransactionService {
  isOfflineMode() {
    return localStorage.getItem('auth_mode') === 'offline';
  }

  async getTransactions(params = {}) {
    // Read from IndexedDB
    let txs = await localDb.transactions.toArray();
    
    // Sort transactions by date descending
    txs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by type if requested
    if (params.type) {
      txs = txs.filter(t => t.type === params.type);
    }
    // Filter by categoryId if requested
    if (params.categoryId) {
      txs = txs.filter(t => t.categoryId === params.categoryId);
    }

    return { data: txs };
  }

  async getTransactionById(id) {
    return await localDb.transactions.get(id);
  }

  async createTransaction(transactionData) {
    const id = generateUUID();
    const newTx = {
      ...transactionData,
      id,
      clientUuid: id,
      synced: false
    };

    // Save to local IndexedDB
    await localDb.transactions.put(newTx);

    // If not guest, queue mutation and trigger sync
    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'create',
        entityType: 'transaction',
        clientUuid: id,
        payload: newTx,
        timestamp: new Date().toISOString()
      });
      // Fire-and-forget background sync
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return newTx;
  }

  async updateTransaction(id, transactionData) {
    const existing = await localDb.transactions.get(id);
    if (!existing) throw new Error('Transaction not found locally');

    const updatedTx = {
      ...existing,
      ...transactionData,
      synced: false
    };

    await localDb.transactions.put(updatedTx);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'update',
        entityType: 'transaction',
        clientUuid: id,
        payload: updatedTx,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return updatedTx;
  }

  async deleteTransaction(id) {
    await localDb.transactions.delete(id);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'delete',
        entityType: 'transaction',
        clientUuid: id,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return { message: 'Transaction deleted' };
  }

  async getTotalByType(type) {
    const txs = await localDb.transactions.toArray();
    const filtered = txs.filter(t => t.type === type);
    const total = filtered.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { total };
  }

  async getMonthlySummary(year, month) {
    const txs = await localDb.transactions.toArray();
    const monthlyTxs = txs.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
    });

    const income = monthlyTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expense = monthlyTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return { income, expense };
  }

  async getExpenseByCategory() {
    const txs = await localDb.transactions.toArray();
    const expenses = txs.filter(t => t.type === 'expense');
    
    // Group
    const groups = {};
    for (const exp of expenses) {
      const catId = exp.categoryId || 'unknown';
      groups[catId] = (groups[catId] || 0) + Number(exp.amount || 0);
    }

    // Load categories to map names
    const cats = await localDb.categories.toArray();
    const catMap = {};
    cats.forEach(c => { catMap[c.id] = c.name; });

    return Object.entries(groups).map(([catId, amount]) => ({
      categoryId: catId,
      categoryName: catMap[catId] || 'Unknown',
      amount
    }));
  }

  async scanReceipt(file) {
    const formData = new FormData();
    formData.append('receipt', file);
    return await api.post('/transactions/scan-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async exportTransactions(params = {}) {
    // Export still hits the server for generation
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/transactions/export?${queryString}` : '/transactions/export';
    return await api.get(endpoint, { isBlob: true });
  }
}

export default new TransactionService();