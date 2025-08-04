// backend/utils/helpers.js - Utility helper functions
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class Helpers {
  // Generate unique ID
  static generateUniqueId(prefix = '', length = 8) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 2 + length);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  }

  // Generate order number
  static generateOrderNumber() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}-${timestamp}${random}`;
  }

  // Generate bill number
  static generateBillNumber() {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `BILL-${year}${month}-${timestamp}${random}`;
  }

  // Format currency (Indian Rupees)
  static formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Format number with Indian numbering system
  static formatIndianNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number);
  }

  // Generate hash
  static generateHash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  // Generate random token
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Encrypt data
  static encrypt(text, secretKey) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  // Decrypt data
  static decrypt(encryptedData, secretKey) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Calculate file checksum
  static async calculateFileChecksum(filePath) {
    try {
      const data = await fs.readFile(filePath);
      return crypto.createHash('md5').update(data).digest('hex');
    } catch (error) {
      throw new Error(`Failed to calculate checksum: ${error.message}`);
    }
  }

  // Format date
  static formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');

    const formats = {
      'YYYY-MM-DD': `${year}-${month}-${day}`,
      'DD-MM-YYYY': `${day}-${month}-${year}`,
      'MM/DD/YYYY': `${month}/${day}/${year}`,
      'DD/MM/YYYY': `${day}/${month}/${year}`,
      'YYYY-MM-DD HH:mm:ss': `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
      'DD-MM-YYYY HH:mm': `${day}-${month}-${year} ${hours}:${minutes}`
    };

    return formats[format] || formats['YYYY-MM-DD'];
  }

  // Calculate age
  static calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Get file extension
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
  }

  // Get MIME type from extension
  static getMimeType(extension) {
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  // Format file size
  static formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Clean filename
  static cleanFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // Generate pagination info
  static getPaginationInfo(page, limit, total) {
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const totalItems = parseInt(total) || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const offset = (currentPage - 1) * itemsPerPage;
    
    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
      offset,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null
    };
  }

  // Slugify string
  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  // Capitalize first letter
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Title case
  static titleCase(str) {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Remove duplicates from array
  static removeDuplicates(arr, key = null) {
    if (key) {
      const seen = new Set();
      return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
    }
    return [...new Set(arr)];
  }

  // Group array by key
  static groupBy(arr, key) {
    return arr.reduce((groups, item) => {
      const value = item[key];
      groups[value] = groups[value] || [];
      groups[value].push(item);
      return groups;
    }, {});
  }

  // Sort array of objects
  static sortBy(arr, key, direction = 'asc') {
    return arr.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (direction === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  }

  // Calculate percentage
  static calculatePercentage(value, total, decimals = 2) {
    if (total === 0) return 0;
    return parseFloat(((value / total) * 100).toFixed(decimals));
  }

  // Generate random color
  static generateRandomColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0984E3', '#A29BFE', '#FD79A8'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate QR code data URL (basic implementation)
  static generateQRCodeData(text) {
    // This is a placeholder - in production, use a proper QR code library
    return `data:image/svg+xml;base64,${Buffer.from(`<svg>QR: ${text}</svg>`).toString('base64')}`;
  }

  // Calculate working days between dates
  static calculateWorkingDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    while (start <= end) {
      const dayOfWeek = start.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workingDays++;
      }
      start.setDate(start.getDate() + 1);
    }
    
    return workingDays;
  }

  // Get Indian financial year
  static getFinancialYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (month >= 3) { // April onwards
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  // Retry function with exponential backoff
  static async retry(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

module.exports = Helpers;