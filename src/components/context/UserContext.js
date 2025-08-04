import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const UserContext = createContext({});

const initialState = {
  profile: null,
  preferences: {
    notifications: true,
    theme: 'light',
    language: 'en',
    currency: 'INR',
  },
  stats: {
    orders: 0,
    bills: 0,
    feedback: 0,
  },
  recentActivity: [],
};

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    
    case 'ADD_ACTIVITY':
      return {
        ...state,
        recentActivity: [action.payload, ...state.recentActivity.slice(0, 9)]
      };
    
    case 'SET_ACTIVITY':
      return { ...state, recentActivity: action.payload };
    
    case 'CLEAR_USER_DATA':
      return initialState;
    
    default:
      return state;
  }
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    } else {
      dispatch({ type: 'CLEAR_USER_DATA' });
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    try {
      // Load preferences
      const preferences = await AsyncStorage.getItem('userPreferences');
      if (preferences) {
        dispatch({
          type: 'UPDATE_PREFERENCES',
          payload: JSON.parse(preferences)
        });
      }

      // Load recent activity
      const activity = await AsyncStorage.getItem('recentActivity');
      if (activity) {
        dispatch({
          type: 'SET_ACTIVITY',
          payload: JSON.parse(activity)
        });
      }

      // Set profile from auth context
      dispatch({
        type: 'SET_PROFILE',
        payload: user
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const updatedPreferences = { ...state.preferences, ...newPreferences };
      await AsyncStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));
      
      dispatch({
        type: 'UPDATE_PREFERENCES',
        payload: newPreferences
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error: error.message };
    }
  };

  const addActivity = async (activity) => {
    try {
      const newActivity = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...activity
      };

      const updatedActivity = [newActivity, ...state.recentActivity.slice(0, 9)];
      await AsyncStorage.setItem('recentActivity', JSON.stringify(updatedActivity));
      
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: newActivity
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding activity:', error);
      return { success: false, error: error.message };
    }
  };

  const updateStats = (stats) => {
    dispatch({
      type: 'SET_STATS',
      payload: stats
    });
  };

  const clearUserData = async () => {
    try {
      await AsyncStorage.multiRemove(['userPreferences', 'recentActivity']);
      dispatch({ type: 'CLEAR_USER_DATA' });
      return { success: true };
    } catch (error) {
      console.error('Error clearing user data:', error);
      return { success: false, error: error.message };
    }
  };

  const contextValue = {
    ...state,
    updatePreferences,
    addActivity,
    updateStats,
    clearUserData,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};