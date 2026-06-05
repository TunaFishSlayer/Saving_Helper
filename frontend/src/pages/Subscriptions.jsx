import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, RefreshCw, X, Loader } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import subscriptionService from '../services/subscriptionService';
import categoryService from '../services/categoryService';
import { CHART_COLORS, formatCurrency } from '../utils/constants';
import toast from 'react-hot-toast';
import FormattedAmountInput from '../components/FormattedAmountInput';

const Subscriptions = () => {
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
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
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
    <div className="subscriptions-page" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarClock size={28} color="#E91E63" /> Subscriptions Tracker
        </h1>
        <button 
          className="button button-primary" 
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={20} /> Add Subscription
        </button>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px', borderRadius: '12px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9 }}>Total Fixed Monthly Cost</h2>
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
                <p>Loading subscriptions...</p>
              </div>
            ) : subscriptions.length > 0 ? (
              <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '16px' }}>Service Name</th>
                      <th style={{ padding: '16px' }}>Category</th>
                      <th style={{ padding: '16px' }}>Amount</th>
                      <th style={{ padding: '16px' }}>Billing Cycle</th>
                      <th style={{ padding: '16px' }}>Next Billing Date</th>
                      <th style={{ padding: '16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '16px', fontWeight: '500' }}>{sub.name}</td>
                        <td style={{ padding: '16px' }}>{sub.category?.name || 'Uncategorized'}</td>
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
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                <CalendarClock size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3>No subscriptions found</h3>
                <p>Add active services to keep track of recurring payments</p>
              </div>
            )}
          </div>
        </div>

        <div className="subscriptions-chart-container">
          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Cost Breakdown
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
                <p>No active subscriptions to show breakdown</p>
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
              <h2>Add Subscription</h2>
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
                <label>Service Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Netflix, Spotify"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
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
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount (VND)</label>
                <FormattedAmountInput
                  className="input"
                  placeholder="e.g. 260.000"
                  value={formData.amount}
                  onChange={(val) => setFormData({ ...formData, amount: val })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Billing Cycle</label>
                <select
                  className="input"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Next Billing Date</label>
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
                  {saving ? 'Adding...' : 'Add Subscription'}
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

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => { setShowConfirmModal(false); setSubToCancel(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Subscription</h2>
              <button className="close-button" onClick={() => { setShowConfirmModal(false); setSubToCancel(null); }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px', color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'left' }}>
              Are you sure you want to cancel this subscription? This will permanently delete the recurring expense tracker from your account.
            </div>

            <div className="button-group" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => { setShowConfirmModal(false); setSubToCancel(null); }}
                disabled={cancelling}
              >
                Keep Subscription
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
