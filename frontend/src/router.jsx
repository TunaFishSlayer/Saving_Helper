// src/router.jsx

import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transaction from './pages/Transaction.jsx';
import Budget from './pages/Budget.jsx';
import Category from './pages/Category.jsx';
import Profile from './pages/Profile.jsx';
import BudgetAnalytics from './pages/BudgetAnalytics.jsx';
import NotFound from './pages/NotFound.jsx';
import Goals from './pages/Goals.jsx';
import Subscriptions from './pages/Subscriptions.jsx';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'transactions',
        element: <Transaction />
      },
      {
        path: 'budgets',
        element: <Budget />
      },
      {
        path: 'categories',
        element: <Category />
      },
      {
        path: 'profile',
        element: <Profile />
      },
      {
        path: 'budget-analytics',
        element: <BudgetAnalytics />
      },
      {
        path: 'goals',
        element: <Goals />
      },
      {
        path: 'subscriptions',
        element: <Subscriptions />
      }

    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);