// src/context/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import { STORAGE_KEYS } from '../utils/constants';
import { generateUUID, seedDefaultCategories } from '../services/localDb';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [authMode, setAuthMode] = useState(localStorage.getItem('auth_mode') || 'cloud'); // 'cloud' | 'offline'
  const [deviceUuid, setDeviceUuid] = useState(localStorage.getItem('device_uuid'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate an anonymous transparent device UUID if not present
    if (!deviceUuid) {
      const newUuid = generateUUID();
      localStorage.setItem('device_uuid', newUuid);
      setDeviceUuid(newUuid);
    }
  }, [deviceUuid]);

  useEffect(() => {
    if (authMode === 'offline') {
      setUser({ id: 'guest', name: 'Offline Guest', email: 'offline@guest' });
      seedDefaultCategories();
      setLoading(false);
    } else if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token, authMode]);

  const fetchProfile = async () => {
    try {
      const data = await authService.getProfile();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
    localStorage.setItem('auth_mode', 'cloud');
    setAuthMode('cloud');
    setToken(newToken);
    setUser(userData);
    seedDefaultCategories();
  };

  const loginGuest = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.setItem('auth_mode', 'offline');
    setAuthMode('offline');
    setToken(null);
    setUser({ id: 'guest', name: 'Offline Guest', email: 'offline@guest' });
    seedDefaultCategories();
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem('auth_mode');
    setAuthMode('cloud');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const isGuest = authMode === 'offline';

  return (
    <AuthContext.Provider value={{ user, token, authMode, isGuest, deviceUuid, login, loginGuest, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;