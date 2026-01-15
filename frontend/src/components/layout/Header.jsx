// src/components/layout/Header.jsx

import { Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="header">
      <button className="menu-button" onClick={onMenuClick}>
        <Menu size={24} />
      </button>
      
      <div className="header-content">
        <h2 className="header-title">Welcome back, {user?.name || 'User'}!</h2>
      </div>

      <div className="header-user">
        <div className="user-avatar">
          <User size={20} />
        </div>
        <span className="user-name">{user?.name}</span>
      </div>
    </header>
  );
};

export default Header;