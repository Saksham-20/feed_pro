// backend/middleware/validation.js - Validation middleware
const { body, param, query } = require('express-validator');

// Auth validations
const registerValidation = [
  body('fullname')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2-100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required'),
  
  body('phone')
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('role')
    .optional()
    .isIn(['client', 'sales_purchase', 'marketing', 'office'])
    .withMessage('Invalid role'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name too long'),
  
  body('employee_id')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Employee ID too long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Order validations
const orderValidation = [
  body('product_name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name is required'),
  
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  
  body('unit_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be non-negative'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0-100%'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description too long')
];

// Customer validations
const customerValidation = [
  body('customerName')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Customer name is required'),
  
  body('phoneNumber')
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email address required'),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5-500 characters')
];

// Feedback validations
const feedbackValidation = [
  body('subject')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Subject must be between 3-255 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10-5000 characters'),
  
  body('category')
    .optional()
    .isIn(['general', 'complaint', 'suggestion', 'support'])
    .withMessage('Invalid category'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority')
];

// Campaign validations
const campaignValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Campaign name must be between 3-255 characters'),
  
  body('type')
    .isIn(['field', 'digital', 'email', 'sms', 'social'])
    .withMessage('Invalid campaign type'),
  
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be non-negative'),
  
  body('start_date')
    .optional()
    .isDate()
    .withMessage('Invalid start date'),
  
  body('end_date')
    .optional()
    .isDate()
    .withMessage('Invalid end date')
];

// Lead validations
const leadValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Lead name is required'),
  
  body('contact')
    .matches(/^\d{10,15}$/)
    .withMessage('Valid phone number required'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email address required'),
  
  body('source')
    .optional()
    .isIn(['field', 'website', 'referral', 'social', 'email', 'phone'])
    .withMessage('Invalid lead source')
];

// Task validations
const taskValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Task title must be between 3-255 characters'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('due_date')
    .optional()
    .isDate()
    .withMessage('Invalid due date')
];

// Parameter validations
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID required')
];

// Query validations
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1-100')
];

module.exports = {
  registerValidation,
  loginValidation,
  orderValidation,
  customerValidation,
  feedbackValidation,
  campaignValidation,
  leadValidation,
  taskValidation,
  idValidation,
  paginationValidation
};