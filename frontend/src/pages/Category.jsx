// src/pages/Category.jsx
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Plus, X, FolderOpen, Edit2 } from 'lucide-react'; 
import categoryService from '../services/categoryService';
import { CATEGORY_TYPES } from '../utils/constants';
  
const Category = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);

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

  const resetForm = () => {
    setFormData({ name: '', type: 'expense', description: '' });
    setIsEditing(false);
    setCurrentCategoryId(null);
    setShowModal(false);
    setError('');
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || ''
    });
    setCurrentCategoryId(category._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isEditing) {
        await categoryService.updateCategory(currentCategoryId, formData);
        toast.success('Category updated successfully!');
      } else {
        await categoryService.createCategory(formData);
        toast.success('Category created successfully!');
      }
      
      resetForm();
      fetchCategories();
    } catch (err) {
      const msg = err.message || `Failed to ${isEditing ? 'update' : 'create'} category`;
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryService.deleteCategory(id);
      toast.success('Category deleted successfully!');
      fetchCategories();
    } catch (err) {
      const error = err.message || 'Failed to delete category';
      setError(error);
      toast.error(error);
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
        <button 
          className="button button-primary" 
          onClick={() => { resetForm(); setShowModal(true); }}
        >
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
                <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(category)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                    title="Edit Category"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(category._id)}
                    title="Delete Category"
                  >
                    <X size={20} />
                  </button>
                </div>
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

      {/* Add/Edit Category Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Category' : 'Add Category'}</h2>
              <button className="close-button" onClick={resetForm}>
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
                  {isEditing ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={resetForm}
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