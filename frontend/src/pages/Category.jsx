// src/pages/Category.jsx

import { useState, useEffect } from 'react';
import { Plus, X, FolderOpen } from 'lucide-react';
import categoryService from '../services/categoryService';
import { CATEGORY_TYPES } from '../utils/constants';

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(''); // '', 'income', 'expense'

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await categoryService.createCategory(formData);
      setShowModal(false);
      setFormData({ name: '', type: 'expense', description: '' });
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryService.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const filteredCategories = filter
    ? categories.filter(cat => cat.type === filter)
    : categories;

  const incomeCategories = categories.filter(cat => cat.type === CATEGORY_TYPES.INCOME);
  const expenseCategories = categories.filter(cat => cat.type === CATEGORY_TYPES.EXPENSE);

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <button className="button button-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          All ({categories.length})
        </button>
        <button
          className={`filter-tab ${filter === 'income' ? 'active' : ''}`}
          onClick={() => setFilter('income')}
        >
          Income ({incomeCategories.length})
        </button>
        <button
          className={`filter-tab ${filter === 'expense' ? 'active' : ''}`}
          onClick={() => setFilter('expense')}
        >
          Expense ({expenseCategories.length})
        </button>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="categories-grid">
          {filteredCategories.map((category) => (
            <div key={category._id} className="category-card">
              <div className="category-header">
                <div className="category-icon">
                  <FolderOpen size={24} />
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(category._id)}
                >
                  <X size={20} />
                </button>
              </div>
              <h3 className="category-name">{category.name}</h3>
              <span className={`category-badge category-${category.type}`}>
                {category.type}
              </span>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCategories.length === 0 && (
        <div className="empty-state">
          <FolderOpen size={64} />
          <h3>No categories found</h3>
          <p>Create your first category to get started</p>
        </div>
      )}

      {/* Add Category Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Category</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button button-primary">
                  Create Category
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;