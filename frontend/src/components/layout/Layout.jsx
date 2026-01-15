// src/components/layout/Layout.jsx

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast'; // Already imported

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
    </div>
  );
};

export default Layout;