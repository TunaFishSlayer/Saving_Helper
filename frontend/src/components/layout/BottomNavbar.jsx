// src/components/layout/BottomNavbar.jsx

import { NavLink } from 'react-router-dom';
import { Home, DollarSign, Target, Trophy, CalendarClock } from 'lucide-react';

const BottomNavbar = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/transactions', icon: DollarSign, label: 'Transactions' },
    { path: '/budgets', icon: Target, label: 'Budgets' },
    { path: '/goals', icon: Trophy, label: 'Goals' },
    { path: '/subscriptions', icon: CalendarClock, label: 'Subscriptions' },
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
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavbar;
