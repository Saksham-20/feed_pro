const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);
router.use(authorizeRole(['sales_purchase', 'admin']));

// GET: Dashboard data for sales employee
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Get sales statistics
    const [
      totalCustomers,
      totalOrders,
      monthlyOrders,
      totalRevenue,
      monthlyRevenue
    ] = await Promise.all([
      Customer.count({ where: { created_by: userId } }),
      Order.count({ where: { created_by: userId } }),
      Order.count({
        where: {
          created_by: userId,
          created_at: { [Op.gte]: startOfMonth }
        }
      }),
      Order.sum('total_amount', { where: { created_by: userId } }),
      Order.sum('total_amount', {
        where: {
          created_by: userId,
          created_at: { [Op.gte]: startOfMonth }
        }
      })
    ]);

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: { created_by: userId },
      include: [{ model: User, as: 'client', attributes: ['fullname', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Get order status breakdown
    const ordersByStatus = await Order.findAll({
      where: { created_by: userId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const dashboardData = {
      statistics: {
        totalCustomers: totalCustomers || 0,
        totalOrders: totalOrders || 0,
        monthlyOrders: monthlyOrders || 0,
        totalRevenue: totalRevenue || 0,
        monthlyRevenue: monthlyRevenue || 0
      },
      recentOrders,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      performance: {
        target: 100000,
        achieved: monthlyRevenue || 0,
        percentage: monthlyRevenue ? Math.round((monthlyRevenue / 100000) * 100) : 0
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching sales dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// GET: Get customers for sales employee
router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { created_by: req.user.id };

    if (search) {
      whereClause[Op.or] = [
        { customerName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (type && type !== 'all') {
      whereClause.customerType = type;
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: customers,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

// POST: Create new customer
router.post('/customers', [
  body('customerName').trim().isLength({ min: 2 }).withMessage('Customer name is required'),
  body('phoneNumber').matches(/^\d{10}$/).withMessage('Valid 10-digit phone number required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('address').trim().isLength({ min: 5 }).withMessage('Address is required')
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

    const customerData = {
      ...req.body,
      created_by: req.user.id
    };

    const customer = await Customer.create(customerData);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });

  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
});

// PUT: Update customer
router.put('/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        created_by: req.user.id
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.update(req.body);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

// GET: Get orders for sales employee
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { created_by: req.user.id };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { product_name: { [Op.iLike]: `%${search}%` } },
        { order_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'client', attributes: ['fullname', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

module.exports = router;