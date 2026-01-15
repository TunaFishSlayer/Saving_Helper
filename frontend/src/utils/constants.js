// src/utils/constants.js

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

export const BUDGET_PERIODS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

export const CATEGORY_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

export const COLORS = {
  PRIMARY: '#6366f1',
  PRIMARY_DARK: '#4f46e5',
  SUCCESS: '#10b981',
  SUCCESS_DARK: '#059669',
  DANGER: '#ef4444',
  DANGER_DARK: '#dc2626',
  WARNING: '#f59e0b',
  INFO: '#3b82f6'
};

export const CHART_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#f43f5e',
  '#14b8a6'
];

export const DATE_FORMAT = 'YYYY-MM-DD';

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user'
};