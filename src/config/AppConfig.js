// src/config/AppConfig.js
const APP_CONFIG = {
  development: {
    APP_NAME: 'Business Hub Dev',
    LOG_LEVEL: 'debug',
    ENABLE_FLIPPER: true,
    ENABLE_REACTOTRON: true,
    API_TIMEOUT: 10000,
  },
  staging: {
    APP_NAME: 'Business Hub Staging',
    LOG_LEVEL: 'info',
    ENABLE_FLIPPER: false,
    ENABLE_REACTOTRON: false,
    API_TIMEOUT: 15000,
  },
  production: {
    APP_NAME: 'Business Hub',
    LOG_LEVEL: 'error',
    ENABLE_FLIPPER: false,
    ENABLE_REACTOTRON: false,
    API_TIMEOUT: 15000,
  },
};

const ENV = __DEV__ ? 'development' : 'production';

export const appConfig = {
  ...APP_CONFIG[ENV],
  
  // App information
  version: '1.0.0',
  buildNumber: '1',
  bundleId: 'com.businesshub.app',
  
  // Features flags
  features: {
    enablePushNotifications: true,
    enableBiometricAuth: true,
    enableOfflineMode: true,
    enableCrashReporting: !__DEV__,
    enableAnalytics: !__DEV__,
  },
  
  // UI Configuration
  ui: {
    defaultTheme: 'light',
    animationDuration: 300,
    toastDuration: 3000,
    debounceDelay: 500,
  },
  
  // Storage configuration
  storage: {
    encryptionKey: 'your-encryption-key-here',
    cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Push notification configuration
  notifications: {
    senderId: 'your-sender-id',
    projectId: 'your-project-id',
    channels: {
      default: {
        id: 'default',
        name: 'Default',
        description: 'Default notifications',
        importance: 'high',
      },
      orders: {
        id: 'orders',
        name: 'Orders',
        description: 'Order related notifications',
        importance: 'high',
      },
      marketing: {
        id: 'marketing',
        name: 'Marketing',
        description: 'Marketing and promotional notifications',
        importance: 'low',
      },
    },
  },
  
  // External services
  services: {
    crashlytics: {
      enabled: !__DEV__,
    },
    analytics: {
      enabled: !__DEV__,
      trackingId: 'your-tracking-id',
    },
    maps: {
      apiKey: 'your-maps-api-key',
    },
  },
};

export default appConfig;