// backend/routes/admin/dashboard.js - Admin dashboard
const express = require('express');
const { Op } = require('sequelize');
const User = require('../../models/User');
const Order = require('../../models/Order');
const { FeedbackThread } = require('../../models/FeedbackThread');
const Bill = require('../../models/Bill');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // User statistics
    const userStats = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const pendingApprovals = await User.count({
      where: { status: 'pending', approval_required: true }
    });

    // Order statistics
    const orderStats = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_value']
      ],
      group: ['status'],
      raw: true
    });

    const recentOrders = await Order.findAll({
      where: { created_at: { [Op.gte]: lastMonth } },
      include: [{ model: User, as: 'client', attributes: ['fullname', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Feedback statistics
    const feedbackStats = await FeedbackThread.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Revenue statistics
    const revenueStats = await Bill.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_bills']
      ],
      where: { payment_status: 'paid' },
      raw: true
    });

    const dashboardData = {
      users: {
        byRole: userStats,
        pendingApprovals,
        totalUsers: userStats.reduce((sum, stat) => sum + parseInt(stat.count), 0)
      },
      orders: {
        byStatus: orderStats,
        recent: recentOrders,
        totalOrders: orderStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
        totalValue: orderStats.reduce((sum, stat) => sum + parseFloat(stat.total_value || 0), 0)
      },
      feedback: {
        byStatus: feedbackStats,
        totalThreads: feedbackStats.reduce((sum, stat) => sum + parseInt(stat.count), 0)
      },
      revenue: revenueStats[0] || { total_revenue: 0, total_bills: 0 }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

module.exports = router;