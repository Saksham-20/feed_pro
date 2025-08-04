// backend/config/jwt.js - JWT configuration
require('dotenv').config();

const jwtConfig = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-this-in-production',
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  },
  reset: {
    secret: process.env.JWT_RESET_SECRET || 'your-super-secret-reset-key-change-this-in-production',
    expiresIn: process.env.JWT_RESET_EXPIRES || '1h'
  }
};

module.exports = jwtConfig;