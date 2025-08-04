import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  async login(email, password) {
    try {
      const response = await api.post('/api/auth/login', {
        email: email.toLowerCase().trim(),
        password
      });

      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Store data
        await Promise.all([
          AsyncStorage.setItem('user', JSON.stringify(user)),
          AsyncStorage.setItem('accessToken', tokens.accessToken),
          AsyncStorage.setItem('refreshToken', tokens.refreshToken)
        ]);

        return { success: true, user, tokens };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData);
      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  async logout() {
    try {
      await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Logout failed' };
    }
  }

  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();