// backend/utils/constants.js - Application constants
const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  SALES_PURCHASE: 'sales_purchase',
  MARKETING: 'marketing',
  OFFICE: 'office'
};

const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
};

const ORDER_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELIVERED: 'delivered'
};

const BILL_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  UPI: 'upi',
  CHEQUE: 'cheque',
  CARD: 'card'
};

const FEEDBACK_CATEGORIES = {
  GENERAL: 'general',
  COMPLAINT: 'complaint',
  SUGGESTION: 'suggestion',
  SUPPORT: 'support'
};

const FEEDBACK_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold'
};

const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CONVERTED: 'converted',
  LOST: 'lost'
};

const LEAD_SOURCES = {
  WEBSITE: 'website',
  SOCIAL_MEDIA: 'social_media',
  REFERRAL: 'referral',
  COLD_CALL: 'cold_call',
  EMAIL: 'email',
  EVENT: 'event',
  OTHER: 'other'
};

const CAMPAIGN_TYPES = {
  EMAIL: 'email',
  SOCIAL_MEDIA: 'social_media',
  PPC: 'ppc',
  CONTENT: 'content',
  EVENT: 'event',
  OTHER: 'other'
};

const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const DOCUMENT_CATEGORIES = {
  CONTRACT: 'contract',
  INVOICE: 'invoice',
  REPORT: 'report',
  POLICY: 'policy',
  MANUAL: 'manual',
  CERTIFICATE: 'certificate',
  OTHER: 'other'
};

const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  EXPIRED: 'expired'
};

const CUSTOMER_TYPES = {
  INDIVIDUAL: 'individual',
  BUSINESS: 'business'
};

const CUSTOMER_CATEGORIES = {
  REGULAR: 'regular',
  PREMIUM: 'premium',
  VIP: 'vip'
};

const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

const NOTIFICATION_CATEGORIES = {
  GENERAL: 'general',
  ORDERS: 'orders',
  BILLING: 'billing',
  SUPPORT: 'support',
  TASKS: 'tasks',
  LEADS: 'leads',
  MARKETING: 'marketing',
  ACCOUNT: 'account'
};

const FILE_UPLOAD_CATEGORIES = {
  DOCUMENTS: 'documents',
  IMAGES: 'images',
  BILLS: 'bills',
  ORDERS: 'orders',
  GENERAL: 'general'
};

const ALLOWED_FILE_TYPES = [
  'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 
  'xls', 'xlsx', 'txt', 'csv'
];

const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCESS_DENIED: 'Access denied. Insufficient permissions',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  USER_NOT_FOUND: 'User not found',
  EMAIL_EXISTS: 'Email already exists',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden action'
};

const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  BILL_GENERATED: 'Bill generated successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
  FEEDBACK_SUBMITTED: 'Feedback submitted successfully',
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  LEAD_CREATED: 'Lead created successfully',
  CAMPAIGN_CREATED: 'Campaign created successfully',
  DOCUMENT_UPLOADED: 'Document uploaded successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully'
};

const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  INDIAN: 'DD-MM-YYYY',
  US: 'MM/DD/YYYY',
  FULL: 'YYYY-MM-DD HH:mm:ss'
};

const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  NAME: 'Indian Rupee'
};

const EMAIL_TYPES = {
  WELCOME: 'welcome',
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password_reset',
  ORDER_CONFIRMATION: 'order_confirmation',
  BILL_NOTIFICATION: 'bill_notification',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  ACCOUNT_APPROVED: 'account_approved',
  TASK_ASSIGNMENT: 'task_assignment',
  FEEDBACK_RESPONSE: 'feedback_response'
};

const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_INDIAN: /^(?:\+91|91)?[6-9]\d{9}$/,
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  AADHAAR: /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/,
  PIN_CODE: /^[1-9]{1}[0-9]{2}[0-9]{3}$/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const BUSINESS_HOURS = {
  START: '09:00',
  END: '18:00',
  TIMEZONE: 'Asia/Kolkata'
};

const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  API_REQUESTS: 100,
  API_WINDOW: 60 * 1000, // 1 minute
  FILE_UPLOAD: 10,
  FILE_UPLOAD_WINDOW: 60 * 1000 // 1 minute
};

const CACHE_DURATIONS = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60 // 24 hours
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  ORDER_STATUS,
  BILL_STATUS,
  PAYMENT_METHODS,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUS,
  PRIORITY_LEVELS,
  TASK_STATUS,
  LEAD_STATUS,
  LEAD_SOURCES,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUS,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUS,
  CUSTOMER_TYPES,
  CUSTOMER_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  FILE_UPLOAD_CATEGORIES,
  ALLOWED_FILE_TYPES,
  HTTP_STATUS_CODES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION_DEFAULTS,
  DATE_FORMATS,
  CURRENCY,
  EMAIL_TYPES,
  REGEX_PATTERNS,
  INDIAN_STATES,
  BUSINESS_HOURS,
  RATE_LIMITS,
  CACHE_DURATIONS
};