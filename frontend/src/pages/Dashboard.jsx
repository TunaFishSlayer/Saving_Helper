// frontend/src/pages/Dashboard.jsx

import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';
import transactionService from '../services/transactionService';
import budgetService from '../services/budgetService';
import categoryService from '../services/categoryService';
import { CHART_COLORS } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const Dashboard = () => {
  const { t } = useLanguage();
  const { currency, formatCurrency } = useCurrency();

  const formatYAxisMillion = (value) => {
    if (currency === 'USD') {
      const usdVal = value / 25400;
      return usdVal >= 1000 ? `$${(usdVal / 1000).toFixed(1).replace('.0', '')}k` : `$${Math.round(usdVal)}`;
    }
    return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
  };

  const formatYAxisThousand = (value) => {
    if (currency === 'USD') {
      const usdVal = value / 25400;
      return `$${Math.round(usdVal)}`;
    }
    return `${(value / 1000).toFixed(0)}k`;
  };

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
  const [budgetData, setBudgetData] = useState([]);
  const [dailySpendingData, setDailySpendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const generateDailySpendingData = (expenses) => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      data.push({
        day: `${i}/${now.getMonth() + 1}`,
        amount: 0
      });
    }
    expenses.forEach(t => {
      const d = new Date(t.date);
      const dayNum = d.getDate();
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        data[dayNum - 1].amount += Number(t.amount || 0);
      }
    });
    return data;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [incomeRes, expenseRes, transactionsRes, alertsRes, categoryRes, categoriesRes, budgetsRes, monthExpensesRes] = await Promise.all([
        transactionService.getTotalByType('income'),
        transactionService.getTotalByType('expense'),
        transactionService.getTransactions({ limit: 5, sortBy: 'date', order: 'desc' }),
        budgetService.getBudgetAlerts(),
        transactionService.getExpenseByCategory(),
        categoryService.getCategories(),
        budgetService.getBudgetOverview(),
        transactionService.getTransactions({
          type: 'expense',
          startDate: startOfMonth,
          endDate: endOfMonth
        })
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

      // Map budget overview data
      const budgetsList = budgetsRes.data?.budgets || [];
      const budgetChartData = budgetsList.map(item => ({
        category: item.budget.categoryName,
        limit: item.budget.amount,
        spent: item.spending.totalSpent
      }));
      setBudgetData(budgetChartData);

      // Map daily spending data
      const dailyData = generateDailySpendingData(monthExpensesRes.data || []);
      setDailySpendingData(dailyData);

      // Generate trend data for last 6 months
      await generateTrendData();

      // Monthly comparison for current month
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
        const netSavings = income - expense;
        const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;

        trend.push({
          month: monthData.label,
          income,
          expense,
          netSavings,
          savingsRate
        });
      } catch (error) {
        console.error(`Failed to fetch data for ${monthData.label}:`, error);
        trend.push({
          month: monthData.label,
          income: 0,
          expense: 0,
          netSavings: 0,
          savingsRate: 0
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
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          color: '#333'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>{payload[0].name || data.month}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0', color: entry.stroke || entry.fill || '#6366f1', fontWeight: 500 }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          {data.savingsRate !== undefined && (
            <p style={{ margin: '8px 0 0 0', color: '#10b981', fontWeight: 600, borderTop: '1px solid #eee', paddingTop: '6px' }}>
              {t('savingsRate')}: {data.savingsRate}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p>{t('dashboardLoading')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{t('dashboardTitle')}</h1>
        
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="input"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="1month">{t('periodLastMonth')}</option>
          <option value="3months">{t('periodLast3Months')}</option>
          <option value="6months">{t('periodLast6Months')}</option>
          <option value="1year">{t('periodLastYear')}</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-income">
          <div className="stat-content">
            <div className="stat-info">
              <p className="stat-label">{t('statTotalIncome')}</p>
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
              <p className="stat-label">{t('statTotalExpense')}</p>
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
              <p className="stat-label">{t('statBalance')}</p>
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
            {t('budgetAlertsTitle')}
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
          <h2 className="card-title">{t('chartIncomeExpense')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={formatYAxisMillion} />
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

        {/* Net Savings Rate Trend - Full Width */}
        <div className="card chart-full">
          <h2 className="card-title">{t('chartSavingsRate')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorNetSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={formatYAxisMillion} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="netSavings" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorNetSavings)" 
                name="Net Savings"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Spending Timeline - Full Width */}
        <div className="card chart-full">
          <h2 className="card-title">{t('chartDailySpending')}</h2>
          {dailySpendingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySpendingData}>
                <defs>
                  <linearGradient id="colorDailySpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={formatYAxisThousand} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDailySpent)" 
                  name={t('spentLabel')}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>{t('noExpenseData')}</p>
            </div>
          )}
        </div>

        {/* Three Charts Side by Side in Grid */}
        <div className="dashboard-grid">
          {/* Expense by Category */}
          <div className="card">
            <h2 className="card-title">{t('chartExpenseByCategory')}</h2>
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
                <p>{t('noExpenseData')}</p>
              </div>
            )}
          </div>

          {/* Budget vs Actual Spending */}
          <div className="card">
            <h2 className="card-title">{t('chartBudgetVsActual')}</h2>
            {budgetData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="category" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={formatYAxisMillion} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="limit" fill="#6366f1" opacity={0.65} name={t('budgetLabel')} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="spent" fill="#f43f5e" name={t('spentLabel')} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>{t('noBudgets')}</p>
              </div>
            )}
          </div>

          {/* Monthly Comparison */}
          <div className="card">
            <h2 className="card-title">{t('chartMonthlySummary')}</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={formatYAxisMillion} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>{t('noMonthlyData')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="card-title">{t('recentTransactions')}</h2>
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
            <p>{t('noTransactions')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;