import React, { createContext, useContext, useReducer } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const FeedbackContext = createContext({});

const initialState = {
  threads: [],
  messages: {},
  loading: false,
  error: null,
  activeThread: null,
};

const feedbackReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_THREADS':
      return {
        ...state,
        threads: action.payload,
        loading: false,
        error: null,
      };
    
    case 'ADD_THREAD':
      return {
        ...state,
        threads: [action.payload, ...state.threads],
      };
    
    case 'UPDATE_THREAD':
      return {
        ...state,
        threads: state.threads.map(thread =>
          thread.thread_id === action.payload.thread_id ? action.payload : thread
        ),
      };
    
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.threadId]: action.payload.messages,
        },
      };
    
    case 'ADD_MESSAGE':
      const { threadId, message } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [threadId]: [...(state.messages[threadId] || []), message],
        },
      };
    
    case 'SET_ACTIVE_THREAD':
      return { ...state, activeThread: action.payload };
    
    case 'CLEAR_FEEDBACK':
      return initialState;
    
    default:
      return state;
  }
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const FeedbackProvider = ({ children }) => {
  const [state, dispatch] = useReducer(feedbackReducer, initialState);
  const { user } = useAuth();

  const fetchThreads = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const endpoint = user?.role === 'admin' ? 
        '/api/admin/feedback' : 
        '/api/client/feedback';
      
      const response = await api.get(endpoint);

      if (response.data.success) {
        dispatch({ type: 'SET_THREADS', payload: response.data.data });
      }

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const createThread = async (threadData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/api/client/feedback', threadData);

      if (response.data.success) {
        dispatch({ type: 'ADD_THREAD', payload: response.data.data });
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true, data: response.data.data };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const fetchMessages = async (threadId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const endpoint = user?.role === 'admin' ? 
        `/api/admin/feedback/thread/${threadId}` : 
        `/api/client/feedback/thread/${threadId}`;
      
      const response = await api.get(endpoint);

      if (response.data.success) {
        dispatch({
          type: 'SET_MESSAGES',
          payload: {
            threadId,
            messages: response.data.data.messages,
          },
        });
        
        dispatch({
          type: 'UPDATE_THREAD',
          payload: response.data.data.thread,
        });
      }

      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const sendMessage = async (threadId, message) => {
    try {
      const endpoint = user?.role === 'admin' ? 
        `/api/admin/feedback/thread/${threadId}/reply` : 
        `/api/client/feedback/thread/${threadId}/message`;
      
      const response = await api.post(endpoint, { message });

      if (response.data.success) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            threadId,
            message: response.data.data,
          },
        });
        return { success: true, data: response.data.data };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateThreadStatus = async (threadId, status) => {
    try {
      const response = await api.patch(`/api/admin/feedback/thread/${threadId}/status`, {
        status,
      });

      if (response.data.success) {
        dispatch({ type: 'UPDATE_THREAD', payload: response.data.data });
        return { success: true };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const setActiveThread = (threadId) => {
    dispatch({ type: 'SET_ACTIVE_THREAD', payload: threadId });
  };

  const clearFeedback = () => {
    dispatch({ type: 'CLEAR_FEEDBACK' });
  };

  const contextValue = {
    ...state,
    fetchThreads,
    createThread,
    fetchMessages,
    sendMessage,
    updateThreadStatus,
    setActiveThread,
    clearFeedback,
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
    </FeedbackContext.Provider>
  );
};