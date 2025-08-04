// backend/controllers/clientController.js - Client controller
const { Op } = require('sequelize');
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { FeedbackThread } = require('../models/FeedbackThread');
const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');

class ClientController {
  // Get client dashboard overview
  async getDashboardOverview(req, res) {
    try {
      const clientId = req.user.id;
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      // Get client statistics
      const [
        totalOrders,
        monthlyOrders,
        totalBills,
        pendingBills,
        paidAmount,
        pendingAmount,
        activeFeedback
      ] = await Promise.all([
        Order.count({ where: { client_id: clientId } }),
        Order.count({
          where: {
            client_id: clientId,
            created_at: { [Op.gte]: startOfMonth }
          }
        }),
        Bill.count({ where: { client_id: clientId } }),
        Bill.count({
          where: {
            client_id: clientId,
            status: { [Op.in]: ['sent', 'overdue'] }
          }
        }),
        Bill.sum('total_amount', {
          where: {
            client_id: clientId,
            status: 'paid'
          }
        }) || 0,
        Bill.sum('total_amount', {
          where: {
            client_id: clientId,
            status: { [Op.in]: ['sent', 'overdue'] }
          }
        }) || 0,
        FeedbackThread.count({
          where: {
            client_id: clientId,
            status: { [Op.in]: ['open', 'in_progress'] }
          }
        })
      ]);

      // Get recent orders
      const recentOrders = await Order.findAll({
        where: { client_id: clientId },
        include: [{ model: User, as: 'creator', attributes: ['fullname'] }],
        order: [['created_at', 'DESC']],
        limit: 5
      });

      // Get recent bills
      const recentBills = await Bill.findAll({
        where: { client_id: clientId },
        include: [{ model: User, as: 'creator', attributes: ['fullname'] }],
        order: [['created_at', 'DESC']],
        limit: 5
      });

      res.json({
        success: true,
        data: {
          statistics: {
            totalOrders,
            monthlyOrders,
            totalBills,
            pendingBills,
            paidAmount: parseFloat(paidAmount),
            pendingAmount: parseFloat(pendingAmount),
            activeFeedback
          },
          recentOrders,
          recentBills
        }
      });

    } catch (error) {
      console.error('Client dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get client orders
  async getOrders(req, res) {
    try {
      const clientId = req.user.id;
      const { page = 1, limit = 10, status, sortBy = 'created_at', sort = 'desc' } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { client_id: clientId };
      
      if (status) {
        where.status = status;
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          { model: User, as: 'creator', attributes: ['fullname', 'email'] }
        ],
        order: [[sortBy, sort.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get client orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get specific order
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      const order = await Order.findOne({
        where: { id, client_id: clientId },
        include: [
          { model: User, as: 'creator', attributes: ['fullname', 'email', 'phone'] },
          { model: Bill, as: 'bills' }
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
        data: { order }
      });

    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create new order (client can create their own orders)
  async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const clientId = req.user.id;
      const { products, delivery_date, notes, billing_address, shipping_address } = req.body;

      // Calculate total amount
      const total_amount = products.reduce((sum, product) => 
        sum + (parseFloat(product.quantity) * parseFloat(product.unit_price)), 0
      );

      const order = await Order.create({
        client_id: clientId,
        created_by: clientId, // Client creating their own order
        products,
        total_amount,
        delivery_date,
        notes,
        billing_address,
        shipping_address,
        status: 'pending'
      });

      // Fetch the created order with relationships
      const orderWithDetails = await Order.findByPk(order.id, {
        include: [
          { model: User, as: 'client', attributes: ['fullname', 'email'] },
          { model: User, as: 'creator', attributes: ['fullname'] }
        ]
      });

      // Send notification to admin/sales team
      const adminUsers = await User.findAll({
        where: { role: { [Op.in]: ['admin', 'sales_purchase'] } }
      });

      for (const admin of adminUsers) {
        await notificationService.notifyOrderCreated(admin.id, order, admin);
      }

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order: orderWithDetails }
      });

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get client bills
  async getBills(req, res) {
    try {
      const clientId = req.user.id;
      const { page = 1, limit = 10, status, sortBy = 'created_at', sort = 'desc' } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { client_id: clientId };
      
      if (status) {
        where.status = status;
      }

      const { count, rows: bills } = await Bill.findAndCountAll({
        where,
        include: [
          { model: User, as: 'creator', attributes: ['fullname', 'email'] },
          { model: Order, as: 'order', attributes: ['order_number', 'id'] }
        ],
        order: [[sortBy, sort.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          bills,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get client bills error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bills',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get specific bill
  async getBill(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;

      const bill = await Bill.findOne({
        where: { id, client_id: clientId },
        include: [
          { model: User, as: 'creator', attributes: ['fullname', 'email', 'phone'] },
          { model: Order, as: 'order', attributes: ['order_number', 'products'] }
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
        data: { bill }
      });

    } catch (error) {
      console.error('Get bill error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bill',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update payment status (client confirming payment)
  async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.user.id;
      const { payment_method, transaction_reference, notes } = req.body;

      const bill = await Bill.findOne({
        where: { id, client_id: clientId }
      });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Bill not found'
        });
      }

      if (bill.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Bill is already marked as paid'
        });
      }

      await bill.update({
        payment_method,
        notes: notes || bill.notes,
        // Note: Status should be updated by admin after verification
        // This just records the payment details
      });

      // Notify admin about payment update
      const adminUsers = await User.findAll({
        where: { role: { [Op.in]: ['admin', 'sales_purchase'] } }
      });

      for (const admin of adminUsers) {
        await notificationService.createNotification({
          userId: admin.id,
          title: 'Payment Update',
          message: `Client has updated payment details for Bill #${bill.bill_number}`,
          type: 'info',
          category: 'billing',
          data: { billId: bill.id, billNumber: bill.bill_number },
          user: admin,
          sendEmail: true
        });
      }

      res.json({
        success: true,
        message: 'Payment details updated successfully',
        data: { bill }
      });

    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get client profile with additional details
  async getClientProfile(req, res) {
    try {
      const clientId = req.user.id;

      const client = await User.findByPk(clientId, {
        attributes: { exclude: ['password'] }
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Get summary statistics
      const [totalOrders, totalSpent, activeOrders, pendingBills] = await Promise.all([
        Order.count({ where: { client_id: clientId } }),
        Bill.sum('total_amount', { where: { client_id: clientId, status: 'paid' } }) || 0,
        Order.count({ where: { client_id: clientId, status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] } } }),
        Bill.count({ where: { client_id: clientId, status: { [Op.in]: ['sent', 'overdue'] } } })
      ]);

      res.json({
        success: true,
        data: {
          client,
          statistics: {
            totalOrders,
            totalSpent: parseFloat(totalSpent),
            activeOrders,
            pendingBills
          }
        }
      });

    } catch (error) {
      console.error('Get client profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update client profile
  async updateClientProfile(req, res) {
    try {
      const clientId = req.user.id;
      const { fullname, phone, address, company, gst_number } = req.body;

      const client = await User.findByPk(clientId);
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      const updateData = {
        fullname,
        phone
      };

      // Add optional fields if provided
      if (address) updateData.address = address;
      if (company) updateData.company = company;
      if (gst_number) updateData.gst_number = gst_number;

      await client.update(updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          client: {
            id: client.id,
            fullname: client.fullname,
            email: client.email,
            phone: client.phone,
            company: client.company,
            address: client.address,
            gst_number: client.gst_number
          }
        }
      });

    } catch (error) {
      console.error('Update client profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new ClientController();