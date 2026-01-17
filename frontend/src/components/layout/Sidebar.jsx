// src/components/layout/Sidebar.jsx

import { NavLink } from 'react-router-dom';
import { Home, DollarSign, Target, FolderOpen, X, ChartColumn } from 'lucide-react'; 

const Sidebar = ({ isOpen, onClose }) => {

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/transactions', icon: DollarSign, label: 'Transaction' },
    { path: '/budgets', icon: Target, label: 'Budget' },
    { path: '/categories', icon: FolderOpen, label: 'Category' },
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
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;