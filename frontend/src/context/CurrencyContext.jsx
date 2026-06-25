import React, { createContext, useState, useContext } from 'react';

const CurrencyContext = createContext();

export const EXCHANGE_RATE = 25400; // 1 USD = 25,400 VND

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(localStorage.getItem('currency') || 'VND');

  const setCurrency = (newCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '';
    if (currency === 'USD') {
      const usdAmount = amount / EXCHANGE_RATE;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdAmount);
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
