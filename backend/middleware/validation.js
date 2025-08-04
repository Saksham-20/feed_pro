// backend/middleware/validation.js - Validation middleware
const { body, param, query } = require('express-validator');

// Auth validation
const registerValidation = [
  body('fullname').notEmpty().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('role').optional().isIn(['client', 'sales_purchase', 'marketing', 'office', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Order validation
const orderValidation = [
  body('client_id').optional().isInt({ min: 1 }).withMessage('Valid client ID required'),
  body('products').isArray({ min: 1 }).withMessage('At least one product is required'),
  body('products.*.name').notEmpty().trim().withMessage('Product name is required'),
  body('products.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
  body('products.*.unit_price').isFloat({ min: 0 }).withMessage('Valid unit price required'),
  body('delivery_date').optional().isISO8601().withMessage('Valid delivery date required'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long')
];

// Customer validation  
const customerValidation = [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }).withMessage('Customer name must be 2-100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address too long'),
  body('company').optional().trim().isLength({ max: 100 }).withMessage('Company name too long')
];

// Bill validation
const billValidation = [
  body('order_id').optional().isInt({ min: 1 }).withMessage('Valid order ID required'),
  body('client_id').optional().isInt({ min: 1 }).withMessage('Valid client ID required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').notEmpty().trim().withMessage('Item description is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Valid unit price required'),
  body('tax_amount').optional().isFloat({ min: 0 }).withMessage('Valid tax amount required'),
  body('discount_amount').optional().isFloat({ min: 0 }).withMessage('Valid discount amount required'),
  body('due_date').optional().isISO8601().withMessage('Valid due date required')
];

// Feedback validation
const feedbackValidation = [
  body('subject').notEmpty().trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be 5-200 characters'),
  body('message').notEmpty().trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
  body('category').optional().isIn(['general', 'complaint', 'suggestion', 'support']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
];

// Campaign validation
const campaignValidation = [
  body('name').notEmpty().trim().isLength({ min: 3, max: 100 }).withMessage('Campaign name must be 3-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Valid budget required'),
  body('start_date').optional().isISO8601().withMessage('Valid start date required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date required'),
  body('target_audience').optional().trim().isLength({ max: 500 }).withMessage('Target audience description too long')
];

// Lead validation
const leadValidation = [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }).withMessage('Lead name must be 2-100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('company').optional().trim().isLength({ max: 100 }).withMessage('Company name too long'),
  body('source').optional().isIn(['website', 'social_media', 'referral', 'cold_call', 'email', 'other']).withMessage('Invalid source'),
  body('status').optional().isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long')
];

// Task validation
const taskValidation = [
  body('title').notEmpty().trim().isLength({ min: 3, max: 200 }).withMessage('Task title must be 3-200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('due_date').optional().isISO8601().withMessage('Valid due date required'),
  body('assigned_to').optional().isInt({ min: 1 }).withMessage('Valid assignee ID required'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category too long')
];

// Document validation
const documentValidation = [
  body('title').notEmpty().trim().isLength({ min: 3, max: 200 }).withMessage('Document title must be 3-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('category').optional().isIn(['contract', 'invoice', 'report', 'policy', 'other']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('is_confidential').optional().isBoolean().withMessage('Confidential flag must be boolean')
];

// Generic validations
const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID required')
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Valid page number required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Valid limit required (1-100)'),
  query('sort').optional().isIn(['asc', 'desc']).withMessage('Sort must be asc or desc'),
  query('sortBy').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Sort field required')
];

const searchValidation = [
  query('q').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
  query('category').optional().trim().isLength({ max: 50 }).withMessage('Category too long'),
  query('status').optional().trim().isLength({ max: 50 }).withMessage('Status too long'),
  query('from_date').optional().isISO8601().withMessage('Valid from date required'),
  query('to_date').optional().isISO8601().withMessage('Valid to date required')
];

module.exports = {
  registerValidation,
  loginValidation,
  orderValidation,
  customerValidation,
  billValidation,
  feedbackValidation,
  campaignValidation,
  leadValidation,
  taskValidation,
  documentValidation,
  idValidation,
  paginationValidation,
  searchValidation
};