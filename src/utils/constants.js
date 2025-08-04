export const USER_ROLES = {
  CLIENT: 'client',
  SALES_PURCHASE: 'sales_purchase',
  MARKETING: 'marketing',
  OFFICE: 'office',
  ADMIN: 'admin',
};

export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
};

export const FEEDBACK_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const CAMPAIGN_TYPES = {
  FIELD: 'field',
  DIGITAL: 'digital',
  EMAIL: 'email',
  SMS: 'sms',
  SOCIAL: 'social',
};

export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CONVERTED: 'converted',
  LOST: 'lost',
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  
  // Client
  CLIENT_ORDERS: '/api/client/orders',
  CLIENT_BILLS: '/api/client/bills',
  CLIENT_FEEDBACK: '/api/client/feedback',
  
  // Admin
  ADMIN_DASHBOARD: '/api/admin/dashboard/overview',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_FEEDBACK: '/api/admin/feedback',
  ADMIN_ANALYTICS: '/api/admin/analytics',
  
  // Employees
  EMPLOYEE_SALES: '/api/employees/sales',
  EMPLOYEE_MARKETING: '/api/employees/marketing',
  EMPLOYEE_OFFICE: '/api/employees/office',
};

export const STORAGE_KEYS = {
  USER: 'user',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  SYNC_QUEUE: 'syncQueue',
  PREFERENCES: 'preferences',
  CACHE_PREFIX: 'cache_',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  REGISTRATION_SUCCESS: 'Registration successful',
  ORDER_CREATED: 'Order created successfully',
  FEEDBACK_SENT: 'Feedback sent successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
};