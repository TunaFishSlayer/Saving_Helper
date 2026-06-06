// src/components/layout/Layout.jsx

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavbar from './BottomNavbar';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import syncService from '../../services/syncService';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, isGuest } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Perform background sync on layout load if in cloud mode
  useEffect(() => {
    if (!isGuest && token) {
      syncService.sync(token).catch(err => console.error('Background sync failed:', err));
    }
  }, [isGuest, token]);

  return (
    <div className="layout">
      <Toaster position="top-right" reverseOrder={false} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuClick={toggleSidebar} />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default Layout;