// backend/routes/admin/users.js - Admin user management routes
const express = require('express');
const { Op } = require('sequelize');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { body, query, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const notificationService = require('../../services/notificationService');
const emailService = require('../../services/emailService');
const router = express.Router();

// Apply authentication and admin authorization
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Validation middleware
const userValidation = [
  body('fullname').notEmpty().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').isIn(['client', 'sales_purchase', 'marketing', 'office', 'admin']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const searchValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Valid page number required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Valid limit required (1-100)'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
  query('role').optional().isIn(['client', 'sales_purchase', 'marketing', 'office', 'admin']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive', 'pending', 'suspended']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['fullname', 'email', 'role', 'status', 'created_at', 'last_login']).withMessage('Invalid sort field'),
  query('sort').optional().isIn(['asc', 'desc']).withMessage('Sort must be asc or desc')
];

// GET: Get all users with filtering and pagination
router.get('/', searchValidation, async (req, res) => {
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
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy = 'created_at',
      sort = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (role) where.role = role;
    if (status) where.status = status;
    
    if (search) {
      where[Op.or] = [
        { fullname: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [[sortBy, sort.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Get pending user approvals
router.get('/pending-approvals', async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: {
        status: 'pending',
        approval_required: true,
        role: { [Op.in]: ['sales_purchase', 'marketing', 'office'] }
      },
      attributes: { exclude: ['password'] },
      order: [['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: { users: pendingUsers }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Get specific user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional user statistics
    const Order = require('../../models/Order');
    const Bill = require('../../models/Bill');
    const Customer = require('../../models/Customer');
    const Lead = require('../../models/Lead');
    const Task = require('../../models/Task');

    let additionalStats = {};

    if (user.role === 'client') {
      const [totalOrders, totalSpent, activeOrders] = await Promise.all([
        Order.count({ where: { client_id: id } }),
        Bill.sum('total_amount', { where: { client_id: id, status: 'paid' } }) || 0,
        Order.count({ where: { client_id: id, status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] } } })
      ]);
      additionalStats = { totalOrders, totalSpent: parseFloat(totalSpent), activeOrders };
    } else if (user.role === 'sales_purchase') {
      const [customersManaged, ordersCreated, totalSales] = await Promise.all([
        Customer.count({ where: { assigned_to: id } }),
        Order.count({ where: { created_by: id } }),
        Bill.sum('total_amount', { where: { created_by: id, status: 'paid' } }) || 0
      ]);
      additionalStats = { customersManaged, ordersCreated, totalSales: parseFloat(totalSales) };
    } else if (user.role === 'marketing') {
      const [leadsManaged, conversions] = await Promise.all([
        Lead.count({ where: { assigned_to: id } }),
        Lead.count({ where: { assigned_to: id, status: 'converted' } })
      ]);
      additionalStats = { 
        leadsManaged, 
        conversions, 
        conversionRate: leadsManaged > 0 ? ((conversions / leadsManaged) * 100).toFixed(2) : 0 
      };
    } else if (user.role === 'office') {
      const [tasksCreated, tasksCompleted] = await Promise.all([
        Task.count({ where: { created_by: id } }),
        Task.count({ where: { created_by: id, status: 'completed' } })
      ]);
      additionalStats = { tasksCreated, tasksCompleted };
    }

    res.json({
      success: true,
      data: {
        user,
        statistics: additionalStats
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Create new user
router.post('/', userValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullname, email, password, phone, role, status = 'active' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      phone,
      role,
      status,
      approval_required: false // Admin created users don't need approval
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(user);

    // Send notification to user
    if (user.status === 'active') {
      await notificationService.notifyAccountApproved(user.id, user);
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT: Update user
router.put('/:id', userValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { fullname, email, phone, role, status, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData = { fullname, email, phone, role, status };

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const oldStatus = user.status;
    await user.update(updateData);

    // Send notification if status changed to active
    if (oldStatus !== 'active' && status === 'active') {
      await notificationService.notifyAccountApproved(user.id, user);
      await emailService.sendApprovalNotification(user, true);
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Approve user
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending approval'
      });
    }

    await user.update({
      status: 'active',
      approval_notes: notes,
      approved_at: new Date(),
      approved_by: req.user.id
    });

    // Send approval notifications
    await notificationService.notifyAccountApproved(user.id, user);
    await emailService.sendApprovalNotification(user, true);

    res.json({
      success: true,
      message: 'User approved successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Reject user
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User is not pending approval'
      });
    }

    await user.update({
      status: 'inactive',
      rejection_reason: reason,
      approval_notes: notes,
      approved_at: new Date(),
      approved_by: req.user.id
    });

    // Send rejection notification
    await emailService.sendApprovalNotification(user, false);

    res.json({
      success: true,
      message: 'User rejected successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Suspend user
router.post('/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend admin users'
      });
    }

    await user.update({
      status: 'suspended',
      suspension_reason: reason,
      suspension_notes: notes,
      suspended_at: new Date(),
      suspended_by: req.user.id
    });

    // Send suspension notification
    await notificationService.createNotification({
      userId: user.id,
      title: 'Account Suspended',
      message: `Your account has been suspended. Reason: ${reason}`,
      type: 'warning',
      category: 'account',
      user,
      sendEmail: true
    });

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Reactivate user
router.post('/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'User is already active'
      });
    }

    await user.update({
      status: 'active',
      reactivation_notes: notes,
      reactivated_at: new Date(),
      reactivated_by: req.user.id
    });

    // Send reactivation notification
    await notificationService.createNotification({
      userId: user.id,
      title: 'Account Reactivated',
      message: 'Your account has been reactivated and you can now access the platform.',
      type: 'success',
      category: 'account',
      user,
      sendEmail: true
    });

    res.json({
      success: true,
      message: 'User reactivated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE: Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Check if user has associated data
    const Order = require('../../models/Order');
    const Bill = require('../../models/Bill');
    
    const [orderCount, billCount] = await Promise.all([
      Order.count({ where: { [Op.or]: [{ client_id: id }, { created_by: id }] } }),
      Bill.count({ where: { [Op.or]: [{ client_id: id }, { created_by: id }] } })
    ]);

    if (orderCount > 0 || billCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with associated orders or bills. Consider suspending instead.',
        data: { orderCount, billCount }
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: User statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      adminUsers,
      clientUsers,
      employeeUsers,
      recentSignups
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      User.count({ where: { status: 'pending' } }),
      User.count({ where: { status: 'suspended' } }),
      User.count({ where: { role: 'admin' } }),
      User.count({ where: { role: 'client' } }),
      User.count({ where: { role: { [Op.in]: ['sales_purchase', 'marketing', 'office'] } } }),
      User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalUsers,
        byStatus: {
          active: activeUsers,
          pending: pendingUsers,
          suspended: suspendedUsers,
          inactive: totalUsers - activeUsers - pendingUsers - suspendedUsers
        },
        byRole: {
          admin: adminUsers,
          client: clientUsers,
          employee: employeeUsers
        },
        recentSignups
      }
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Bulk action on users
router.post('/bulk-action', async (req, res) => {
  try {
    const { action, userIds, data = {} } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } }
    });

    if (users.length !== userIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Some users not found'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { status: 'active' };
        message = 'Users activated successfully';
        break;
      case 'suspend':
        updateData = { status: 'suspended', suspension_reason: data.reason };
        message = 'Users suspended successfully';
        break;
      case 'deactivate':
        updateData = { status: 'inactive' };
        message = 'Users deactivated successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    await User.update(updateData, {
      where: { id: { [Op.in]: userIds } }
    });

    // Send notifications to affected users
    for (const user of users) {
      let notificationTitle = '';
      let notificationMessage = '';
      
      switch (action) {
        case 'activate':
          notificationTitle = 'Account Activated';
          notificationMessage = 'Your account has been activated.';
          break;
        case 'suspend':
          notificationTitle = 'Account Suspended';
          notificationMessage = `Your account has been suspended. ${data.reason ? `Reason: ${data.reason}` : ''}`;
          break;
        case 'deactivate':
          notificationTitle = 'Account Deactivated';
          notificationMessage = 'Your account has been deactivated.';
          break;
      }
      
      await notificationService.createNotification({
        userId: user.id,
        title: notificationTitle,
        message: notificationMessage,
        type: action === 'activate' ? 'success' : 'warning',
        category: 'account',
        user,
        sendEmail: true
      });
    }

    res.json({
      success: true,
      message,
      data: { affectedUsers: users.length }
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;