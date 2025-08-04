// src/services/storage.js - Enhanced storage service
import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  // Generic get/set methods
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      return false;
    }
  }

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Specific methods for common data
  async getUser() {
    return await this.get('user');
  }

  async setUser(user) {
    return await this.set('user', user);
  }

  async getTokens() {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  }

  async setTokens(tokens) {
    try {
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      return true;
    } catch (error) {
      console.error('Error setting tokens:', error);
      return false;
    }
  }

  async clearAuthData() {
    try {
      await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  }

  // Cache management
  async setCache(key, data, expiryMinutes = 60) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (expiryMinutes * 60 * 1000)
    };
    return await this.set(`cache_${key}`, cacheData);
  }

  async getCache(key) {
    const cacheData = await this.get(`cache_${key}`);
    
    if (!cacheData) return null;
    
    if (Date.now() > cacheData.expiry) {
      await this.remove(`cache_${key}`);
      return null;
    }
    
    return cacheData.data;
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }
}

export default new StorageService();