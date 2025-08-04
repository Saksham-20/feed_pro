// backend/utils/helpers.js - Backend helper functions
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class Helpers {
  // Generate unique ID with prefix
  static generateId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}${timestamp}_${random}`;
  }

  // Generate random token
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash password
  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  // Compare password
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Format currency
  static formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Calculate percentage
  static calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  // Generate order number
  static generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${year}${month}${day}${random}`;
  }

  // Generate bill number
  static generateBillNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BILL${year}${month}${random}`;
  }

  // Sanitize input
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Remove sensitive fields
  static removeSensitiveFields(obj, fields = ['password', 'password_hash', 'token']) {
    const cloned = this.deepClone(obj);
    fields.forEach(field => {
      delete cloned[field];
    });
    return cloned;
  }

  // Pagination helper
  static getPagination(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return { limit: parseInt(limit), offset: parseInt(offset) };
  }

  // Calculate pagination info
  static getPaginationInfo(count, page, limit) {
    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      hasNext: page * limit < count,
      hasPrev: page > 1
    };
  }
}

module.exports = Helpers;