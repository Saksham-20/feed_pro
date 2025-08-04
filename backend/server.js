
// backend/server.js - Complete updated server file
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const sequelize = require('./database/connection');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'), 
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  app.use(morgan('dev'));
}

// Request ID middleware
app.use((req, res, next) => {
  req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

app.get('/health/detailed', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    const dbStats = await sequelize.query('SELECT 1+1 AS result');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'connected',
          responseTime: Date.now()
        },
        server: {
          status: 'running',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Import all models and set up associations
require('./models/associations');

// Import controllers
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');

// Import middleware
const { authenticateToken, authorizeRole } = require('./middleware/auth');
const { upload, handleUploadError } = require('./middleware/upload');
const {
  registerValidation,
  loginValidation,
  orderValidation,
  customerValidation,
  feedbackValidation,
  idValidation,
  paginationValidation
} = require('./middleware/validation');

// Import route modules
const adminDashboardRoutes = require('./routes/admin/dashboard');
const adminFeedbackRoutes = require('./routes/admin/feedback');
const clientOrderRoutes = require('./routes/client/orders');
const clientBillRoutes = require('./routes/client/bills');
const clientFeedbackRoutes = require('./routes/client/feedback');
const salesRoutes = require('./routes/employees/sales');
const marketingRoutes = require('./routes/employees/marketing');
const officeRoutes = require('./routes/employees/office');
const { router: notificationRoutes } = require('./routes/shared/notifications');

// Auth routes (using controllers)
app.post('/api/auth/register', registerValidation, authController.register);
app.post('/api/auth/login', loginValidation, authController.login);
app.post('/api/auth/refresh', authController.refreshToken);
app.get('/api/auth/profile', authenticateToken, authController.getProfile);
app.put('/api/auth/profile', authenticateToken, authController.updateProfile);
app.post('/api/auth/change-password', authenticateToken, authController.changePassword);

// Admin routes (using controllers and route modules)
app.get('/api/admin/dashboard/overview', 
  authenticateToken, 
  authorizeRole(['admin']), 
  adminController.getDashboardOverview
);
app.get('/api/admin/users', 
  authenticateToken, 
  authorizeRole(['admin']), 
  paginationValidation,
  adminController.getUsers
);
app.get('/api/admin/pending-approvals', 
  authenticateToken, 
  authorizeRole(['admin']), 
  adminController.getPendingApprovals
);
app.post('/api/admin/approve-user', 
  authenticateToken, 
  authorizeRole(['admin']), 
  adminController.approveUser
);
app.post('/api/admin/reject-user', 
  authenticateToken, 
  authorizeRole(['admin']), 
  adminController.rejectUser
);

// Mount route modules
app.use('/api/admin/feedback', adminFeedbackRoutes);
app.use('/api/client/orders', clientOrderRoutes);
app.use('/api/client/bills', clientBillRoutes);
app.use('/api/client/feedback', clientFeedbackRoutes);
app.use('/api/employees/sales', salesRoutes);
app.use('/api/employees/marketing', marketingRoutes);
app.use('/api/employees/office', officeRoutes);
app.use('/api/notifications', notificationRoutes);

// File upload endpoint
app.post('/api/upload', 
  authenticateToken,
  upload.array('files', 5),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path.replace(/\\/g, '/'), // Normalize path separators
        url: `/uploads/${req.body.category || 'general'}/${file.filename}`
      }));

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }
);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Business Management API',
    version: process.env.APP_VERSION || '1.0.0',
    description: 'Complete business management system API',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/refresh': 'Refresh access token',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile',
        'POST /api/auth/change-password': 'Change password'
      },
      admin: {
        'GET /api/admin/dashboard/overview': 'Get dashboard data',
        'GET /api/admin/users': 'Get all users',
        'GET /api/admin/pending-approvals': 'Get pending approvals',
        'POST /api/admin/approve-user': 'Approve user',
        'POST /api/admin/reject-user': 'Reject user'
      },
      client: {
        'GET /api/client/orders': 'Get client orders',
        'POST /api/client/orders': 'Create new order',
        'GET /api/client/bills': 'Get client bills',
        'GET /api/client/feedback': 'Get feedback threads'
      },
      employees: {
        'GET /api/employees/sales/dashboard': 'Sales dashboard',
        'GET /api/employees/marketing/dashboard': 'Marketing dashboard',
        'GET /api/employees/office/dashboard': 'Office dashboard'
      }
    }
  });
});

// Error handling middleware (must be last)
app.use(handleUploadError);
app.use(errorHandler);

// 404 handler (must be after all routes)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    endpoint: req.originalUrl,
    method: req.method,
    availableEndpoints: '/api/docs'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connection
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    }).catch(err => {
      console.error('Error closing database:', err);
      process.exit(1);
    });
  });
}

// Database connection and server start
const PORT = process.env.PORT || 3000;
let server;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false // Never drop tables in production
    });
    console.log('✅ Database synchronized successfully');
    
    // Start server
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Admin dashboard: http://localhost:${PORT}/api/admin/dashboard/overview`);
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;