// src/context/UserContext.js
import React, { createContext, useContext, useReducer } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const UserContext = createContext({});

const initialState = {
  users: [],
  loading: false,
  error: null,
  filters: {
    role: '',
    status: '',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload.users,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };
    
    case 'ADD_USER':
      return {
        ...state,
        users: [action.payload, ...state.users],
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.user_id === action.payload.user_id ? action.payload : user
        ),
      };
    
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.user_id !== action.payload),
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 }, // Reset to first page
      };
    
    case 'CLEAR_USERS':
      return { ...initialState };
    
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
  const { user: currentUser } = useAuth();

  const fetchUsers = async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: state.pagination.limit.toString(),
        ...filters,
      });

      const response = await api.get(`/api/admin/users?${queryParams}`);

      if (response.data.success) {
        dispatch({
          type: 'SET_USERS',
          payload: {
            users: response.data.data.users,
            pagination: response.data.data.pagination,
          },
        });
        return { success: true };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const createUser = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/api/admin/users', userData);

      if (response.data.success) {
        dispatch({ type: 'ADD_USER', payload: response.data.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true, data: response.data.data };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.put(`/api/admin/users/${userId}`, userData);

      if (response.data.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true, data: response.data.data };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const approveUser = async (userId) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/approve`);

      if (response.data.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.data });
        return { success: true, data: response.data.data };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const rejectUser = async (userId, reason) => {
    try {
      const response = await api.post(`/api/admin/users/${userId}/reject`, { reason });

      if (response.data.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.data });
        return { success: true, data: response.data.data };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await api.delete(`/api/admin/users/${userId}`);

      if (response.data.success) {
        dispatch({ type: 'DELETE_USER', payload: userId });
        return { success: true };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearUsers = () => {
    dispatch({ type: 'CLEAR_USERS' });
  };

  const contextValue = {
    ...state,
    fetchUsers,
    createUser,
    updateUser,
    approveUser,
    rejectUser,
    deleteUser,
    setFilters,
    clearUsers,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };