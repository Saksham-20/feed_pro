// backend/routes/admin/analytics.js - Admin analytics routes
const express = require('express');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const analyticsService = require('../../services/analyticsService');
const { query, validationResult } = require('express-validator');
const router = express.Router();

// Apply authentication and admin authorization
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Validation middleware for date range
const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required')
];

// GET: Dashboard analytics overview
router.get('/dashboard', dateRangeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const analytics = await analyticsService.getDashboardAnalytics(
      req.user.id, 
      req.user.role, 
      dateRange
    );

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Sales analytics
router.get('/sales', dateRangeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const analytics = await analyticsService.getSalesAnalytics(
      req.user.id, 
      req.user.role, 
      dateRange
    );

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Marketing analytics
router.get('/marketing', dateRangeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const analytics = await analyticsService.getMarketingAnalytics(
      req.user.id, 
      req.user.role, 
      dateRange
    );

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Marketing analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch marketing analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Financial analytics
router.get('/financial', dateRangeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const analytics = await analyticsService.getFinancialAnalytics(dateRange);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: User analytics
router.get('/users', dateRangeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate, role, status } = req.query;
    const { Op } = require('sequelize');
    const User = require('../../models/User');

    const where = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [userStats, roleDistribution, statusDistribution, monthlySignups] = await Promise.all([
      User.count({ where }),
      User.findAll({
        attributes: [
          'role',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where,
        group: ['role'],
        raw: true
      }),
      User.findAll({
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where,
        group: ['status'],
        raw: true
      }),
      User.findAll({
        attributes: [
          [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('created_at'), '%Y-%m'), 'month'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where,
        group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('created_at'), '%Y-%m')],
        order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('created_at'), '%Y-%m'), 'ASC']],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: userStats,
        roleDistribution: roleDistribution.reduce((acc, item) => {
          acc[item.role] = parseInt(item.count);
          return acc;
        }, {}),
        statusDistribution: statusDistribution.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        monthlySignups: monthlySignups.map(item => ({
          month: item.month,
          count: parseInt(item.count)
        }))
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { Op } = require('sequelize');
    const Order = require('../../models/Order');
    const Bill = require('../../models/Bill');
    const { FeedbackThread } = require('../../models/FeedbackThread');
    const Task = require('../../models/Task');

    const dateFilter = {
      created_at: { [Op.gte]: startDate }
    };

    // Performance metrics
    const [
      ordersProcessed,
      averageOrderValue,
      billsGenerated,
      collectionEfficiency,
      feedbackResolutionRate,
      taskCompletionRate,
      customerRetentionRate
    ] = await Promise.all([
      Order.count({ where: dateFilter }),
      Order.findOne({
        attributes: [[require('sequelize').fn('AVG', require('sequelize').col('total_amount')), 'avg']],
        where: dateFilter,
        raw: true
      }),
      Bill.count({ where: dateFilter }),
      this.calculateCollectionEfficiency(startDate),
      this.calculateFeedbackResolutionRate(startDate),
      this.calculateTaskCompletionRate(startDate),
      this.calculateCustomerRetentionRate(startDate, daysBack)
    ]);

    res.json({
      success: true,
      data: {
        period: `${daysBack} days`,
        metrics: {
          ordersProcessed,
          averageOrderValue: parseFloat(averageOrderValue?.avg) || 0,
          billsGenerated,
          collectionEfficiency,
          feedbackResolutionRate,
          taskCompletionRate,
          customerRetentionRate
        }
      }
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Export analytics data
router.get('/export', dateRangeValidation, async (req, res) => {
  try {
    const { format = 'json', type = 'dashboard' } = req.query;
    const { startDate, endDate } = req.query;
    
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    
    let data;
    
    switch (type) {
      case 'sales':
        data = await analyticsService.getSalesAnalytics(req.user.id, req.user.role, dateRange);
        break;
      case 'marketing':
        data = await analyticsService.getMarketingAnalytics(req.user.id, req.user.role, dateRange);
        break;
      case 'financial':
        data = await analyticsService.getFinancialAnalytics(dateRange);
        break;
      default:
        data = await analyticsService.getDashboardAnalytics(req.user.id, req.user.role, dateRange);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = this.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics.csv"`);
      res.send(csv);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics.json"`);
      res.json({
        success: true,
        data,
        exportDate: new Date().toISOString(),
        type,
        dateRange
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper methods
async function calculateCollectionEfficiency(startDate) {
  const Bill = require('../../models/Bill');
  const { Op } = require('sequelize');
  
  const [totalBills, paidBills] = await Promise.all([
    Bill.sum('total_amount', {
      where: { created_at: { [Op.gte]: startDate } }
    }),
    Bill.sum('total_amount', {
      where: {
        created_at: { [Op.gte]: startDate },
        status: 'paid'
      }
    })
  ]);
  
  return totalBills > 0 ? ((paidBills || 0) / totalBills * 100).toFixed(2) : 0;
}

async function calculateFeedbackResolutionRate(startDate) {
  const { FeedbackThread } = require('../../models/FeedbackThread');
  const { Op } = require('sequelize');
  
  const [totalFeedback, resolvedFeedback] = await Promise.all([
    FeedbackThread.count({
      where: { created_at: { [Op.gte]: startDate } }
    }),
    FeedbackThread.count({
      where: {
        created_at: { [Op.gte]: startDate },
        status: { [Op.in]: ['resolved', 'closed'] }
      }
    })
  ]);
  
  return totalFeedback > 0 ? (resolvedFeedback / totalFeedback * 100).toFixed(2) : 0;
}

async function calculateTaskCompletionRate(startDate) {
  const Task = require('../../models/Task');
  const { Op } = require('sequelize');
  
  const [totalTasks, completedTasks] = await Promise.all([
    Task.count({
      where: { created_at: { [Op.gte]: startDate } }
    }),
    Task.count({
      where: {
        created_at: { [Op.gte]: startDate },
        status: 'completed'
      }
    })
  ]);
  
  return totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;
}

async function calculateCustomerRetentionRate(startDate, daysBack) {
  const Order = require('../../models/Order');
  const { Op } = require('sequelize');
  
  // Get unique customers who placed orders in the period
  const customersInPeriod = await Order.findAll({
    attributes: ['client_id'],
    where: { created_at: { [Op.gte]: startDate } },
    group: ['client_id'],
    raw: true
  });
  
  // Get customers who placed orders before the period
  const previousPeriodStart = new Date(startDate);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - daysBack);
  
  const previousCustomers = await Order.findAll({
    attributes: ['client_id'],
    where: {
      created_at: {
        [Op.between]: [previousPeriodStart, startDate]
      }
    },
    group: ['client_id'],
    raw: true
  });
  
  if (previousCustomers.length === 0) return 0;
  
  // Find returning customers
  const currentCustomerIds = customersInPeriod.map(c => c.client_id);
  const previousCustomerIds = previousCustomers.map(c => c.client_id);
  const returningCustomers = currentCustomerIds.filter(id => 
    previousCustomerIds.includes(id)
  );
  
  return (returningCustomers.length / previousCustomers.length * 100).toFixed(2);
}

// Convert data to CSV format
function convertToCSV(data) {
  // This is a simplified CSV conversion
  // In production, use a proper CSV library like csv-stringify
  const flatten = (obj, prefix = '') => {
    let result = {};
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flatten(obj[key], `${prefix}${key}_`));
      } else {
        result[`${prefix}${key}`] = obj[key];
      }
    }
    return result;
  };
  
  const flatData = flatten(data);
  const headers = Object.keys(flatData).join(',');
  const values = Object.values(flatData).map(v => 
    typeof v === 'string' ? `"${v}"` : v
  ).join(',');
  
  return `${headers}\n${values}`;
}

module.exports = router;