// src/services/authService.js

import api from './api';

class AuthService {
  async register(userData) {
    // api.js handles JSON.stringify, so just pass the object
    return await api.post('/auth/register', userData);
  }

  async login(credentials) {
    return await api.post('/auth/login', credentials);
  }

  async loginGoogle(credential) {
    return await api.post('/auth/google', { credential });
  }

  // FIXED: Renamed to match the call in Login.jsx (was requestResetPassword)
  async requestResetPassword(email) {
    return await api.post('/auth/request-reset-password', { email });
  }

  // FIXED: Updated to accept 3 arguments to match Login.jsx
  async resetPassword(email, code, newPassword) {
    return await api.post('/auth/reset-password', { 
      email, 
      code, 
      newPassword 
    });
  }

  async getProfile() {
    return await api.get('/users/me');
  }

  async updateProfile(userData) {
    return await api.put('/users/me/update', userData);
  }

  async updatePassword(passwordData) {
    return await api.put('/users/me/updatePassword', passwordData);
  }

  async deleteAccount() {
    return await api.delete('/users/me');
  }
}

export default new AuthService();