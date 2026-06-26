import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Plus, X, Target, Edit2 } from 'lucide-react';
import budgetService from '../services/budgetService';
import categoryService from '../services/categoryService';
import FormattedAmountInput from '../components/FormattedAmountInput';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const Budget = () => {
  const { t } = useLanguage();
  const { currency, formatCurrency } = useCurrency();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [currentBudgetId, setCurrentBudgetId] = useState(null);

  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


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
    const displayAmount = currency === 'USD' ? Math.round((budget.amount / 25400) * 100) / 100 : budget.amount;
    
    setFormData({
      categoryId: budget.categoryId, // Ensure this matches your backend response structure
      amount: displayAmount.toString(),
      period: budget.period,
      startDate: new Date(budget.startDate || budgetWrapper.period.start).toISOString().split('T')[0],
      endDate: budget.endDate ? new Date(budget.endDate).toISOString().split('T')[0] : '',
      alertThreshold: budget.alertThreshold
    });
    
    setCurrentBudgetId(budget.clientUuid); // Use the inner budget clientUuid
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const numericAmount = parseFloat(formData.amount);
      const dbAmount = currency === 'USD' ? Math.round(numericAmount * 25400) : numericAmount;
      const payload = {
        ...formData,
        amount: dbAmount
      };

      // Remove endDate if not using custom period
      if (formData.period !== 'custom') {
        delete payload.endDate;
      }

      if (isEditing) {
        await budgetService.updateBudget(currentBudgetId, payload);
        toast.success('Budget updated successfully!');
      } else {
        await budgetService.createBudget(payload);
        toast.success('Budget created successfully!');
      }

      resetForm();
      fetchBudgets();
    } catch (err) {
      const msg = err.message || `Failed to ${isEditing ? 'update' : 'create'} budget`;
      setError(msg);
      toast.error(msg);
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

  const triggerDeleteConfirm = (id) => {
    setBudgetToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;
    setDeleting(true);
    try {
      await budgetService.deleteBudget(budgetToDelete);
      toast.success('Budget deleted successfully!');
      setShowDeleteModal(false);
      setBudgetToDelete(null);
      fetchBudgets();
    } catch (err) {
      const error = err.message || 'Failed to delete budget';
      setError(error);
      toast.error(error);
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="budgets-page">
      <div className="page-header">
        <h1 className="page-title">{t('budgetsTitle')}</h1>
        <button className="button button-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={20} />
          {t('createBudgetBtn')}
        </button>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : budgets.length > 0 ? (
        <div className="budgets-grid">
          {budgets.map((item) => (
            <div key={item.budget.clientUuid} className="budget-card">
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
                    onClick={() => triggerDeleteConfirm(item.budget.clientUuid)}
                    title="Delete Budget"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="budget-amount">
                <span className="budget-label">{t('budgetLabel')}</span>
                <span className="budget-value">{formatCurrency(item.budget.amount)}</span>
              </div>

              <div className="progress-bar">
                <div 
                  className={`progress-fill ${item.spending.isOverBudget ? 'bg-red' : ''}`} 
                  style={{ width: `${item.spending.percentageUsed}%` }}
                ></div>
              </div>

              <div className="budget-info">
                <span className="budget-spent">{formatCurrency(item.spending.totalSpent)} {t('spentLabel')}</span>
                <span className="budget-remaining">{formatCurrency(item.spending.remaining)} {t('remainingLabel')}</span>
              </div>

              <div className="budget-alert">
                {t('alertAtLabel')} {item.budget.alertThreshold}%
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Target size={64} />
          <h3>{t('noBudgets')}</h3>
          <p>{t('noBudgetsDesc')}</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? t('editBudgetModalTitle') : t('addBudgetModalTitle')}</h2>
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
                <label>{t('budgetCategoryLabel')}</label>
                <select className="input" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required>
                  <option value="">{t('formSelectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.clientUuid} value={cat.clientUuid}>
                      {cat.name}
                    </option>
                  ))}

                </select>
              </div>

              <div className="form-group">
                <label>{t('budgetAmountLabel')} ({currency})</label>
                <FormattedAmountInput
                  className="input"
                  value={formData.amount}
                  onChange={(val) => setFormData({ ...formData, amount: val })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('budgetPeriodLabel')}</label>
                <select
                  className="input"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                >
                  <option value="monthly">{t('periodMonthly')}</option>
                  <option value="yearly">{t('periodYearly')}</option>
                  <option value="weekly">{t('periodWeekly')}</option>
                  <option value="custom">{t('periodCustom')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('budgetStartDateLabel')}</label>
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
                  <label>{t('budgetEndDateLabel')}</label>
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
                <label>{t('budgetAlertThresholdLabel')}</label>
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
                  {isEditing ? t('updateBudgetBtn') : t('createBudgetBtn')}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={resetForm}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setBudgetToDelete(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('confirmDeleteTitle')}</h2>
              <button className="close-button" onClick={() => { setShowDeleteModal(false); setBudgetToDelete(null); }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'left' }}>
              {t('confirmDeleteBudgetText')}
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => { setShowDeleteModal(false); setBudgetToDelete(null); }}
                disabled={deleting}
              >
                {t('keepBtn')}
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? t('loading') : t('deleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;