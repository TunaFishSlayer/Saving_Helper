// src/services/transactionService.js

import api from './api';

class TransactionService {
  async getTransactions(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';
    
    return await api.get(endpoint);
  }

  async getTransactionById(id) {
    return await api.get(`/transactions/${id}`);
  }

  async createTransaction(transactionData) {
    return await api.post('/transactions', transactionData);
  }

  async updateTransaction(id, transactionData) {
    return await api.put(`/transactions/${id}`, transactionData);
  }

  async deleteTransaction(id) {
    return await api.delete(`/transactions/${id}`);
  }

  async getTotalByType(type) {
    return await api.get(`/transactions/summary/total?type=${type}`);
  }

  async getMonthlySummary(year, month) {
    return await api.get(`/transactions/summary/monthly?year=${year}&month=${month}`);
  }

  async getExpenseByCategory() {
    return await api.get('/transactions/summary/category');
  }

  async scanReceipt(file) {
    const formData = new FormData();
    // Field 'receipt' aligns with Express backend upload.single('receipt')
    formData.append('receipt', file);
    return await api.post('/transactions/scan-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async exportTransactions(params = {}) {
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