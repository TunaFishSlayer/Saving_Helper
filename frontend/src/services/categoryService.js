// src/services/categoryService.js

import api from './api';
import { localDb, generateUUID } from './localDb';
import syncService from './syncService';

class CategoryService {
  isOfflineMode() {
    return localStorage.getItem('auth_mode') === 'offline';
  }

  async getCategories(type = null) {
    let cats = await localDb.categories.toArray();
    if (type) {
      cats = cats.filter(c => c.type === type);
    }
    return cats;
  }

  async createCategory(categoryData) {
    const id = generateUUID();
    const newCat = {
      ...categoryData,
      id,
      clientUuid: id
    };

    await localDb.categories.put(newCat);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'create',
        entityType: 'category',
        clientUuid: id,
        payload: newCat,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return newCat;
  }

  async deleteCategory(id) {
    await localDb.categories.delete(id);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'delete',
        entityType: 'category',
        clientUuid: id,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return { message: 'Category deleted' };
  }

  async updateCategory(id, categoryData) {
    const existing = await localDb.categories.get(id);
    if (!existing) throw new Error('Category not found locally');

    const updatedCat = {
      ...existing,
      ...categoryData
    };

    await localDb.categories.put(updatedCat);

    if (!this.isOfflineMode()) {
      await localDb.syncQueue.add({
        action: 'update',
        entityType: 'category',
        clientUuid: id,
        payload: updatedCat,
        timestamp: new Date().toISOString()
      });
      syncService.sync(localStorage.getItem('token')).catch(err => console.error(err));
    }

    return updatedCat;
  }
}

export default new CategoryService();