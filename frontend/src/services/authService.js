// src/services/authService.js

import api from './api';

class AuthService {
  async register(userData) {
    return await api.post('/auth/register', userData);
  }

  async login(credentials) {
    return await api.post('/auth/login', credentials);
  }

  async loginGoogle(credential) {
    return await api.post('/auth/google', { credential });
  }

  async requestResetPassword(email) {
    return await api.post('/auth/request-reset-password', { email });
  }

  async resetPassword(resetData) {
    return await api.post('/auth/reset-password', resetData);
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