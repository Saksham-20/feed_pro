// src/services/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

export const storageService = {
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return { success: true };
    } catch (error) {
      console.error('Storage setItem error:', error);
      return { success: false, error: error.message };
    }
  },

  async getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error('Storage removeItem error:', error);
      return { success: false, error: error.message };
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Storage clear error:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return { success: true, keys };
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return { success: false, error: error.message };
    }
  },

  // Cache with expiration
  async setCachedItem(key, value, expirationMinutes = 60) {
    try {
      const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
      const cachedData = {
        data: value,
        expiration: expirationTime,
      };
      
      await this.setItem(`${STORAGE_KEYS.CACHE_PREFIX}${key}`, cachedData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getCachedItem(key) {
    try {
      const cachedData = await this.getItem(`${STORAGE_KEYS.CACHE_PREFIX}${key}`);
      
      if (!cachedData) {
        return null;
      }

      if (Date.now() > cachedData.expiration) {
        await this.removeItem(`${STORAGE_KEYS.CACHE_PREFIX}${key}`);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error('Get cached item error:', error);
      return null;
    }
  },

  async clearExpiredCache() {
    try {
      const { keys } = await this.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.CACHE_PREFIX));
      
      for (const key of cacheKeys) {
        const cachedData = await this.getItem(key);
        if (cachedData && Date.now() > cachedData.expiration) {
          await this.removeItem(key);
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};