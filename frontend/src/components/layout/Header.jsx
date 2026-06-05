// src/components/layout/Header.jsx

import { useState, useRef, useEffect } from 'react';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { locale, toggleLanguage, t } = useLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header">
      <button className="menu-button" onClick={onMenuClick}>
        <Menu size={24} />
      </button>

      <div className="header-content">
        <h2 className="header-title">{t('welcome')}, {user?.name || 'User'}!</h2>
      </div>

      {/* Language Selector */}
      <div className="language-selector" style={{ marginRight: '16px', display: 'flex', alignItems: 'center' }}>
        <select
          value={locale}
          onChange={(e) => toggleLanguage(e.target.value)}
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none',
            color: '#374151',
          }}
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* User Menu Area */}
      <div className="user-menu-container" ref={dropdownRef}>
        <button
          className="header-user-btn"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="user-avatar">
            <User size={20} />
          </div>
          <span className="user-name">{user?.name || 'Profile'}</span>
          <ChevronDown size={16} className={`chevron ${showDropdown ? 'rotate' : ''}`} />
        </button>

        {/* Floating Dropdown */}
        {showDropdown && (
          <div className="dropdown-menu">
            <Link
              to="/profile"
              className="dropdown-item"
              onClick={() => setShowDropdown(false)}
            >
              <User size={18} />
              <span>{t('viewProfile')}</span>
            </Link>

            <div className="dropdown-divider"></div>

            <button
              className="dropdown-item text-danger"
              onClick={() => {
                setShowDropdown(false);
                logout();
              }}
            >
              <LogOut size={18} />
              <span>{t('navLogout')}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;