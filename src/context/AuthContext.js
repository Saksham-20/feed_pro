// context/AuthContext.js - Authentication context provider
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedUser, accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken')
      ]);

      if (storedUser && accessToken) {
        setUser(JSON.parse(storedUser));
        setTokens({ accessToken, refreshToken });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        'http://192.168.29.161:3000/api/auth/login',
        { email: email.toLowerCase().trim(), password },
        { timeout: 10000 }
      );

      if (response.data.success) {
        const { user: userData, tokens: userTokens } = response.data.data;

        // Store in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('user', JSON.stringify(userData)),
          AsyncStorage.setItem('accessToken', userTokens.accessToken),
          AsyncStorage.setItem('refreshToken', userTokens.refreshToken)
        ]);

        // Update state
        setUser(userData);
        setTokens(userTokens);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('accessToken'),
        AsyncStorage.removeItem('refreshToken')
      ]);

      // Clear state
      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        'http://192.168.29.161:3000/api/auth/refresh',
        { refreshToken: tokens.refreshToken },
        { timeout: 10000 }
      );

      if (response.data.success) {
        const newTokens = response.data.data.tokens;
        
        // Update AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('accessToken', newTokens.accessToken),
          AsyncStorage.setItem('refreshToken', newTokens.refreshToken)
        ]);

        // Update state
        setTokens(newTokens);

        return { success: true, tokens: newTokens };
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
      return { success: false, message: 'Session expired' };
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      await AsyncStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: 'Failed to update user data' };
    }
  };

  const contextValue = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAccessToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};