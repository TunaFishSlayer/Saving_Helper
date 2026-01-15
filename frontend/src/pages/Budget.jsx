// src/pages/Budget.jsx

import { useState, useEffect } from 'react';
import { Plus, X, Target } from 'lucide-react';
import budgetService from '../services/budgetService';
import categoryService from '../services/categoryService';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
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
      const data = await budgetService.getBudgets();
      setBudgets(data.data || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await budgetService.createBudget({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowModal(false);
      setFormData({
        categoryId: '',
        amount: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        alertThreshold: 80
      });
      fetchBudgets();
    } catch (err) {
      setError(err.message || 'Failed to create budget');
    }
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
        <button className="button button-primary" onClick={() => setShowModal(true)}>
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
          {budgets.map((budget) => (
            <div key={budget._id} className="budget-card">
              <div className="budget-header">
                <div>
                  <h3 className="budget-category">{budget.categoryId?.name}</h3>
                  <p className="budget-period">{budget.period}</p>
                </div>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(budget._id)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="budget-amount">
                <span className="budget-label">Budget</span>
                <span className="budget-value">${budget.amount.toFixed(2)}</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: '0%' }}
                ></div>
              </div>

              <div className="budget-info">
                <span className="budget-spent">$0.00 spent</span>
                <span className="budget-remaining">${budget.amount.toFixed(2)} remaining</span>
              </div>

              <div className="budget-alert">
                Alert at {budget.alertThreshold}%
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

      {/* Create Budget Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Budget</h2>
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
                <label>Category</label>
                <select
                  className="input"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
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
                  step="0.01"
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
                  Create Budget
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

export default Budget;