// src/pages/Transaction.jsx

import { useState, useEffect } from 'react';
import { Plus, X, Filter, DollarSign, Edit2 } from 'lucide-react'; // Added Edit2
import transactionService from '../services/transactionService';
import categoryService from '../services/categoryService';
import { formatCurrency } from '../utils/constants';

const Transaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);

  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    startDate: '',
    endDate: ''
  });
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getTransactions(filters);
      setTransactions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      type: 'expense',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setCurrentTransactionId(null);
    setShowModal(false);
    setError('');
  };

  const handleEdit = (transaction) => {
    setFormData({
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId,
      description: transaction.description || '',
      // Ensure date is formatted for input type="date"
      date: new Date(transaction.date).toISOString().split('T')[0]
    });
    setCurrentTransactionId(transaction._id);
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

      if (isEditing) {
        await transactionService.updateTransaction(currentTransactionId, payload);
      } else {
        await transactionService.createTransaction(payload);
      }
      
      resetForm();
      fetchTransactions();
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} transaction`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;

    try {
      await transactionService.deleteTransaction(id);
      fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category?.name || 'Unknown';
  };

  const availableCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <div className="header-actions">
          <button
            className="button button-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            Filters
          </button>
          <button 
            className="button button-primary" 
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card filters-card">
          <div className="filters-grid">
            <div className="form-group">
              <label>Type</label>
              <select
                className="input"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                className="input"
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                className="input"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                className="input"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="card">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.description || '-'}</td>
                    <td>{getCategoryName(transaction.categoryId)}</td>
                    <td>
                      <span className={`badge badge-${transaction.type}`}>
                        {transaction.type.toUpperCase()}
                      </span>
                    </td>
                    <td className={`amount-${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="icon-button edit"
                          onClick={() => handleEdit(transaction)}
                          title="Edit Transaction"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => handleDelete(transaction._id)}
                          title="Delete Transaction"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <DollarSign size={64} />
            <h3>No transactions found</h3>
            <p>Add your first transaction to get started</p>
          </div>
        )}
      </div>

      {/* Add/Edit Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
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
                <label>Type</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, categoryId: '' })}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  className="input"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {availableCategories.map((cat) => (
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
                  step="1000"
                  min="0"
                  className="input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button button-primary">
                  {isEditing ? 'Update Transaction' : 'Add Transaction'}
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

export default Transaction;