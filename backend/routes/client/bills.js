// backend/routes/client/bills.js - Client bills management
const express = require('express');
const Bill = require('../../models/Bill');
const Order = require('../../models/Order');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { paginationValidation } = require('../../middleware/validation');
const { Op } = require('sequelize');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);
router.use(authorizeRole(['client']));

// GET: Get client's bills
router.get('/', paginationValidation, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { client_id: req.user.id };

    if (status && status !== 'all') {
      whereClause.payment_status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { bill_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: bills } = await Bill.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Order, 
          as: 'order', 
          attributes: ['order_number', 'product_name'] 
        },
        { 
          model: User, 
          as: 'creator', 
          attributes: ['fullname'] 
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate summary statistics
    const summary = await Bill.findAll({
      where: { client_id: req.user.id },
      attributes: [
        'payment_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
      ],
      group: ['payment_status'],
      raw: true
    });

    res.json({
      success: true,
      data: bills,
      summary: summary.reduce((acc, item) => {
        acc[item.payment_status] = {
          count: parseInt(item.count),
          total: parseFloat(item.total)
        };
        return acc;
      }, {}),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching client bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
});

// GET: Get specific bill details
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({
      where: { 
        id: req.params.id,
        client_id: req.user.id
      },
      include: [
        { 
          model: Order, 
          as: 'order',
          include: [{ model: User, as: 'client', attributes: ['fullname', 'email'] }]
        },
        { 
          model: User, 
          as: 'creator', 
          attributes: ['fullname', 'email'] 
        }
      ]
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      data: bill
    });

  } catch (error) {
    console.error('Error fetching bill details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill details',
      error: error.message
    });
  }
});

module.exports = router;
