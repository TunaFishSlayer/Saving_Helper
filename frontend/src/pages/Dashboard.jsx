// src/pages/Dashboard.jsx

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import transactionService from '../services/transactionService';
import budgetService from '../services/budgetService';
import categoryService from '../services/categoryService';
import { CHART_COLORS } from '../utils/constants';

const Dashboard = () => {
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
        const category = categoriesRes.find(cat => cat._id === item._id);
        return {
          name: category?.name || 'Unknown',
          value: item.total
        };
      });
      setCategoryData(mappedCategoryData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category?.name || 'Unknown';
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
      <h1 className="page-title">Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-income">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">Total Income</p>
              <p className="stat-value">${stats.income.toFixed(2)}</p>
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
              <p className="stat-value">${stats.expense.toFixed(2)}</p>
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
              <p className="stat-value">${stats.balance.toFixed(2)}</p>
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

      {/* Charts and Recent Transactions */}
      <div className="dashboard-grid">
        {/* Expense Chart */}
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
                  label={(entry) => `${entry.name}: $${entry.value.toFixed(2)}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>No expense data available</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="card-title">Recent Transactions</h2>
          {recentTransactions.length > 0 ? (
            <div className="transactions-list">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="transaction-item">
                  <div className="transaction-info">
                    <p className="transaction-description">
                      {transaction.description || getCategoryName(transaction.categoryId)}
                    </p>
                    <p className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`transaction-amount transaction-${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
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
    </div>
  );
};

export default Dashboard;