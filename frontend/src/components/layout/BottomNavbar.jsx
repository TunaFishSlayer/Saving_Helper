// src/components/layout/BottomNavbar.jsx

import { NavLink } from 'react-router-dom';
import { Home, DollarSign, Target, FolderOpen, Trophy, CalendarClock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const BottomNavbar = () => {
  const { t } = useLanguage();

  const navItems = [
    { path: '/', icon: Home, translationKey: 'btmDashboard' },
    { path: '/transactions', icon: DollarSign, translationKey: 'btmTransactions' },
    { path: '/budgets', icon: Target, translationKey: 'btmBudgets' },
    { path: '/categories', icon: FolderOpen, translationKey: 'btmCategories' },
    { path: '/goals', icon: Trophy, translationKey: 'btmGoals' },
    { path: '/subscriptions', icon: CalendarClock, translationKey: 'btmSubscriptions' },
  ];

  return (
    <nav className="bottom-navbar">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          end={item.path === '/'}
        >
          <item.icon className="bottom-nav-icon" size={22} />
          <span className="bottom-nav-label">{t(item.translationKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavbar;
