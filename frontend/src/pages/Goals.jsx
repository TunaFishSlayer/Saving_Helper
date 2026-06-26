import React, { useState, useEffect } from 'react';
import { Trophy, Plus, Target, X, Trash2, Loader } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import goalService from '../services/goalService';
import { CHART_COLORS } from '../utils/constants';
import toast from 'react-hot-toast';
import FormattedAmountInput from '../components/FormattedAmountInput';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const Goals = () => {
  const { t, locale } = useLanguage();
  const { currency, formatCurrency } = useCurrency();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);


  const [addFormData, setAddFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: ''
  });

  const [fundsAmount, setFundsAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await goalService.getGoals();
      setGoals(data || []);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      toast.error(t('toastGoalsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const numericTarget = parseFloat(addFormData.targetAmount);
      const dbTarget = currency === 'USD' ? Math.round(numericTarget * 25400) : numericTarget;
      const payload = {
        name: addFormData.name,
        targetAmount: dbTarget,
        deadline: addFormData.deadline || null
      };
      await goalService.createGoal(payload);
      toast.success(t('toastGoalCreatedSuccess'));
      setShowAddModal(false);
      setAddFormData({ name: '', targetAmount: '', deadline: '' });
      fetchGoals();
    } catch (err) {
      const msg = err.message || t('toastGoalCreatedError');
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const enteredAmount = parseFloat(fundsAmount);
      if (isNaN(enteredAmount) || enteredAmount <= 0) {
        throw new Error(locale === 'vi' ? 'Vui lòng nhập số tiền tiết kiệm hợp lệ' : 'Please enter a valid savings amount');
      }
      const dbAmount = currency === 'USD' ? Math.round(enteredAmount * 25400) : enteredAmount;
      await goalService.addFunds(selectedGoal.clientUuid, dbAmount);
      toast.success(
        locale === 'vi'
          ? `Đã nạp thành công ${formatCurrency(dbAmount)} vào ${selectedGoal.name}!`
          : `Successfully added ${formatCurrency(dbAmount)} to ${selectedGoal.name}!`
      );
      setShowFundsModal(false);
      setFundsAmount('');
      setSelectedGoal(null);
      fetchGoals();
    } catch (err) {
      const msg = err.message || (locale === 'vi' ? 'Nạp tiền thất bại' : 'Failed to add funds');
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const triggerDeleteConfirm = (id) => {
    setGoalToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    setDeleting(true);
    try {
      await goalService.deleteGoal(goalToDelete);
      toast.success(t('toastGoalDeletedSuccess'));
      setShowDeleteModal(false);
      setGoalToDelete(null);
      fetchGoals();
    } catch (err) {
      toast.error(err.message || t('toastGoalDeletedError'));
    } finally {
      setDeleting(false);
    }
  };


  const triggerAddFunds = (goal) => {
    setSelectedGoal(goal);
    setShowFundsModal(true);
  };

  const closeAddGoalModal = () => {
    setShowAddModal(false);
    setAddFormData({ name: '', targetAmount: '', deadline: '' });
    setError('');
  };

  const closeFundsModal = () => {
    setShowFundsModal(false);
    setSelectedGoal(null);
    setFundsAmount('');
    setError('');
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  const chartData = goals
    .filter(g => g.currentAmount > 0)
    .map(g => ({
      name: g.name,
      value: g.currentAmount
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          color: '#333'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].name}</p>
          <p style={{ margin: '4px 0 0 0', color: '#3B82F6', fontWeight: 600 }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="goals-page">
      <div className="page-header">
        <h1 className="page-title">
          {t('goalsTitle')}
        </h1>
        <button 
          className="button button-primary" 
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} /> {t('addGoalBtn')}
        </button>
      </div>

      {loading ? (
        <div className="loader-container" style={{ padding: '48px', textAlign: 'center' }}>
          <div className="loader"></div>
          <p>{t('loadingGoals')}</p>
        </div>
      ) : (
        <div className="goals-content-grid">
          {/* Left Column: Grid of Goals */}
          <div className="goals-list-container">
            {goals.length > 0 ? (
              <div className="goals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {goals.map((goal) => {
                  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                  return (
                    <div key={goal.clientUuid} className="goal-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333', fontWeight: 600 }}>{goal.name}</h3>
                        <Target size={20} color="#666" />
                      </div>
                      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#666' }}>
                        <span>{locale === 'vi' ? `${t('savedStatus')} ${formatCurrency(goal.currentAmount)}` : `${formatCurrency(goal.currentAmount)} ${t('savedStatus')}`}</span>
                        <span>{t('goalLabel')}: {formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: progress >= 100 ? '#4CAF50' : '#3B82F6', transition: 'width 0.5s ease' }}></div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#888' }}>
                        {t('deadline')}: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : t('noDeadline')}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button 
                          className="button button-secondary" 
                          onClick={() => triggerAddFunds(goal)}
                          style={{ flex: 1, padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          {t('addFundsBtn')}
                        </button>
                        <button 
                          className="button"
                          onClick={() => triggerDeleteConfirm(goal.clientUuid)}
                          style={{ background: '#fee2e2', color: '#ef4444', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
                          title={t('deleteGoalTooltip')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <Trophy size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3>{t('noGoals')}</h3>
                <p>{t('noGoalsDesc')}</p>
              </div>
            )}
          </div>

          {/* Right Column: Chart Breakdown */}
          <div className="goals-chart-container">
            {/* Total Savings Card */}
            <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>{t('totalSavedTitle')}</h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '2.2rem', fontWeight: 'bold' }}>
                  {formatCurrency(totalSaved)}
                </p>
              </div>
              <Trophy size={40} opacity={0.4} />
            </div>

            {/* Allocation Chart Card */}
            <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h2 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text)' }}>
                {t('portfolioTitle')}
              </h2>
              {chartData.length > 0 ? (
                <div style={{ height: '260px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-light)' }}>
                  <p>{t('noAllocation')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddGoalModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('addGoalModalTitle')}</h2>
              <button className="close-button" onClick={closeAddGoalModal}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddGoal} className="form">
              <div className="form-group">
                <label>{t('goalNameLabel')}</label>
                <input
                  type="text"
                  className="input"
                  placeholder={t('goalNamePlaceholder')}
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('targetAmountLabel')} ({currency})</label>
                <FormattedAmountInput
                  className="input"
                  value={addFormData.targetAmount}
                  onChange={(val) => setAddFormData({ ...addFormData, targetAmount: val })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('targetDeadlineLabel')}</label>
                <input
                  type="date"
                  className="input"
                  value={addFormData.deadline}
                  onChange={(e) => setAddFormData({ ...addFormData, deadline: e.target.value })}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? t('creatingBtn') : t('createGoalBtn')}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeAddGoalModal}
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showFundsModal && selectedGoal && (
        <div className="modal-overlay" onClick={closeFundsModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('addFundsModalTitle')} {selectedGoal.name}</h2>
              <button className="close-button" onClick={closeFundsModal}>
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddFunds} className="form">
              <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#666' }}>
                {t('currentlySavedLabel')}: <strong>{formatCurrency(selectedGoal.currentAmount)}</strong> {t('of')} <strong>{formatCurrency(selectedGoal.targetAmount)}</strong>
              </div>

              <div className="form-group">
                <label>{t('amountToAddLabel')} ({currency})</label>
                <FormattedAmountInput
                  className="input"
                  value={fundsAmount}
                  onChange={setFundsAmount}
                  required
                  autoFocus
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? t('addingFundsBtn') : t('addFundsBtn')}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closeFundsModal}
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
        <div className="modal-overlay" onClick={() => { setShowDeleteModal(false); setGoalToDelete(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('confirmDeleteTitle')}</h2>
              <button className="close-button" onClick={() => { setShowDeleteModal(false); setGoalToDelete(null); }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'left' }}>
              {t('confirmDeleteGoalText')}
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => { setShowDeleteModal(false); setGoalToDelete(null); }}
                disabled={deleting}
              >
                {t('keepBtn')}
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={handleDeleteGoal}
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

export default Goals;
