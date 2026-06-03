import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/constants';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  
  // Dummy data scaled for VND currency
  useEffect(() => {
    setSubscriptions([
      { id: '1', name: 'Netflix', amount: 260000, billingCycle: 'monthly', nextBillingDate: '2026-06-15' },
      { id: '2', name: 'Gym Membership', amount: 500000, billingCycle: 'monthly', nextBillingDate: '2026-06-01' },
      { id: '3', name: 'Amazon Prime', amount: 3200000, billingCycle: 'yearly', nextBillingDate: '2026-11-20' }
    ]);
  }, []);

  const totalMonthlyCost = subscriptions.reduce((total, sub) => {
    return total + (sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12);
  }, 0);

  return (
    <div className="subscriptions-page" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarClock size={28} color="#E91E63" /> Subscriptions Tracker
        </h1>
        <button className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      <div className="subscriptions-list" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '16px' }}>Service Name</th>
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
                <td style={{ padding: '16px', color: '#E91E63', fontWeight: '600' }}>{formatCurrency(sub.amount)}</td>
                <td style={{ padding: '16px', textTransform: 'capitalize' }}>
                  <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                    {sub.billingCycle}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#666' }}>{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                <td style={{ padding: '16px' }}>
                  <button style={{ color: '#f44336', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subscriptions;
