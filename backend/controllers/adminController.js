// backend/controllers/adminController.js - Admin controller
const { Op } = require('sequelize');
const User = require('../models/User');
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const { FeedbackThread } = require('../models/FeedbackThread');
const sequelize = require('../database/connection');

class AdminController {
  // Get dashboard overview
  async getDashboardOverview(req, res) {
    try {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

      // User statistics
      const [userStats, pendingApprovals] = await Promise.all([
        User.findAll({
          attributes: [
            'role',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['role'],
          raw: true
        }),
        User.count({
          where: { 
            status: 'pending', 
            role: { [Op.in]: ['sales_purchase', 'marketing', 'office'] }
          }
        })
      ]);

      // Order statistics
      const [orderStats, recentOrders] = await Promise.all([
        Order.findAll({
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_value']
          ],
          group: ['status'],
          raw: true
        }),
        Order.findAll({
          where: { created_at: { [Op.gte]: lastMonth } },
          include: [{ model: User, as: 'client', attributes: ['fullname', 'email'] }],
          order: [['created_at', 'DESC']],
          limit: 10
        })
      ]);

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
        revenue: revenueStats[0] || { total_revenue: 0, total_bills: 0 },
        systemHealth: {
          status: 'healthy',
          databaseStatus: 'connected'
        }
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }

  // Get all users with filtering
  async getUsers(req, res) {
    try {
      const {
        role,
        status,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        page = 1,
        limit = 20,
        search
      } = req.query;

      let whereClause = {};

      if (role && role !== 'all') {
        whereClause.role = role;
      }

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { fullname: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { user_id: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }

  // Get pending approvals
  async getPendingApprovals(req, res) {
    try {
      const pendingUsers = await User.findAll({
        where: {
          status: 'pending',
          role: { [Op.in]: ['sales_purchase', 'marketing', 'office'] }
        },
        order: [['created_at', 'ASC']],
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        data: pendingUsers
      });

    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending approvals',
        error: error.message
      });
    }
  }

  // Approve user
  async approveUser(req, res) {
    try {
      const { userId, note } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({
        status: 'approved',
        approved_by: req.user.id,
        approved_at: new Date(),
        approval_note: note
      });

      res.json({
        success: true,
        message: 'User approved successfully',
        data: user.toJSON()
      });

    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve user',
        error: error.message
      });
    }
  }

  // Reject user
  async rejectUser(req, res) {
    try {
      const { userId, reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({
        status: 'rejected',
        approved_by: req.user.id,
        rejected_at: new Date(),
        rejection_reason: reason
      });

      res.json({
        success: true,
        message: 'User rejected successfully',
        data: user.toJSON()
      });

    } catch (error) {
      console.error('Error rejecting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject user',
        error: error.message
      });
    }
  }
}

module.exports = new AdminController();