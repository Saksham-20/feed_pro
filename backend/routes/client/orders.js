// backend/routes/client/orders.js - Client order management
const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../../models/Order');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);
router.use(authorizeRole(['client']));

// Validation rules
const orderValidation = [
  body('productName').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Valid quantity required'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Valid amount required')
];

// GET: Get client's orders
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { client_id: req.user.id };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['id', 'fullname', 'email'] 
        },
        { 
          model: User, 
          as: 'client', 
          attributes: ['id', 'fullname', 'email'] 
        }
      ],
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
    console.error('Error fetching client orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Create new order
router.post('/', orderValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const orderData = {
      product_name: req.body.productName,
      quantity: req.body.quantity,
      description: req.body.description,
      total_amount: req.body.totalAmount || 0,
      client_id: req.user.id,
      created_by: req.user.id,
      status: 'pending'
    };

    const order = await Order.create(orderData);

    // Include relations in response
    const orderWithRelations = await Order.findByPk(order.id, {
      include: [
        { 
          model: User, 
          as: 'client', 
          attributes: ['id', 'fullname', 'email'] 
        },
        { 
          model: User, 
          as: 'creator', 
          attributes: ['id', 'fullname', 'email'] 
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: orderWithRelations
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Get specific order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        client_id: req.user.id // Ensure client can only access their orders
      },
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['id', 'fullname', 'email'] 
        },
        { 
          model: User, 
          as: 'client', 
          attributes: ['id', 'fullname', 'email'] 
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT: Update order (only if pending)
router.put('/:id', orderValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        client_id: req.user.id,
        status: 'pending' // Only allow updates for pending orders
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be updated'
      });
    }

    const updateData = {
      product_name: req.body.productName,
      quantity: req.body.quantity,
      description: req.body.description,
      total_amount: req.body.totalAmount || order.total_amount
    };

    await order.update(updateData);

    // Return updated order with relations
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { 
          model: User, 
          as: 'client', 
          attributes: ['id', 'fullname', 'email'] 
        },
        { 
          model: User, 
          as: 'creator', 
          attributes: ['id', 'fullname', 'email'] 
        }
      ]
    });

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE: Cancel order (only if pending)
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        client_id: req.user.id,
        status: 'pending' // Only allow cancellation for pending orders
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be cancelled'
      });
    }

    await order.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;