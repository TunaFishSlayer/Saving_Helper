// frontend/src/pages/Dashboard.jsx

import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import transactionService from '../services/transactionService';
import budgetService from '../services/budgetService';
import categoryService from '../services/categoryService';
import { CHART_COLORS, formatCurrency } from '../utils/constants';

const Dashboard = () => {
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [incomeRes, expenseRes, transactionsRes, alertsRes, categoryRes, categoriesRes] = await Promise.all([
        transactionService.getTotalByType('income'),
        transactionService.getTotalByType('expense'),
        transactionService.getTransactions({ limit: 5, sortBy: 'date', order: 'desc' }),
        budgetService.getBudgetAlerts(),
        transactionService.getExpenseByCategory(),
        categoryService.getCategories()
      ]);

      setStats({
        income: incomeRes.total || 0,
        expense: expenseRes.total || 0,
        balance: (incomeRes.total || 0) - (expenseRes.total || 0)
      });

      setRecentTransactions(transactionsRes.data || []);
      setBudgetAlerts(alertsRes.data?.alerts || []);
      setCategories(categoriesRes || []);

      // Map category IDs to names for the chart
      const mappedCategoryData = (categoryRes || []).map(item => {
        const category = categoriesRes.find(cat => cat.id === item.id);
        return {
          name: category?.name || 'Unknown',
          value: item.total
        };
      });

      setCategoryData(mappedCategoryData);

      // Generate trend data for last 6 months
      await generateTrendData();

      // Monthly comparison for current month
      const now = new Date();
      const monthlyRes = await transactionService.getMonthlySummary(
        now.getFullYear(), 
        now.getMonth() + 1
      );
      
      const monthly = monthlyRes.map(item => ({
        name: item.id === 'income' ? 'Income' : 'Expense',
        amount: item.total
      }));

      setMonthlyData(monthly);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = async () => {
    const now = new Date();
    const months = [];
    const trend = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleString('default', { month: 'short' })
      });
    }

    // Fetch data for each month
    for (const monthData of months) {
      try {
        const summary = await transactionService.getMonthlySummary(
          monthData.year,
          monthData.month
        );

        const income = summary.find(s => s.id === 'income')?.total || 0;
        const expense = summary.find(s => s.id === 'expense')?.total || 0;


        trend.push({
          month: monthData.label,
          income,
          expense
        });
      } catch (error) {
        console.error(`Failed to fetch data for ${monthData.label}:`, error);
        trend.push({
          month: monthData.label,
          income: 0,
          expense: 0
        });
      }
    }

    setTrendData(trend);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
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
          <p style={{ margin: 0, fontWeight: 600 }}>{payload[0].name}</p>
          <p style={{ margin: '4px 0 0 0', color: '#6366f1' }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Financial Dashboard</h1>
        
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="input"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-income">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total Income</p>
              <p className="stat-value">{formatCurrency(stats.income)}</p>
            </div>
            <div className="stat-icon">
              <TrendingUp size={48} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-expense">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total Expense</p>
              <p className="stat-value">{formatCurrency(stats.expense)}</p>
            </div>
            <div className="stat-icon">
              <TrendingDown size={48} />
            </div>
          </div>
        </div>

        <div className="stat-card stat-balance">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Balance</p>
              <p className="stat-value">{formatCurrency(stats.balance)}</p>
            </div>
            <div className="stat-icon">
              <Wallet size={48} />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="budget-alerts">
          <h2 className="section-title">
            <AlertCircle size={20} />
            Budget Alerts
          </h2>
          <div className="alerts-list">
            {budgetAlerts.map((alert, index) => (
              <div key={index} className={`alert alert-${alert.severity}`}>
                • {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-container">
        {/* Income vs Expense Trend - Full Width */}
        <div className="card chart-full">
          <h2 className="card-title">Income vs Expense Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Two Charts Side by Side */}
        <div className="dashboard-grid">
          {/* Expense by Category */}
          <div className="card">
            <h2 className="card-title">Expenses by Category</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => entry.name}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No expense data available</p>
              </div>
            )}
          </div>

          {/* Monthly Comparison */}
          <div className="card">
            <h2 className="card-title">This Month's Summary</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No data for this month</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="card-title">Recent Transactions</h2>
        {recentTransactions.length > 0 ? (
          <div className="transactions-list">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-info">

                  <p className="transaction-description">
                    {transaction.description || getCategoryName(transaction.categoryId)}
                  </p>
                  <p className="transaction-date">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`transaction-amount transaction-${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;