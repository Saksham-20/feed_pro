const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const sequelize = require('./database/connection');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Import models and set up associations
const User = require('./models/User');
const Order = require('./models/Order');
const Bill = require('./models/Bill');
const Campaign = require('./models/Campaign');
const Lead = require('./models/Lead');
const Task = require('./models/Task');
const Document = require('./models/Document');
const { FeedbackThread, FeedbackMessage } = require('./models/FeedbackThread');

// Set up model associations
require('./models/associations');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin/dashboard');
const adminFeedbackRoutes = require('./routes/admin/feedback');
const clientOrderRoutes = require('./routes/client/orders');
const clientFeedbackRoutes = require('./routes/client/feedback');
const salesRoutes = require('./routes/employees/sales');
const marketingRoutes = require('./routes/employees/marketing');
const officeRoutes = require('./routes/employees/office');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/dashboard', adminRoutes);
app.use('/api/admin/feedback', adminFeedbackRoutes);
app.use('/api/client/orders', clientOrderRoutes);
app.use('/api/client/feedback', clientFeedbackRoutes);
app.use('/api/employees/sales', salesRoutes);
app.use('/api/employees/marketing', marketingRoutes);
app.use('/api/employees/office', officeRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    endpoint: req.originalUrl
  });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
