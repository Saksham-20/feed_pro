// backend/config/upload.js - Upload configuration
require('dotenv').config();
const path = require('path');

const uploadConfig = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'
  ],
  uploadDir: path.join(__dirname, '..', 'uploads'),
  categories: {
    documents: 'documents',
    images: 'images',
    bills: 'bills',
    orders: 'orders',
    general: 'general'
  }
};

module.exports = uploadConfig;