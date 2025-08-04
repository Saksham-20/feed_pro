export const APP_CONFIG = {
  APP_NAME: 'Business Hub',
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
  
  // Environment
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
  
  // Feature flags
  FEATURES: {
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: true,
    ANALYTICS: false,
    CRASH_REPORTING: false,
  },
  
  // UI Configuration
  UI: {
    THEME: 'light',
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 500,
  },
  
  // Data Configuration
  DATA: {
    CACHE_TTL: 3600000, // 1 hour
    SYNC_INTERVAL: 30000, // 30 seconds
    MAX_RETRY_ATTEMPTS: 3,
    REQUEST_TIMEOUT: 30000,
  },
  
  // Validation Rules
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 6,
    PHONE_LENGTH: 10,
    NAME_MIN_LENGTH: 2,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  
  // File Upload
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
    IMAGE_QUALITY: 0.8,
  },
};