// src/services/categoryService.js

import api from './api';

class CategoryService {
  async getCategories(type = null) {
    const endpoint = type ? `/categories?type=${type}` : '/categories';
    return await api.get(endpoint);
  }

  async createCategory(categoryData) {
    return await api.post('/categories', categoryData);
  }

  async deleteCategory(id) {
    return await api.delete(`/categories/${id}`);
  }
  async updateCategory(id, categoryData) {
    return await api.put(`/categories/${id}`, categoryData);
  }
}
export default new CategoryService();