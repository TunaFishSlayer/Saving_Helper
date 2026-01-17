import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import budgetService from '../services/budgetService';
import { CHART_COLORS, formatCurrency } from '../utils/constants';

const BudgetAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      
      const [overviewRes, alertsRes] = await Promise.all([
        budgetService.getBudgetOverview(),
        budgetService.getBudgetAlerts()
      ]);

      setOverview(overviewRes.data.summary);
      setBudgets(overviewRes.data.budgets || []);
      setAlerts(alertsRes.data?.alerts || []);

    } catch (error) {
      console.error('Failed to fetch budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const getBudgetUtilizationData = () => {
    return budgets.map(b => ({
      name: b.budget.categoryName,
      budgeted: b.budget.amount,
      spent: b.spending.totalSpent,
      remaining: b.spending.remaining,
      percentage: parseFloat(b.spending.percentageUsed)
    }));
  };

  const getStatusDistribution = () => {
    const onTrack = budgets.filter(b => !b.spending.isOverBudget && !b.spending.isNearLimit).length;
    const nearLimit = budgets.filter(b => b.spending.isNearLimit).length;
    const overBudget = budgets.filter(b => b.spending.isOverBudget).length;

    return [
      { name: 'On Track', value: onTrack, color: '#10b981' },
      { name: 'Near Limit', value: nearLimit, color: '#f59e0b' },
      { name: 'Over Budget', value: overBudget, color: '#ef4444' }
    ].filter(item => item.value > 0);
  };

  const getTopSpendingCategories = () => {
    return budgets
      .sort((a, b) => b.spending.totalSpent - a.spending.totalSpent)
      .slice(0, 5)
      .map(b => ({
        name: b.budget.categoryName,
        amount: b.spending.totalSpent
      }));
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>
            {payload[0].payload.name}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color,
              fontSize: '14px'
            }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p>Loading budget analytics...</p>
      </div>
    );
  }

  const utilizationData = getBudgetUtilizationData();
  const statusData = getStatusDistribution();
  const topSpending = getTopSpendingCategories();

  return (
    <div className="budget-analytics-page">
      <h1 className="page-title">Budget Analytics</h1>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total Budgeted</p>
              <p className="stat-value" style={{ color: '#6366f1' }}>
                {formatCurrency(overview?.totalBudgeted || 0)}
              </p>
            </div>
            <div className="stat-icon">
              <Target size={48} style={{ color: '#6366f1', opacity: 0.2 }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total Spent</p>
              <p className="stat-value" style={{ color: '#ef4444' }}>
                {formatCurrency(overview?.totalSpent || 0)}
              </p>
            </div>
            <div className="stat-icon">
              <DollarSign size={48} style={{ color: '#ef4444', opacity: 0.2 }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Budgets On Track</p>
              <p className="stat-value" style={{ color: '#10b981' }}>
                {overview?.totalBudgets - overview?.overBudgetCount - overview?.nearLimitCount || 0}
              </p>
            </div>
            <div className="stat-icon">
              <CheckCircle size={48} style={{ color: '#10b981', opacity: 0.2 }} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Over Budget</p>
              <p className="stat-value" style={{ color: '#ef4444' }}>
                {overview?.overBudgetCount || 0}
              </p>
            </div>
            <div className="stat-icon">
              <AlertTriangle size={48} style={{ color: '#ef4444', opacity: 0.2 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="budget-alerts">
          <h2 className="section-title">
            <AlertTriangle size={20} />
            Active Alerts ({alerts.length})
          </h2>
          <div className="alerts-list">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.severity}`}>
                <strong>{alert.type === 'over_budget' ? '🔴' : '⚠️'}</strong> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-container">
        {/* Budget vs Actual Spending */}
        <div className="card chart-full">
          <h2 className="card-title">Budget vs Actual Spending</h2>
          {utilizationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="budgeted" fill="#6366f1" name="Budget" radius={[8, 8, 0, 0]} />
                <Bar dataKey="spent" fill="#ef4444" name="Spent" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <Target size={64} />
              <h3>No budget data</h3>
              <p>Create budgets to see analytics</p>
            </div>
          )}
        </div>

        {/* Two Charts Side by Side */}
        <div className="dashboard-grid">
          {/* Budget Status Distribution */}
          <div className="card">
            <h2 className="card-title">Budget Status</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No status data available</p>
              </div>
            )}
          </div>

          {/* Top Spending Categories */}
          <div className="card">
            <h2 className="card-title">Top 5 Spending Categories</h2>
            {topSpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSpending} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" stroke="#6b7280" tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" width={100} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No spending data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Budget Utilization Details */}
        <div className="card">
          <h2 className="card-title">Budget Utilization Details</h2>
          {budgets.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Budget</th>
                    <th>Spent</th>
                    <th>Remaining</th>
                    <th>Usage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 500 }}>{budget.budget.categoryName}</td>
                      <td>{formatCurrency(budget.budget.amount)}</td>
                      <td style={{ color: '#ef4444' }}>{formatCurrency(budget.spending.totalSpent)}</td>
                      <td style={{ color: '#10b981' }}>{formatCurrency(budget.spending.remaining)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1,
                            height: '8px',
                            background: '#f3f4f6',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(budget.spending.percentageUsed, 100)}%`,
                              height: '100%',
                              background: budget.spending.isOverBudget ? '#ef4444' : 
                                         budget.spending.isNearLimit ? '#f59e0b' : '#10b981',
                              transition: 'width 0.3s'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '45px' }}>
                            {budget.spending.percentageUsed}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          budget.spending.isOverBudget ? 'badge-expense' : 
                          budget.spending.isNearLimit ? 'badge-warning' : 'badge-income'
                        }`}>
                          {budget.spending.isOverBudget ? 'OVER' : 
                           budget.spending.isNearLimit ? 'WARNING' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Target size={64} />
              <h3>No budgets created</h3>
              <p>Create your first budget to see analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalytics;