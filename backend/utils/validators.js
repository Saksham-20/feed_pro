// backend/utils/validators.js - Utility validation functions
const validator = require('validator');

class Validators {
  // Email validation
  static isValidEmail(email) {
    return validator.isEmail(email);
  }

  // Phone validation (Indian format)
  static isValidIndianPhone(phone) {
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // GST number validation
  static isValidGST(gstNumber) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  // PAN number validation
  static isValidPAN(panNumber) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(panNumber);
  }

  // Aadhaar number validation
  static isValidAadhaar(aadhaarNumber) {
    const aadhaarRegex = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;
    return aadhaarRegex.test(aadhaarNumber.replace(/\s+/g, ''));
  }

  // Password strength validation
  static validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // Calculate password strength score
  static calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 1; // Sequential characters
    
    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return {
      score: Math.max(0, score),
      level: strength[Math.min(score, 5)]
    };
  }

  // URL validation
  static isValidURL(url) {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true
    });
  }

  // File type validation
  static isValidFileType(fileName, allowedTypes = []) {
    if (allowedTypes.length === 0) return true;
    
    const extension = fileName.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
  }

  // File size validation (in bytes)
  static isValidFileSize(fileSize, maxSize = 10 * 1024 * 1024) { // 10MB default
    return fileSize <= maxSize;
  }

  // Date validation
  static isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // Future date validation
  static isFutureDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date > now;
  }

  // Past date validation
  static isPastDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  }

  // Age validation
  static validateAge(dateOfBirth, minAge = 18, maxAge = 100) {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    const age = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
    
    return {
      age,
      isValid: age >= minAge && age <= maxAge,
      message: age < minAge ? `Must be at least ${minAge} years old` : 
               age > maxAge ? `Must be less than ${maxAge} years old` : 'Valid age'
    };
  }

  // Credit card validation
  static isValidCreditCard(cardNumber) {
    return validator.isCreditCard(cardNumber.replace(/\s+/g, ''));
  }

  // Indian postal code validation
  static isValidPinCode(pinCode) {
    const pinRegex = /^[1-9]{1}[0-9]{2}[0-9]{3}$/;
    return pinRegex.test(pinCode);
  }

  // Decimal validation
  static isValidDecimal(value, precision = 2) {
    const regex = new RegExp(`^\\d+(\\.\\d{1,${precision}})?$`);
    return regex.test(value.toString());
  }

  // JSON validation
  static isValidJSON(jsonString) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Username validation
  static validateUsername(username) {
    const minLength = 3;
    const maxLength = 20;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    
    const errors = [];
    if (username.length < minLength) {
      errors.push(`Username must be at least ${minLength} characters long`);
    }
    if (username.length > maxLength) {
      errors.push(`Username must be no more than ${maxLength} characters long`);
    }
    if (!usernameRegex.test(username)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }
    if (username.startsWith('-') || username.startsWith('_')) {
      errors.push('Username cannot start with a hyphen or underscore');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Business validation helpers
  static validateOrderItems(items) {
    const errors = [];
    
    if (!Array.isArray(items) || items.length === 0) {
      errors.push('At least one item is required');
      return { isValid: false, errors };
    }

    items.forEach((item, index) => {
      if (!item.name || typeof item.name !== 'string') {
        errors.push(`Item ${index + 1}: Name is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      if (!item.unit_price || item.unit_price < 0) {
        errors.push(`Item ${index + 1}: Valid unit price is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAddress(address) {
    const errors = [];
    const requiredFields = ['street', 'city', 'state', 'postal_code', 'country'];
    
    requiredFields.forEach(field => {
      if (!address[field] || address[field].trim() === '') {
        errors.push(`${field.replace('_', ' ')} is required`);
      }
    });

    if (address.postal_code && !this.isValidPinCode(address.postal_code)) {
      errors.push('Invalid postal code format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitization helpers
  static sanitizeString(str) {
    return validator.escape(str.trim());
  }

  static sanitizeHTML(html) {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '');
  }

  // Rate limiting validation
  static validateRateLimit(attempts, maxAttempts = 5, timeWindow = 15 * 60 * 1000) { // 15 minutes
    return attempts < maxAttempts;
  }
}

module.exports = Validators;