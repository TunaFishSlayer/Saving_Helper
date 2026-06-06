// src/components/layout/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import { Home, DollarSign, Target, FolderOpen, X, Trophy, CalendarClock, User, LogOut } from 'lucide-react'; 
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { locale, toggleLanguage, t } = useLanguage();
  const { logout, isGuest } = useAuth();

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

        <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          {/* Language Selector */}
          <div style={{ marginBottom: '1rem', width: '100%' }}>
            <select
              value={locale}
              onChange={(e) => toggleLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
                color: '#334155',
              }}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          {isGuest ? (
            <button
              className="nav-item"
              style={{ color: '#4f46e5', fontWeight: 600, marginBottom: '0.5rem' }}
              onClick={() => {
                onClose();
                logout(); // logs out guest profile, redirects to login/register page
              }}
            >
              <User size={20} />
              <span>Go Online</span>
            </button>
          ) : (
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
              style={{ marginBottom: '0.5rem' }}
            >
              <User size={20} />
              <span>{t('navProfile')}</span>
            </NavLink>
          )}

          <button
            className="nav-item logout-btn"
            onClick={() => {
              onClose();
              logout();
            }}
          >
            <LogOut size={20} />
            <span>{t('navLogout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;