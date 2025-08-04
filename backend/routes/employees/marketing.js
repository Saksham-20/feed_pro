// backend/routes/employees/marketing.js - Marketing employee routes
const express = require('express');
const { body, validationResult } = require('express-validator');
const Campaign = require('../../models/Campaign');
const Lead = require('../../models/Lead');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);
router.use(authorizeRole(['marketing', 'admin']));

// GET: Dashboard data for marketing employee
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Get marketing statistics
    const [
      activeCampaigns,
      totalLeads,
      monthlyLeads,
      convertedLeads,
      campaignBudget
    ] = await Promise.all([
      Campaign.count({
        where: {
          created_by: userId,
          status: 'active'
        }
      }),
      Lead.count({ where: { assigned_to: userId } }),
      Lead.count({
        where: {
          assigned_to: userId,
          created_at: { [Op.gte]: startOfMonth }
        }
      }),
      Lead.count({
        where: {
          assigned_to: userId,
          status: 'converted'
        }
      }),
      Campaign.sum('budget', {
        where: {
          created_by: userId,
          status: 'active'
        }
      })
    ]);

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Get recent activities
    const recentLeads = await Lead.findAll({
      where: { assigned_to: userId },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const dashboardData = {
      campaigns: {
        active: activeCampaigns || 0,
        completed: 12, // Mock data - you can calculate this
        leads: totalLeads || 0
      },
      leads: {
        total: totalLeads || 0,
        converted: convertedLeads || 0,
        pending: monthlyLeads || 0
      },
      territories: {
        assigned: 5, // Mock data
        covered: 4
      },
      performance: {
        thisMonth: conversionRate,
        target: 100
      },
      recentLeads,
      budget: campaignBudget || 0
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching marketing dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// GET: Get campaigns for marketing employee
router.get('/campaigns', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { created_by: req.user.id };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: campaigns } = await Campaign.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

// POST: Create new campaign
router.post('/campaigns', [
  body('name').trim().isLength({ min: 3 }).withMessage('Campaign name is required'),
  body('description').optional().trim(),
  body('type').isIn(['field', 'digital', 'email', 'sms', 'social']).withMessage('Invalid campaign type'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const campaignData = {
      ...req.body,
      created_by: req.user.id
    };

    const campaign = await Campaign.create(campaignData);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

// GET: Get leads for marketing employee
router.get('/leads', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, source } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { assigned_to: req.user.id };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (source && source !== 'all') {
      whereClause.source = source;
    }

    const { count, rows: leads } = await Lead.findAndCountAll({
      where: whereClause,
      include: [
        { model: Campaign, as: 'campaign', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: leads,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message
    });
  }
});

// POST: Create new lead
router.post('/leads', [
  body('name').trim().isLength({ min: 2 }).withMessage('Lead name is required'),
  body('contact').matches(/^\d{10,15}$/).withMessage('Valid phone number required'),
  body('email').optional().isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const leadData = {
      ...req.body,
      assigned_to: req.user.id
    };

    const lead = await Lead.create(leadData);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      error: error.message
    });
  }
});

module.exports = router;