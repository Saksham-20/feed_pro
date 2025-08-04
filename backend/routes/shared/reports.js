// backend/routes/shared/reports.js - Shared reporting routes
const express = require('express');
const { Op } = require('sequelize');
const { authenticateToken } = require('../../middleware/auth');
const { query, validationResult } = require('express-validator');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Bill = require('../../models/Bill');
const Customer = require('../../models/Customer');
const Lead = require('../../models/Lead');
const Campaign = require('../../models/Campaign');
const Task = require('../../models/Task');
const { FeedbackThread } = require('../../models/FeedbackThread');
const analyticsService = require('../../services/analyticsService');
const Helpers = require('../../utils/helpers');
const router = express.Router();

// Apply authentication
router.use(authenticateToken);

// Validation middleware
const reportValidation = [
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required'),
  query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format'),
  query('type').optional().isIn(['sales', 'marketing', 'financial', 'operations', 'users']).withMessage('Invalid report type')
];

// Helper function to get user filter based on role
function getUserFilter(userId, userRole) {
  if (userRole === 'admin') {
    return {}; // Admin can see all data
  } else if (['sales_purchase', 'marketing', 'office'].includes(userRole)) {
    return { created_by: userId }; // Employees see their own data
  } else {
    return { client_id: userId }; // Clients see their own data
  }
}

// Helper function to get date range
function getDateRange(startDate, endDate) {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: start, endDate: end };
}

// GET: Sales report
router.get('/sales', reportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate, format = 'json' } = req.query;
    const { startDate: start, endDate: end } = getDateRange(startDate, endDate);
    const userFilter = getUserFilter(req.user.id, req.user.role);

    // Get sales data
    const [orders, bills, customers] = await Promise.all([
      Order.findAll({
        where: {
          created_at: { [Op.between]: [start, end] },
          ...userFilter
        },
        include: [
          { model: User, as: 'client', attributes: ['fullname', 'email'] },
          { model: User, as: 'creator', attributes: ['fullname'] }
        ],
        order: [['created_at', 'DESC']]
      }),
      Bill.findAll({
        where: {
          created_at: { [Op.between]: [start, end] },
          ...userFilter
        },
        include: [
          { model: User, as: 'client', attributes: ['fullname', 'email'] },
          { model: Order, as: 'order', attributes: ['order_number'] }
        ]
      }),
      Customer.findAll({
        where: {
          created_at: { [Op.between]: [start, end] },
          ...userFilter
        },
        attributes: ['id', 'name', 'email', 'company', 'total_spent', 'created_at']
      })
    ]);

    // Calculate summary metrics
    const totalOrders = orders.length;
    const totalRevenue = bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const newCustomers = customers.length;

    const reportData = {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        newCustomers,
        paidBills: bills.filter(b => b.status === 'paid').length,
        pendingBills: bills.filter(b => b.status === 'sent').length,
        overdueBills: bills.filter(b => b.status === 'overdue').length
      },
      ordersByStatus: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}),
      revenueByMonth: this.calculateMonthlyRevenue(bills),
      topCustomers: this.getTopCustomers(customers, bills),
      orders: orders.slice(0, 100), // Limit for performance
      bills: bills.slice(0, 100)
    };

    if (format === 'csv') {
      const csv = this.generateSalesCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Marketing report
router.get('/marketing', reportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate, format = 'json' } = req.query;
    const { startDate: start, endDate: end } = getDateRange(startDate, endDate);
    const userFilter = getUserFilter(req.user.id, req.user.role);

    // Get marketing data
    const [campaigns, leads] = await Promise.all([
      Campaign.findAll({
        where: {
          created_at: { [Op.between]: [start, end] },
          ...userFilter
        },
        include: [
          { model: User, as: 'creator', attributes: ['fullname'] }
        ]
      }),
      Lead.findAll({
        where: {
          created_at: { [Op.between]: [start, end] },
          ...userFilter
        },
        include: [
          { model: User, as: 'assignee', attributes: ['fullname'] },
          { model: Campaign, attributes: ['name'] }
        ]
      })
    ]);

    // Calculate metrics
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(2) : 0;
    const totalBudget = campaigns.reduce((sum, c) => sum + parseFloat(c.budget || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + parseFloat(c.spent_amount || 0), 0);

    const reportData = {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalCampaigns,
        activeCampaigns,
        totalLeads,
        convertedLeads,
        conversionRate,
        totalBudget,
        totalSpent,
        budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget * 100).toFixed(2) : 0
      },
      leadsByStatus: leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {}),
      leadsBySource: leads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {}),
      campaignPerformance: campaigns.map(campaign => ({
        name: campaign.name,
        status: campaign.status,
        budget: parseFloat(campaign.budget || 0),
        spent: parseFloat(campaign.spent_amount || 0),
        leads: leads.filter(l => l.campaign_id === campaign.id).length,
        conversions: leads.filter(l => l.campaign_id === campaign.id && l.status === 'converted').length
      })),
      campaigns: campaigns.slice(0, 50),
      leads: leads.slice(0, 100)
    };

    if (format === 'csv') {
      const csv = this.generateMarketingCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="marketing-report.csv"');
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Marketing report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate marketing report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Financial report
router.get('/financial', reportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate, format = 'json' } = req.query;
    const { startDate: start, endDate: end } = getDateRange(startDate, endDate);
    
    // Financial reports are typically admin-only, but we'll apply user filter if needed
    const userFilter = req.user.role === 'admin' ? {} : getUserFilter(req.user.id, req.user.role);

    const bills = await Bill.findAll({
      where: {
        created_at: { [Op.between]: [start, end] },
        ...userFilter
      },
      include: [
        { model: User, as: 'client', attributes: ['fullname', 'email'] },
        { model: Order, as: 'order', attributes: ['order_number'] }
      ]
    });

    // Calculate financial metrics
    const totalInvoiced = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const totalPaid = bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const totalPending = bills.filter(b => b.status === 'sent').reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const totalOverdue = bills.filter(b => b.status === 'overdue').reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced * 100).toFixed(2) : 0;

    const reportData = {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalInvoiced,
        totalPaid,
        totalPending,
        totalOverdue,
        collectionRate,
        billCount: bills.length,
        paidBillCount: bills.filter(b => b.status === 'paid').length,
        averageBillValue: bills.length > 0 ? totalInvoiced / bills.length : 0
      },
      billsByStatus: bills.reduce((acc, bill) => {
        acc[bill.status] = (acc[bill.status] || 0) + 1;
        return acc;
      }, {}),
      monthlyRevenue: this.calculateMonthlyRevenue(bills),
      agingReport: this.generateAgingReport(bills),
      topPayingCustomers: this.getTopPayingCustomers(bills),
      overdueBills: bills.filter(b => b.status === 'overdue').slice(0, 20),
      recentPayments: bills.filter(b => b.status === 'paid').slice(0, 20)
    };

    if (format === 'csv') {
      const csv = this.generateFinancialCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="financial-report.csv"');
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Operations report
router.get('/operations', reportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate, format = 'json' } = req.query;
    const { startDate: start, endDate: end } = getDateRange(startDate, endDate);
    const userFilter = getUserFilter(req.user.id, req.user.role);

    // Get operations data
    const [tasks, feedback, orders] = await Promise.all([
      Task.findAll({
        where: {
          created_at: { [Op.between]: [start, end] },
          ...userFilter
        },
        include: [
          { model: User, as: 'creator', attributes: ['fullname'] },
          { model: User, as: 'assignee', attributes: ['fullname'] }
        ]
      }),
      FeedbackThread.findAll({
        where: {
          created_at: { [Op.between]: [start, end] }
        },
        include: [
          { model: User, as: 'client', attributes: ['fullname', 'email'] }
        ]
      }),
      Order.findAll({
        where: {
          created_at: { [Op.between]: [start, end] },
          ...userFilter
        },
        attributes: ['id', 'status', 'delivery_date', 'created_at']
      })
    ]);

    // Calculate operations metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0;

    const totalFeedback = feedback.length;
    const resolvedFeedback = feedback.filter(f => f.status === 'resolved' || f.status === 'closed').length;
    const feedbackResolutionRate = totalFeedback > 0 ? (resolvedFeedback / totalFeedback * 100).toFixed(2) : 0;

    const onTimeDeliveries = orders.filter(o => 
      o.delivery_date && o.status === 'delivered' && 
      new Date(o.updated_at) <= new Date(o.delivery_date)
    ).length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const onTimeDeliveryRate = deliveredOrders > 0 ? (onTimeDeliveries / deliveredOrders * 100).toFixed(2) : 0;

    const reportData = {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalTasks,
        completedTasks,
        overdueTasks,
        taskCompletionRate,
        totalFeedback,
        resolvedFeedback,
        feedbackResolutionRate,
        onTimeDeliveryRate,
        averageTaskDuration: this.calculateAverageTaskDuration(tasks)
      },
      tasksByStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}),
      tasksByPriority: tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {}),
      feedbackByCategory: feedback.reduce((acc, fb) => {
        acc[fb.category] = (acc[fb.category] || 0) + 1;
        return acc;
      }, {}),
      feedbackByStatus: feedback.reduce((acc, fb) => {
        acc[fb.status] = (acc[fb.status] || 0) + 1;
        return acc;
      }, {}),
      ordersByStatus: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}),
      overdueTasks: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').slice(0, 20),
      pendingFeedback: feedback.filter(f => f.status === 'open' || f.status === 'in_progress').slice(0, 20)
    };

    if (format === 'csv') {
      const csv = this.generateOperationsCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="operations-report.csv"');
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Operations report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate operations report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Custom report
router.get('/custom', reportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      startDate, 
      endDate, 
      format = 'json',
      metrics = 'sales,marketing,financial',
      groupBy = 'month'
    } = req.query;

    const { startDate: start, endDate: end } = getDateRange(startDate, endDate);
    const requestedMetrics = metrics.split(',');
    
    const reportData = {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      generatedAt: new Date().toISOString(),
      requestedBy: req.user.fullname
    };

    // Fetch data based on requested metrics
    if (requestedMetrics.includes('sales')) {
      reportData.sales = await analyticsService.getSalesAnalytics(req.user.id, req.user.role, { startDate, endDate });
    }

    if (requestedMetrics.includes('marketing')) {
      reportData.marketing = await analyticsService.getMarketingAnalytics(req.user.id, req.user.role, { startDate, endDate });
    }

    if (requestedMetrics.includes('financial')) {
      reportData.financial = await analyticsService.getFinancialAnalytics({ startDate, endDate });
    }

    if (format === 'csv') {
      const csv = this.generateCustomCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="custom-report.csv"');
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Custom report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper methods for calculations
function calculateMonthlyRevenue(bills) {
  const monthlyData = {};
  
  bills.forEach(bill => {
    if (bill.status === 'paid') {
      const month = new Date(bill.created_at).toISOString().slice(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + parseFloat(bill.total_amount);
    }
  });

  return Object.keys(monthlyData)
    .sort()
    .map(month => ({
      month,
      revenue: monthlyData[month]
    }));
}

function getTopCustomers(customers, bills) {
  const customerSpending = {};
  
  bills.forEach(bill => {
    if (bill.status === 'paid' && bill.client) {
      const clientId = bill.client.id;
      if (!customerSpending[clientId]) {
        customerSpending[clientId] = {
          name: bill.client.fullname,
          email: bill.client.email,
          totalSpent: 0,
          orderCount: 0
        };
      }
      customerSpending[clientId].totalSpent += parseFloat(bill.total_amount);
      customerSpending[clientId].orderCount++;
    }
  });

  return Object.values(customerSpending)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);
}

function getTopPayingCustomers(bills) {
  const customerPayments = {};
  
  bills.forEach(bill => {
    if (bill.status === 'paid' && bill.client) {
      const clientId = bill.client.id;
      if (!customerPayments[clientId]) {
        customerPayments[clientId] = {
          name: bill.client.fullname,
          email: bill.client.email,
          totalPaid: 0,
          billCount: 0
        };
      }
      customerPayments[clientId].totalPaid += parseFloat(bill.total_amount);
      customerPayments[clientId].billCount++;
    }
  });

  return Object.values(customerPayments)
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, 10);
}

function generateAgingReport(bills) {
  const now = new Date();
  const aging = {
    current: 0, // 0-30 days
    days30: 0,  // 31-60 days
    days60: 0,  // 61-90 days
    days90: 0   // 90+ days
  };

  bills.forEach(bill => {
    if (bill.status === 'sent' || bill.status === 'overdue') {
      const daysDiff = Math.floor((now - new Date(bill.created_at)) / (1000 * 60 * 60 * 24));
      const amount = parseFloat(bill.total_amount);
      
      if (daysDiff <= 30) {
        aging.current += amount;
      } else if (daysDiff <= 60) {
        aging.days30 += amount;
      } else if (daysDiff <= 90) {
        aging.days60 += amount;
      } else {
        aging.days90 += amount;
      }
    }
  });

  return aging;
}

function calculateAverageTaskDuration(tasks) {
  const completedTasks = tasks.filter(t => t.status === 'completed' && t.completed_date);
  
  if (completedTasks.length === 0) return 0;
  
  const totalDuration = completedTasks.reduce((sum, task) => {
    const created = new Date(task.created_at);
    const completed = new Date(task.completed_date);
    return sum + (completed - created);
  }, 0);
  
  const averageMs = totalDuration / completedTasks.length;
  return Math.round(averageMs / (1000 * 60 * 60 * 24)); // Return in days
}

// CSV generation methods
function generateSalesCSV(data) {
  const headers = [
    'Metric', 'Value'
  ];
  
  const rows = [
    ['Total Orders', data.summary.totalOrders],
    ['Total Revenue', data.summary.totalRevenue],
    ['Average Order Value', data.summary.averageOrderValue],
    ['New Customers', data.summary.newCustomers],
    ['Paid Bills', data.summary.paidBills],
    ['Pending Bills', data.summary.pendingBills],
    ['Overdue Bills', data.summary.overdueBills]
  ];
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateMarketingCSV(data) {
  const headers = [
    'Metric', 'Value'
  ];
  
  const rows = [
    ['Total Campaigns', data.summary.totalCampaigns],
    ['Active Campaigns', data.summary.activeCampaigns],
    ['Total Leads', data.summary.totalLeads],
    ['Converted Leads', data.summary.convertedLeads],
    ['Conversion Rate', data.summary.conversionRate + '%'],
    ['Total Budget', data.summary.totalBudget],
    ['Total Spent', data.summary.totalSpent],
    ['Budget Utilization', data.summary.budgetUtilization + '%']
  ];
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateFinancialCSV(data) {
  const headers = [
    'Metric', 'Value'
  ];
  
  const rows = [
    ['Total Invoiced', data.summary.totalInvoiced],
    ['Total Paid', data.summary.totalPaid],
    ['Total Pending', data.summary.totalPending],
    ['Total Overdue', data.summary.totalOverdue],
    ['Collection Rate', data.summary.collectionRate + '%'],
    ['Bill Count', data.summary.billCount],
    ['Paid Bill Count', data.summary.paidBillCount],
    ['Average Bill Value', data.summary.averageBillValue]
  ];
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateOperationsCSV(data) {
  const headers = [
    'Metric', 'Value'
  ];
  
  const rows = [
    ['Total Tasks', data.summary.totalTasks],
    ['Completed Tasks', data.summary.completedTasks],
    ['Overdue Tasks', data.summary.overdueTasks],
    ['Task Completion Rate', data.summary.taskCompletionRate + '%'],
    ['Total Feedback', data.summary.totalFeedback],
    ['Resolved Feedback', data.summary.resolvedFeedback],
    ['Feedback Resolution Rate', data.summary.feedbackResolutionRate + '%'],
    ['On-time Delivery Rate', data.summary.onTimeDeliveryRate + '%']
  ];
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateCustomCSV(data) {
  // Simplified custom CSV generation
  const headers = ['Section', 'Metric', 'Value'];
  const rows = [];
  
  Object.keys(data).forEach(section => {
    if (typeof data[section] === 'object' && data[section].summary) {
      Object.entries(data[section].summary).forEach(([metric, value]) => {
        rows.push([section, metric, value]);
      });
    }
  });
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Attach helper functions to router for internal use
router.calculateMonthlyRevenue = calculateMonthlyRevenue;
router.getTopCustomers = getTopCustomers;
router.getTopPayingCustomers = getTopPayingCustomers;
router.generateAgingReport = generateAgingReport;
router.calculateAverageTaskDuration = calculateAverageTaskDuration;
router.generateSalesCSV = generateSalesCSV;
router.generateMarketingCSV = generateMarketingCSV;
router.generateFinancialCSV = generateFinancialCSV;
router.generateOperationsCSV = generateOperationsCSV;
router.generateCustomCSV = generateCustomCSV;

module.exports = router;