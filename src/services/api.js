// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_ENDPOINTS } from '../utils/constants';

// Base API configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://your-production-api.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            await Promise.all([
              AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
              AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken),
            ]);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear stored tokens and redirect to login
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.removeItem(STORAGE_KEYS.USER),
        ]);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
