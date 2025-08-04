// backend/controllers/employeeController.js - Employee controller
const { Op } = require('sequelize');
const User = require('../models/User');
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const Task = require('../models/Task');
const Document = require('../models/Document');
const { FeedbackThread } = require('../models/FeedbackThread');
const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const analyticsService = require('../services/analyticsService');

class EmployeeController {
  // Sales Employee Methods
  async getSalesDashboard(req, res) {
    try {
      const userId = req.user.id;
      const { dateRange } = req.query;

      const analytics = await analyticsService.getSalesAnalytics(userId, req.user.role, dateRange);

      // Get additional sales-specific data
      const [
        myCustomers,
        myOrders,
        monthlyTargets,
        recentActivities
      ] = await Promise.all([
        Customer.count({ where: { assigned_to: userId } }),
        Order.count({ where: { created_by: userId } }),
        this.getMonthlyTargets(userId),
        this.getRecentActivities(userId, 'sales')
      ]);

      res.json({
        success: true,
        data: {
          ...analytics,
          additionalStats: {
            myCustomers,
            myOrders,
            monthlyTargets,
            recentActivities
          }
        }
      });

    } catch (error) {
      console.error('Sales dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sales dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create customer
  async createCustomer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const customer = await Customer.create({
        ...req.body,
        assigned_to: req.user.id,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: { customer }
      });

    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get assigned customers
  async getMyCustomers(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, search, status } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { assigned_to: userId };
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { company: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (status) {
        where.status = status;
      }

      const { count, rows: customers } = await Customer.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Marketing Employee Methods
  async getMarketingDashboard(req, res) {
    try {
      const userId = req.user.id;
      const { dateRange } = req.query;

      const analytics = await analyticsService.getMarketingAnalytics(userId, req.user.role, dateRange);

      // Get additional marketing-specific data
      const [
        myCampaigns,
        myLeads,
        conversionRate,
        recentActivities
      ] = await Promise.all([
        Campaign.count({ where: { created_by: userId } }),
        Lead.count({ where: { assigned_to: userId } }),
        this.getConversionRate(userId),
        this.getRecentActivities(userId, 'marketing')
      ]);

      res.json({
        success: true,
        data: {
          ...analytics,
          additionalStats: {
            myCampaigns,
            myLeads,
            conversionRate,
            recentActivities
          }
        }
      });

    } catch (error) {
      console.error('Marketing dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch marketing dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create campaign
  async createCampaign(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const campaign = await Campaign.create({
        ...req.body,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: { campaign }
      });

    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create lead
  async createLead(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const lead = await Lead.create({
        ...req.body,
        assigned_to: req.user.id,
        created_by: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: { lead }
      });

    } catch (error) {
      console.error('Create lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create lead',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get assigned leads
  async getMyLeads(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, source } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { assigned_to: userId };
      
      if (status) where.status = status;
      if (source) where.source = source;

      const { count, rows: leads } = await Lead.findAndCountAll({
        where,
        include: [
          { model: Campaign, attributes: ['name'] },
          { model: User, as: 'creator', attributes: ['fullname'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          leads,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get leads error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leads',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Office Employee Methods
  async getOfficeDashboard(req, res) {
    try {
      const userId = req.user.id;

      // Get office statistics
      const [
        myTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
        myDocuments,
        recentActivities
      ] = await Promise.all([
        Task.count({
          where: {
            [Op.or]: [
              { created_by: userId },
              { assigned_to: userId }
            ]
          }
        }),
        Task.count({
          where: {
            [Op.or]: [
              { created_by: userId },
              { assigned_to: userId }
            ],
            status: 'pending'
          }
        }),
        Task.count({
          where: {
            [Op.or]: [
              { created_by: userId },
              { assigned_to: userId }
            ],
            status: 'completed'
          }
        }),
        Task.count({
          where: {
            [Op.or]: [
              { created_by: userId },
              { assigned_to: userId }
            ],
            due_date: { [Op.lt]: new Date() },
            status: { [Op.not]: 'completed' }
          }
        }),
        Document.count({ where: { uploaded_by: userId } }),
        this.getRecentActivities(userId, 'office')
      ]);

      res.json({
        success: true,
        data: {
          statistics: {
            myTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
            myDocuments
          },
          recentActivities
        }
      });

    } catch (error) {
      console.error('Office dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch office dashboard',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create task
  async createTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const task = await Task.create({
        ...req.body,
        created_by: req.user.id
      });

      // Notify assigned user if different from creator
      if (task.assigned_to && task.assigned_to !== req.user.id) {
        const assignedUser = await User.findByPk(task.assigned_to);
        if (assignedUser) {
          await notificationService.notifyTaskAssigned(task.assigned_to, task, assignedUser);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: { task }
      });

    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get my tasks
  async getMyTasks(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, priority } = req.query;
      
      const offset = (page - 1) * limit;
      const where = {
        [Op.or]: [
          { created_by: userId },
          { assigned_to: userId }
        ]
      };
      
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const { count, rows: tasks } = await Task.findAndCountAll({
        where,
        include: [
          { model: User, as: 'creator', attributes: ['fullname'] },
          { model: User, as: 'assignee', attributes: ['fullname'] }
        ],
        order: [['due_date', 'ASC'], ['priority', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          tasks,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tasks',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update task status
  async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, progress_percentage, notes } = req.body;
      const userId = req.user.id;

      const task = await Task.findOne({
        where: {
          id,
          [Op.or]: [
            { created_by: userId },
            { assigned_to: userId }
          ]
        }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found or access denied'
        });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (progress_percentage !== undefined) updateData.progress_percentage = progress_percentage;
      if (notes) updateData.notes = notes;

      await task.update(updateData);

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: { task }
      });

    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Upload document
  async uploadDocument(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const documents = [];
      
      for (const file of req.files) {
        const document = await Document.create({
          title: req.body.title || file.originalname,
          description: req.body.description,
          category: req.body.category || 'other',
          file_name: file.originalname,
          file_path: file.path,
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_by: req.user.id,
          is_confidential: req.body.is_confidential === 'true',
          tags: req.body.tags ? JSON.parse(req.body.tags) : []
        });
        
        documents.push(document);
      }

      res.status(201).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: { documents }
      });

    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload documents',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get my documents
  async getMyDocuments(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, category, search } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { uploaded_by: userId };
      
      if (category) where.category = category;
      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: documents } = await Document.findAndCountAll({
        where,
        include: [
          { model: User, as: 'uploader', attributes: ['fullname'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Common helper methods
  async getMonthlyTargets(userId) {
    // This is a placeholder - implement based on your business logic
    return {
      orders_target: 50,
      orders_achieved: await Order.count({
        where: {
          created_by: userId,
          created_at: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      revenue_target: 500000,
      revenue_achieved: await Bill.sum('total_amount', {
        where: {
          created_by: userId,
          status: 'paid',
          created_at: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }) || 0
    };
  }

  async getConversionRate(userId) {
    const totalLeads = await Lead.count({ where: { assigned_to: userId } });
    const convertedLeads = await Lead.count({
      where: {
        assigned_to: userId,
        status: 'converted'
      }
    });

    return totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;
  }

  async getRecentActivities(userId, type) {
    const activities = [];
    const limit = 10;

    try {
      if (type === 'sales') {
        const recentOrders = await Order.findAll({
          where: { created_by: userId },
          include: [{ model: User, as: 'client', attributes: ['fullname'] }],
          order: [['created_at', 'DESC']],
          limit: 5
        });

        const recentCustomers = await Customer.findAll({
          where: { assigned_to: userId },
          order: [['created_at', 'DESC']],
          limit: 5
        });

        recentOrders.forEach(order => {
          activities.push({
            type: 'order',
            action: 'created',
            description: `Created order ${order.order_number} for ${order.client?.fullname}`,
            timestamp: order.created_at
          });
        });

        recentCustomers.forEach(customer => {
          activities.push({
            type: 'customer',
            action: 'created',
            description: `Added new customer: ${customer.name}`,
            timestamp: customer.created_at
          });
        });

      } else if (type === 'marketing') {
        const recentCampaigns = await Campaign.findAll({
          where: { created_by: userId },
          order: [['created_at', 'DESC']],
          limit: 5
        });

        const recentLeads = await Lead.findAll({
          where: { assigned_to: userId },
          order: [['created_at', 'DESC']],
          limit: 5
        });

        recentCampaigns.forEach(campaign => {
          activities.push({
            type: 'campaign',
            action: 'created',
            description: `Started campaign: ${campaign.name}`,
            timestamp: campaign.created_at
          });
        });

        recentLeads.forEach(lead => {
          activities.push({
            type: 'lead',
            action: 'created',
            description: `Added new lead: ${lead.name} from ${lead.company}`,
            timestamp: lead.created_at
          });
        });

      } else if (type === 'office') {
        const recentTasks = await Task.findAll({
          where: {
            [Op.or]: [
              { created_by: userId },
              { assigned_to: userId }
            ]
          },
          include: [
            { model: User, as: 'creator', attributes: ['fullname'] },
            { model: User, as: 'assignee', attributes: ['fullname'] }
          ],
          order: [['updated_at', 'DESC']],
          limit: 5
        });

        const recentDocuments = await Document.findAll({
          where: { uploaded_by: userId },
          order: [['created_at', 'DESC']],
          limit: 5
        });

        recentTasks.forEach(task => {
          activities.push({
            type: 'task',
            action: task.created_by === userId ? 'created' : 'assigned',
            description: `${task.created_by === userId ? 'Created' : 'Assigned'} task: ${task.title}`,
            timestamp: task.updated_at
          });
        });

        recentDocuments.forEach(doc => {
          activities.push({
            type: 'document',
            action: 'uploaded',
            description: `Uploaded document: ${doc.title}`,
            timestamp: doc.created_at
          });
        });
      }

      // Sort activities by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

    } catch (error) {
      console.error('Get recent activities error:', error);
      return [];
    }
  }

  // Update lead status
  async updateLeadStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, probability, expected_close_date } = req.body;
      const userId = req.user.id;

      const lead = await Lead.findOne({
        where: {
          id,
          assigned_to: userId
        }
      });

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found or access denied'
        });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (notes) updateData.notes = notes;
      if (probability !== undefined) updateData.probability = probability;
      if (expected_close_date) updateData.expected_close_date = expected_close_date;

      // Update last contact date if status is being updated
      if (status && status !== lead.status) {
        updateData.last_contact_date = new Date();
      }

      await lead.update(updateData);

      res.json({
        success: true,
        message: 'Lead updated successfully',
        data: { lead }
      });

    } catch (error) {
      console.error('Update lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update lead',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update campaign
  async updateCampaign(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const campaign = await Campaign.findOne({
        where: {
          id,
          created_by: userId
        }
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found or access denied'
        });
      }

      await campaign.update(req.body);

      res.json({
        success: true,
        message: 'Campaign updated successfully',
        data: { campaign }
      });

    } catch (error) {
      console.error('Update campaign error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update campaign',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new EmployeeController();