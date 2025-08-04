export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

export const validateNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const validatePositiveNumber = (value) => {
  return validateNumber(value) && parseFloat(value) > 0;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateStrongPassword = (password) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
};

export const validateGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

export const validatePincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// Validation rules object for forms
export const validationRules = {
  required: (value) => validateRequired(value) || 'This field is required',
  email: (value) => !value || validateEmail(value) || 'Please enter a valid email',
  phone: (value) => !value || validatePhone(value) || 'Please enter a valid 10-digit phone number',
  number: (value) => !value || validateNumber(value) || 'Please enter a valid number',
  positiveNumber: (value) => !value || validatePositiveNumber(value) || 'Please enter a positive number',
  password: (value) => !value || validatePassword(value) || 'Password must be at least 6 characters',
  strongPassword: (value) => !value || validateStrongPassword(value) || 'Password must contain uppercase, lowercase, number and special character',
  url: (value) => !value || validateUrl(value) || 'Please enter a valid URL',
  date: (value) => !value || validateDate(value) || 'Please enter a valid date',
  gst: (value) => !value || validateGST(value) || 'Please enter a valid GST number',
  pincode: (value) => !value || validatePincode(value) || 'Please enter a valid PIN code',
};

// src/utils/permissions.js - Permission utilities
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
