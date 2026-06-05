// src/components/layout/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import { Home, DollarSign, Target, FolderOpen, X, ChartColumn, Trophy, CalendarClock } from 'lucide-react'; 
import { useLanguage } from '../../context/LanguageContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  const navItems = [
    { path: '/', icon: Home, translationKey: 'navDashboard' },
    { path: '/transactions', icon: DollarSign, translationKey: 'navTransactions' },
    { path: '/budgets', icon: Target, translationKey: 'navBudgets' },
    { path: '/categories', icon: FolderOpen, translationKey: 'navCategories' },
    { path: '/goals', icon: Trophy, translationKey: 'navGoals' },
    { path: '/subscriptions', icon: CalendarClock, translationKey: 'navSubscriptions' },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img 
              src="/logo.png" 
              alt="Logo" 
            /> 
            <span>Savings Helper</span>
          </div>
          <button className="sidebar-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
              end={item.path === '/'}
            >
              <item.icon size={20} />
              <span>{t(item.translationKey)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;