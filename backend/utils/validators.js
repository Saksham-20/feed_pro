// backend/utils/validators.js - Custom validators
const validator = require('validator');

class Validators {
  // Phone number validation
  static isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  // Strong password validation
  static isStrongPassword(password) {
    return password.length >= 8 && 
           /[a-z]/.test(password) && 
           /[A-Z]/.test(password) && 
           /\d/.test(password);
  }

  // Indian GST number validation
  static isValidGST(gst) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  }

  // Indian PIN code validation
  static isValidPincode(pincode) {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  }

  // File type validation
  static isValidFileType(filename, allowedTypes) {
    const ext = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes(ext);
  }

  // Date range validation
  static isValidDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  }

  // Custom business rules
  static isValidOrderQuantity(quantity) {
    return quantity > 0 && quantity <= 10000;
  }

  static isValidDiscount(discount) {
    return discount >= 0 && discount <= 100;
  }

  static isValidCreditLimit(limit) {
    return limit >= 0 && limit <= 10000000; // 1 crore max
  }
}

module.exports = Validators;
