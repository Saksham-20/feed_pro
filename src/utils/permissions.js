import { USER_ROLES } from './constants';

export const permissions = {
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  APPROVE_USERS: 'approve_users',
  VIEW_ALL_DATA: 'view_all_data',
  SYSTEM_SETTINGS: 'system_settings',
  
  // Sales permissions
  MANAGE_CUSTOMERS: 'manage_customers',
  CREATE_ORDERS: 'create_orders',
  VIEW_SALES_DATA: 'view_sales_data',
  
  // Marketing permissions
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  MANAGE_LEADS: 'manage_leads',
  VIEW_MARKETING_DATA: 'view_marketing_data',
  
  // Office permissions
  MANAGE_TASKS: 'manage_tasks',
  MANAGE_DOCUMENTS: 'manage_documents',
  GENERATE_REPORTS: 'generate_reports',
  
  // Client permissions
  CREATE_CLIENT_ORDERS: 'create_client_orders',
  VIEW_CLIENT_DATA: 'view_client_data',
  SEND_FEEDBACK: 'send_feedback',
};

const rolePermissions = {
  [USER_ROLES.ADMIN]: [
    permissions.MANAGE_USERS,
    permissions.APPROVE_USERS,
    permissions.VIEW_ALL_DATA,
    permissions.SYSTEM_SETTINGS,
    permissions.MANAGE_CUSTOMERS,
    permissions.CREATE_ORDERS,
    permissions.VIEW_SALES_DATA,
    permissions.MANAGE_CAMPAIGNS,
    permissions.MANAGE_LEADS,
    permissions.VIEW_MARKETING_DATA,
    permissions.MANAGE_TASKS,
    permissions.MANAGE_DOCUMENTS,
    permissions.GENERATE_REPORTS,
  ],
  
  [USER_ROLES.SALES_PURCHASE]: [
    permissions.MANAGE_CUSTOMERS,
    permissions.CREATE_ORDERS,
    permissions.VIEW_SALES_DATA,
  ],
  
  [USER_ROLES.MARKETING]: [
    permissions.MANAGE_CAMPAIGNS,
    permissions.MANAGE_LEADS,
    permissions.VIEW_MARKETING_DATA,
  ],
  
  [USER_ROLES.OFFICE]: [
    permissions.MANAGE_TASKS,
    permissions.MANAGE_DOCUMENTS,
    permissions.GENERATE_REPORTS,
  ],
  
  [USER_ROLES.CLIENT]: [
    permissions.CREATE_CLIENT_ORDERS,
    permissions.VIEW_CLIENT_DATA,
    permissions.SEND_FEEDBACK,
  ],
};

export const hasPermission = (userRole, permission) => {
  return rolePermissions[userRole]?.includes(permission) || false;
};

export const hasAnyPermission = (userRole, permissionsList) => {
  return permissionsList.some(permission => hasPermission(userRole, permission));
};

export const getUserPermissions = (userRole) => {
  return rolePermissions[userRole] || [];
};

export const canAccessRoute = (userRole, routePermissions) => {
  if (!routePermissions || routePermissions.length === 0) {
    return true; // Public route
  }
  
  return hasAnyPermission(userRole, routePermissions);
};

// src/config/ApiConfig.js - Updated API configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://192.168.29.161:3000' : 'https://your-production-api.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  PROFILE: '/api/auth/profile',
  CHANGE_PASSWORD: '/api/auth/change-password',
  
  // Admin
  ADMIN_DASHBOARD: '/api/admin/dashboard/overview',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_PENDING_APPROVALS: '/api/admin/pending-approvals',
  ADMIN_APPROVE_USER: '/api/admin/approve-user',
  ADMIN_REJECT_USER: '/api/admin/reject-user',
  ADMIN_FEEDBACK: '/api/admin/feedback',
  
  // Client
  CLIENT_ORDERS: '/api/client/orders',
  CLIENT_BILLS: '/api/client/bills',
  CLIENT_FEEDBACK: '/api/client/feedback',
  
  // Sales Employee
  SALES_DASHBOARD: '/api/employees/sales/dashboard',
  SALES_CUSTOMERS: '/api/employees/sales/customers',
  SALES_ORDERS: '/api/employees/sales/orders',
  
  // Marketing Employee
  MARKETING_DASHBOARD: '/api/employees/marketing/dashboard',
  MARKETING_CAMPAIGNS: '/api/employees/marketing/campaigns',
  MARKETING_LEADS: '/api/employees/marketing/leads',
  
  // Office Employee
  OFFICE_DASHBOARD: '/api/employees/office/dashboard',
  OFFICE_TASKS: '/api/employees/office/tasks',
  OFFICE_DOCUMENTS: '/api/employees/office/documents',
  
  // Shared
  NOTIFICATIONS: '/api/notifications',
  UPLOAD: '/api/upload',
  HEALTH: '/health',
  DOCS: '/api/docs',
};

// API response interceptor helpers
export const apiHelpers = {
  buildUrl: (endpoint, params = {}) => {
    let url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    return url;
  },
  
  getAuthHeaders: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      return {};
    }
  },
  
  handleApiError: (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return { message: 'Session expired. Please login again.', shouldLogout: true };
        case 403:
          return { message: 'You do not have permission to perform this action.' };
        case 404:
          return { message: 'The requested resource was not found.' };
        case 422:
          return { message: data.message || 'Validation failed.', errors: data.errors };
        case 500:
          return { message: 'Server error. Please try again later.' };
        default:
          return { message: data.message || 'An unexpected error occurred.' };
      }
    } else if (error.request) {
      // Network error
      return { message: 'Network error. Please check your connection.' };
    } else {
      // Other error
      return { message: error.message || 'An unexpected error occurred.' };
    }
  },
};
