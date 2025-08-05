// src/context/AppContext.js
import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext({});

const initialState = {
  theme: 'light',
  language: 'en',
  notifications: {
    enabled: true,
    push: true,
    email: true,
  },
  settings: {
    autoSync: true,
    offlineMode: false,
  },
  networkStatus: {
    isConnected: true,
    connectionType: 'wifi',
  },
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    
    case 'UPDATE_NOTIFICATIONS':
      return {
        ...state,
        notifications: { ...state.notifications, ...action.payload },
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    
    case 'SET_NETWORK_STATUS':
      return {
        ...state,
        networkStatus: { ...state.networkStatus, ...action.payload },
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

  const setTheme = (theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const setLanguage = (language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  };

  const updateNotifications = (notifications) => {
    dispatch({ type: 'UPDATE_NOTIFICATIONS', payload: notifications });
  };

  const updateSettings = (settings) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const setNetworkStatus = (status) => {
    dispatch({ type: 'SET_NETWORK_STATUS', payload: status });
  };

  const contextValue = {
    ...state,
    setTheme,
    setLanguage,
    updateNotifications,
    updateSettings,
    setNetworkStatus,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export { AppContext };