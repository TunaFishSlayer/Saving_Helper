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
      }
    ]
  },
  {
    path: '*',
    element: (
      <div className="not-found">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go to Dashboard</a>
      </div>
    )
  }
]);