// src/config/ApiConfig.js
const API_CONFIG = {
  development: {
    BASE_URL: 'http://localhost:3000',
    API_VERSION: 'v1',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
  staging: {
    BASE_URL: 'https://staging-api.yourdomain.com',
    API_VERSION: 'v1',
    TIMEOUT: 15000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
  production: {
    BASE_URL: 'https://api.yourdomain.com',
    API_VERSION: 'v1',
    TIMEOUT: 15000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 1500,
  },
};

const ENV = __DEV__ ? 'development' : 'production';

export const apiConfig = {
  ...API_CONFIG[ENV],
  
  // Request configuration
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Error handling
  errorCodes: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
  },
  
  // Cache configuration
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 50, // Maximum cached requests
  },
  
  // Upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    uploadEndpoint: '/api/upload',
  },
};

export default apiConfig;
