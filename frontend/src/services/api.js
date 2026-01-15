// src/services/api.js

import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

class ApiService {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        // IMPROVED ERROR HANDLING:
        // Try to parse the error as JSON to get the clean "message" property
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          // If response isn't JSON, fallback to plain text
          errorMessage = await response.text();
        }
        
        throw new Error(errorMessage || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle cases where response might be empty (like 204 No Content)
      const text = await response.text();
      return text ? JSON.parse(text) : {};

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }


  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export default new ApiService();