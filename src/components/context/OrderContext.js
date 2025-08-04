import React, { createContext, useContext, useReducer } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const OrderContext = createContext({});

const initialState = {
  orders: [],
  loading: false,
  error: null,
  filters: {
    status: 'all',
    search: '',
    page: 1,
    limit: 20,
  },
  pagination: {
    total: 0,
    totalPages: 0,
    currentPage: 1,
  },
};

const orderReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload.orders,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };
    
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
      };
    
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? action.payload : order
        ),
      };
    
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload),
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    
    case 'CLEAR_ORDERS':
      return initialState;
    
    default:
      return state;
  }
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const { user } = useAuth();

  const fetchOrders = async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const endpoint = user?.role === 'client' ? '/api/client/orders' : '/api/employees/sales/orders';
      const response = await api.get(endpoint, { params: { ...state.filters, ...filters } });

      if (response.data.success) {
        dispatch({
          type: 'SET_ORDERS',
          payload: {
            orders: response.data.data,
            pagination: response.data.pagination,
          },
        });
      }

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const createOrder = async (orderData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const endpoint = user?.role === 'client' ? '/api/client/orders' : '/api/employees/sales/orders';
      const response = await api.post(endpoint, orderData);

      if (response.data.success) {
        dispatch({ type: 'ADD_ORDER', payload: response.data.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true, data: response.data.data };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const updateOrder = async (orderId, orderData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const endpoint = user?.role === 'client' ? 
        `/api/client/orders/${orderId}` : 
        `/api/employees/sales/orders/${orderId}`;
      
      const response = await api.put(endpoint, orderData);

      if (response.data.success) {
        dispatch({ type: 'UPDATE_ORDER', payload: response.data.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true, data: response.data.data };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearOrders = () => {
    dispatch({ type: 'CLEAR_ORDERS' });
  };

  const contextValue = {
    ...state,
    fetchOrders,
    createOrder,
    updateOrder,
    setFilters,
    clearOrders,
  };

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};