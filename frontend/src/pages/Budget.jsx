// src/pages/Budget.jsx

import { useState, useEffect } from 'react';
import { Plus, X, Target, Edit2 } from 'lucide-react'; // Added Edit2 icon
import budgetService from '../services/budgetService';
import categoryService from '../services/categoryService';
import { formatCurrency } from '../utils/constants';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [currentBudgetId, setCurrentBudgetId] = useState(null);

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', // Added endDate for custom periods
    alertThreshold: 80
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getBudgetOverview();
      setBudgets(response.data.budgets || []);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories('expense');
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Populate form with existing budget data
  const handleEdit = (budgetWrapper) => {
    const { budget } = budgetWrapper; // Extract the inner budget object
    
    setFormData({
      categoryId: budget.categoryId, // Ensure this matches your backend response structure
      amount: budget.amount,
      period: budget.period,
      startDate: new Date(budget.startDate || budgetWrapper.period.start).toISOString().split('T')[0],
      endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : '',
      alertThreshold: budget.alertThreshold
    });
    
    setCurrentBudgetId(budget.id); // Use the inner budget ID
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      // Remove endDate if not using custom period
      if (formData.period !== 'custom') {
        delete payload.endDate;
      }

      if (isEditing) {
        await budgetService.updateBudget(currentBudgetId, payload);
      } else {
        await budgetService.createBudget(payload);
      }

      resetForm();
      fetchBudgets();
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} budget`);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentBudgetId(null);
    setFormData({
      categoryId: '',
      amount: '',
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      alertThreshold: 80
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;

    try {
      await budgetService.deleteBudget(id);
      fetchBudgets();
    } catch (err) {
      alert(err.message || 'Failed to delete budget');
    }
  };

  return (
    <div className="budgets-page">
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
        <button className="button button-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={20} />
          Create Budget
        </button>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : budgets.length > 0 ? (
        <div className="budgets-grid">
          {budgets.map((item) => (
            <div key={item.budget.id} className="budget-card">
              <div className="budget-header">
                <div>
                  <h3 className="budget-category">{item.budget.categoryName}</h3>
                  <p className="budget-period">
                    {/* Display formatted date range from the calculated period */}
                    {new Date(item.period.start).toLocaleDateString()} - {new Date(item.period.end).toLocaleDateString()}
                  </p>
                </div>
                <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="edit-button" 
                    onClick={() => handleEdit(item)}
                    title="Edit Budget"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    className="delete-button" 
                    onClick={() => handleDelete(item.budget.id)}
                    title="Delete Budget"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="budget-amount">
                <span className="budget-label">Budget</span>
                <span className="budget-value">{formatCurrency(item.budget.amount)}</span>
              </div>

              <div className="progress-bar">
                <div 
                  className={`progress-fill ${item.spending.isOverBudget ? 'bg-red' : ''}`} 
                  style={{ width: `${item.spending.percentageUsed}%` }}
                ></div>
              </div>

              <div className="budget-info">
                <span className="budget-spent">{formatCurrency(item.spending.totalSpent)} spent</span>
                <span className="budget-remaining">{formatCurrency(item.spending.remaining)} remaining</span>
              </div>

              <div className="budget-alert">
                Alert at {item.budget.alertThreshold}%
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Target size={64} />
          <h3>No budgets created</h3>
          <p>Create your first budget to track your spending</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Budget' : 'Create Budget'}</h2>
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
                <label>Category</label>
                <select className="input" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required>
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="100000"
                  min="0"
                  className="input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Period</label>
                <select
                  className="input"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              {/* Conditional End Date Input */}
              {formData.period === 'custom' && (
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Alert Threshold (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button button-primary">
                  {isEditing ? 'Update Budget' : 'Create Budget'}
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

export default Budget;