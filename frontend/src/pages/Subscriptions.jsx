import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, RefreshCw, X, Loader } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import subscriptionService from '../services/subscriptionService';
import categoryService from '../services/categoryService';
import { CHART_COLORS } from '../utils/constants';
import toast from 'react-hot-toast';
import FormattedAmountInput from '../components/FormattedAmountInput';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const Subscriptions = () => {
  const { t } = useLanguage();
  const { currency, formatCurrency } = useCurrency();
  const [subscriptions, setSubscriptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [subToCancel, setSubToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    nextBillingDate: new Date().toISOString().split('T')[0],
    categoryId: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptions();
    fetchCategories();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getSubscriptions();
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories('expense');
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const triggerCancelConfirm = (id) => {
    setSubToCancel(id);
    setShowConfirmModal(true);
  };

  const handleCancel = async () => {
    if (!subToCancel) return;
    setCancelling(true);
    try {
      await subscriptionService.deleteSubscription(subToCancel);
      toast.success('Subscription cancelled successfully');
      setShowConfirmModal(false);
      setSubToCancel(null);
      fetchSubscriptions();
    } catch (err) {
      const msg = err.message || 'Failed to cancel subscription';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const numericAmount = parseFloat(formData.amount);
      const dbAmount = currency === 'USD' ? Math.round(numericAmount * 25400) : numericAmount;
      const payload = {
        ...formData,
        amount: dbAmount
      };

      await subscriptionService.createSubscription(payload);
      toast.success('Subscription added successfully!');
      resetForm();
      fetchSubscriptions();
    } catch (err) {
      const msg = err.message || 'Failed to add subscription';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      billingCycle: 'monthly',
      nextBillingDate: new Date().toISOString().split('T')[0],
      categoryId: ''
    });
    setShowModal(false);
    setError('');
  };

  const totalMonthlyCost = subscriptions.reduce((total, sub) => {
    if (sub.isActive === false) return total;
    let monthlyVal = sub.amount;
    if (sub.billingCycle === 'weekly') {
      monthlyVal = sub.amount * 4.33;
    } else if (sub.billingCycle === 'yearly') {
      monthlyVal = sub.amount / 12;
    }
    return total + monthlyVal;
  }, 0);

  const chartData = subscriptions
    .filter(sub => sub.isActive !== false)
    .map(sub => {
      let monthlyVal = sub.amount;
      if (sub.billingCycle === 'weekly') {
        monthlyVal = sub.amount * 4.33;
      } else if (sub.billingCycle === 'yearly') {
        monthlyVal = sub.amount / 12;
      }
      return {
        name: sub.name,
        value: Math.round(monthlyVal)
      };
    });

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
          <p style={{ margin: '4px 0 0 0', color: '#E91E63', fontWeight: 600 }}>
            {formatCurrency(payload[0].value)}/mo
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="subscriptions-page">
      <div className="page-header">
        <h1 className="page-title">
          {t('subscriptionsTitle')}
        </h1>
        <button 
          className="button button-primary" 
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} /> {t('addSubscriptionBtn')}
        </button>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9 }}>{t('totalMonthlyCost')}</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '2.5rem', fontWeight: 'bold' }}>
            {formatCurrency(totalMonthlyCost)}
          </p>
        </div>
        <RefreshCw size={48} opacity={0.5} />
      </div>

      <div className="subscriptions-content-grid">
        <div className="subscriptions-list-container">
          <div className="subscriptions-list" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {loading ? (
              <div className="loader-container">
                <div className="loader"></div>
                <p>{t('loadingSubscriptions')}</p>
              </div>
            ) : subscriptions.length > 0 ? (
              <>
                <div className="table-container desktop-only">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                         <th style={{ padding: '16px' }}>{t('colServiceName')}</th>
                        <th style={{ padding: '16px' }}>{t('colCategory')}</th>
                        <th style={{ padding: '16px' }}>{t('colAmount')}</th>
                        <th style={{ padding: '16px' }}>{t('colBillingCycle')}</th>
                        <th style={{ padding: '16px' }}>{t('colNextBilling')}</th>
                        <th style={{ padding: '16px' }}>{t('colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((sub) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '16px', fontWeight: '500' }}>{sub.name}</td>
                           <td style={{ padding: '16px' }}>{sub.category?.name || t('uncategorized')}</td>
                          <td style={{ padding: '16px', color: '#E91E63', fontWeight: '600' }}>{formatCurrency(sub.amount)}</td>
                          <td style={{ padding: '16px', textTransform: 'capitalize' }}>
                            <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                              {sub.billingCycle}
                            </span>
                          </td>
                          <td style={{ padding: '16px', color: '#666' }}>{(() => {
                            const d = new Date(sub.nextBillingDate);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${year}`;
                          })()}</td>
                          <td style={{ padding: '16px' }}>
                            <button 
                              onClick={() => triggerCancelConfirm(sub.id)}
                              style={{ color: '#f44336', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                            >
                               {t('cancelBtn')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-subscriptions-feed mobile-only">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="mobile-subscription-card">
                      <div className="card-top">
                        <span className="card-service-name">{sub.name}</span>
                        <span className="card-amount">{formatCurrency(sub.amount)}</span>
                      </div>
                      <div className="card-middle">
                        <span className="card-category">{sub.category?.name || t('uncategorized')}</span>
                        <span className="card-billing-cycle">{sub.billingCycle}</span>
                      </div>
                      <div className="card-bottom">
                        <span className="card-next-billing">
                          {t('colNextBilling')}: {(() => {
                            const d = new Date(sub.nextBillingDate);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = String(d.getFullYear()).slice(-2);
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                        <button 
                          className="card-action-btn cancel"
                          onClick={() => triggerCancelConfirm(sub.id)}
                        >
                          {t('cancelBtn')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                <CalendarClock size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3>{t('noSubscriptions')}</h3>
                <p>{t('noSubscriptionsDesc')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="subscriptions-chart-container">
          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h2 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t('costBreakdown')}
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
                <p>{t('noBreakdown')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Subscription Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('addSubModalTitle')}</h2>
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
                <label>{t('serviceNameLabel')}</label>
                <input
                  type="text"
                  className="input"
                  placeholder={t('serviceNamePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('subCategoryLabel')}</label>
                <select 
                  className="input" 
                  value={formData.categoryId} 
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} 
                  required
                >
                  <option value="">{t('formSelectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('subAmountLabel')} ({currency})</label>
                <FormattedAmountInput
                  className="input"
                  value={formData.amount}
                  onChange={(val) => setFormData({ ...formData, amount: val })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('billingCycleLabel')}</label>
                <select
                  className="input"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  required
                >
                  <option value="weekly">{t('cycleWeekly')}</option>
                  <option value="monthly">{t('cycleMonthly')}</option>
                  <option value="yearly">{t('cycleYearly')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('nextBillingDateLabel')}</label>
                <input
                  type="date"
                  className="input"
                  value={formData.nextBillingDate}
                  onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                  required
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? t('addingBtn') : t('addSubscriptionBtn')}
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
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setSubToCancel(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('cancelSubModalTitle')}</h2>
              <button className="close-button" onClick={() => { setShowConfirmModal(false); setSubToCancel(null); }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'left' }}>
              {t('cancelSubConfirmText')}
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => { setShowConfirmModal(false); setSubToCancel(null); }}
                disabled={cancelling}
              >
                {t('keepSubscription')}
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? t('cancelling') : t('confirmCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
