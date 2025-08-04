// context/AppContext.js - Enhanced global app state context
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { NetInfo } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext({});

const initialState = {
  theme: 'light',
  notifications: [],
  isOnline: true,
  syncQueue: [],
  preferences: {
    language: 'en',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    notifications: {
      push: true,
      email: true,
      inApp: true,
    },
    autoSync: true,
    biometricAuth: false,
  },
  appSettings: {
    apiBaseUrl: 'http://192.168.29.161:3000',
    apiTimeout: 10000,
    maxRetries: 3,
    cacheTimeout: 300000, // 5 minutes
  },
  cache: {},
  errors: [],
  loading: {
    global: false,
    specific: {},
  },
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    
    case 'ADD_TO_SYNC_QUEUE':
      return {
        ...state,
        syncQueue: [...state.syncQueue, action.payload],
      };
    
    case 'REMOVE_FROM_SYNC_QUEUE':
      return {
        ...state,
        syncQueue: state.syncQueue.filter(item => item.id !== action.payload),
      };

    case 'CLEAR_SYNC_QUEUE':
      return {
        ...state,
        syncQueue: [],
      };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case 'UPDATE_APP_SETTINGS':
      return {
        ...state,
        appSettings: { ...state.appSettings, ...action.payload },
      };

    case 'SET_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: {
            data: action.payload.data,
            timestamp: Date.now(),
            expiry: action.payload.expiry || state.appSettings.cacheTimeout,
          },
        },
      };

    case 'CLEAR_CACHE':
      if (action.payload) {
        const newCache = { ...state.cache };
        delete newCache[action.payload];
        return { ...state, cache: newCache };
      }
      return { ...state, cache: {} };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload],
      };

    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload),
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };

    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        loading: { ...state.loading, global: action.payload },
      };

    case 'SET_SPECIFIC_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          specific: {
            ...state.loading.specific,
            [action.payload.key]: action.payload.value,
          },
        },
      };

    case 'LOAD_STORED_STATE':
      return {
        ...state,
        ...action.payload,
        // Don't restore volatile state
        notifications: [],
        isOnline: true,
        syncQueue: [],
        errors: [],
        loading: initialState.loading,
      };
    
    default:
      return state;
  }
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize app state from storage
  useEffect(() => {
    initializeApp();
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOnlineStatus(state.isConnected);
      
      // Auto-sync when coming back online
      if (state.isConnected && state.syncQueue.length > 0) {
        processSyncQueue();
      }
    });

    return unsubscribe;
  }, []);

  // Auto-save app state
  useEffect(() => {
    if (isInitialized) {
      saveAppState();
    }
  }, [state.theme, state.preferences, state.appSettings]);

  // Clean up expired cache
  useEffect(() => {
    const interval = setInterval(() => {
      cleanExpiredCache();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const initializeApp = async () => {
    try {
      const storedState = await AsyncStorage.getItem('appState');
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        dispatch({ type: 'LOAD_STORED_STATE', payload: parsedState });
      }
    } catch (error) {
      console.error('Error loading app state:', error);
      addError({
        message: 'Failed to load app settings',
        type: 'storage',
        severity: 'low',
      });
    } finally {
      setIsInitialized(true);
    }
  };

  const saveAppState = async () => {
    try {
      const stateToSave = {
        theme: state.theme,
        preferences: state.preferences,
        appSettings: state.appSettings,
      };
      await AsyncStorage.setItem('appState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  };

  // Theme Management
  const setTheme = (theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Notification Management
  const addNotification = (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2);
    const fullNotification = {
      id,
      timestamp: new Date(),
      read: false,
      type: 'info',
      priority: 'normal',
      autoRemove: true,
      ...notification,
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
    
    // Auto-remove notification if specified
    if (fullNotification.autoRemove) {
      const timeout = fullNotification.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    return id;
  };

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  };

  const markNotificationRead = (id) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  // Network & Sync Management
  const setOnlineStatus = (isOnline) => {
    const wasOffline = !state.isOnline;
    dispatch({ type: 'SET_ONLINE_STATUS', payload: isOnline });
    
    if (isOnline && wasOffline) {
      addNotification({
        title: 'Connected',
        message: 'Internet connection restored',
        type: 'success',
        duration: 2000,
      });
    } else if (!isOnline) {
      addNotification({
        title: 'Offline',
        message: 'No internet connection',
        type: 'warning',
        autoRemove: false,
      });
    }
  };

  const addToSyncQueue = (item) => {
    const queueItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2),
      timestamp: new Date(),
      retries: 0,
      maxRetries: state.appSettings.maxRetries,
      ...item,
    };
    dispatch({ type: 'ADD_TO_SYNC_QUEUE', payload: queueItem });
    
    // Try to sync immediately if online
    if (state.isOnline) {
      processSyncQueue();
    }
  };

  const removeFromSyncQueue = (id) => {
    dispatch({ type: 'REMOVE_FROM_SYNC_QUEUE', payload: id });
  };

  const clearSyncQueue = () => {
    dispatch({ type: 'CLEAR_SYNC_QUEUE' });
  };

  const processSyncQueue = async () => {
    if (!state.isOnline || state.syncQueue.length === 0) return;

    for (const item of state.syncQueue) {
      try {
        // Process sync item based on type
        await processSync(item);
        removeFromSyncQueue(item.id);
      } catch (error) {
        console.error('Sync error:', error);
        
        // Increment retry count
        const updatedItem = { ...item, retries: item.retries + 1 };
        
        if (updatedItem.retries >= updatedItem.maxRetries) {
          removeFromSyncQueue(item.id);
          addError({
            message: `Failed to sync: ${item.description || 'Unknown item'}`,
            type: 'sync',
            severity: 'medium',
            data: item,
          });
        }
      }
    }
  };

  const processSync = async (item) => {
    // Implement sync logic based on item type
    // This is a placeholder - implement based on your sync requirements
    switch (item.type) {
      case 'order':
        // Sync order data
        break;
      case 'lead':
        // Sync lead data
        break;
      case 'task':
        // Sync task data
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  };

  // Preferences Management
  const updatePreferences = (preferences) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const updateAppSettings = (settings) => {
    dispatch({ type: 'UPDATE_APP_SETTINGS', payload: settings });
  };

  // Cache Management
  const setCache = (key, data, expiry) => {
    dispatch({
      type: 'SET_CACHE',
      payload: { key, data, expiry },
    });
  };

  const getCache = (key) => {
    const cached = state.cache[key];
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.expiry) {
      clearCache(key);
      return null;
    }
    
    return cached.data;
  };

  const clearCache = (key) => {
    dispatch({ type: 'CLEAR_CACHE', payload: key });
  };

  const clearAllCache = () => {
    dispatch({ type: 'CLEAR_CACHE' });
  };

  const cleanExpiredCache = () => {
    const now = Date.now();
    Object.keys(state.cache).forEach(key => {
      const cached = state.cache[key];
      if (now - cached.timestamp > cached.expiry) {
        clearCache(key);
      }
    });
  };

  // Error Management
  const addError = (error) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2);
    const fullError = {
      id,
      timestamp: new Date(),
      severity: 'medium',
      ...error,
    };

    dispatch({ type: 'ADD_ERROR', payload: fullError });

    // Auto-show as notification for high severity errors
    if (fullError.severity === 'high') {
      addNotification({
        title: 'Error',
        message: fullError.message,
        type: 'error',
        autoRemove: false,
      });
    }

    return id;
  };

  const removeError = (id) => {
    dispatch({ type: 'REMOVE_ERROR', payload: id });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  // Loading Management
  const setGlobalLoading = (loading) => {
    dispatch({ type: 'SET_GLOBAL_LOADING', payload: loading });
  };

  const setSpecificLoading = (key, loading) => {
    dispatch({
      type: 'SET_SPECIFIC_LOADING',
      payload: { key, value: loading },
    });
  };

  // Utility Functions
  const formatCurrency = (amount, currency = state.preferences.currency) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date, format = state.preferences.dateFormat) => {
    const dateObj = new Date(date);
    
    switch (format) {
      case 'DD/MM/YYYY':
        return dateObj.toLocaleDateString('en-GB');
      case 'MM/DD/YYYY':
        return dateObj.toLocaleDateString('en-US');
      case 'YYYY-MM-DD':
        return dateObj.toISOString().split('T')[0];
      default:
        return dateObj.toLocaleDateString();
    }
  };

  const formatTime = (date, format = state.preferences.timeFormat) => {
    const dateObj = new Date(date);
    
    return dateObj.toLocaleTimeString('en-US', {
      hour12: format === '12h',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const contextValue = {
    // State
    ...state,
    isInitialized,
    
    // Theme
    setTheme,
    toggleTheme,
    
    // Notifications
    addNotification,
    removeNotification,
    clearAllNotifications,
    markNotificationRead,
    
    // Network & Sync
    setOnlineStatus,
    addToSyncQueue,
    removeFromSyncQueue,
    clearSyncQueue,
    processSyncQueue,
    
    // Preferences & Settings
    updatePreferences,
    updateAppSettings,
    
    // Cache
    setCache,
    getCache,
    clearCache,
    clearAllCache,
    
    // Errors
    addError,
    removeError,
    clearErrors,
    
    // Loading
    setGlobalLoading,
    setSpecificLoading,
    
    // Utilities
    formatCurrency,
    formatDate,
    formatTime,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};