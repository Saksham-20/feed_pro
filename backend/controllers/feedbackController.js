// backend/controllers/feedbackController.js - Feedback management controller
const { Op } = require('sequelize');
const { FeedbackThread, FeedbackMessage } = require('../models/FeedbackThread');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const { v4: uuidv4 } = require('uuid');

class FeedbackController {
  // Get all feedback threads (Admin view)
  async getAllFeedback(req, res) {
    try {
      const { page = 1, limit = 10, status, category, priority, search } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (status) where.status = status;
      if (category) where.category = category;
      if (priority) where.priority = priority;
      
      if (search) {
        where[Op.or] = [
          { subject: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: threads } = await FeedbackThread.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'fullname', 'email', 'phone']
          },
          {
            model: FeedbackMessage,
            as: 'messages',
            limit: 1,
            order: [['created_at', 'DESC']],
            include: [{
              model: User,
              as: 'sender',
              attributes: ['fullname', 'role']
            }]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate unread messages count for each thread
      const threadsWithUnread = await Promise.all(
        threads.map(async (thread) => {
          const unreadCount = await FeedbackMessage.count({
            where: {
              thread_id: thread.thread_id,
              sender_type: 'client',
              is_read: false
            }
          });
          
          return {
            ...thread.toJSON(),
            unreadCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          threads: threadsWithUnread,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get client's feedback threads
  async getClientFeedback(req, res) {
    try {
      const clientId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;
      
      const where = { client_id: clientId };
      if (status) where.status = status;

      const { count, rows: threads } = await FeedbackThread.findAndCountAll({
        where,
        include: [
          {
            model: FeedbackMessage,
            as: 'messages',
            limit: 1,
            order: [['created_at', 'DESC']],
            include: [{
              model: User,
              as: 'sender',
              attributes: ['fullname', 'role']
            }]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate unread admin messages count
      const threadsWithUnread = await Promise.all(
        threads.map(async (thread) => {
          const unreadCount = await FeedbackMessage.count({
            where: {
              thread_id: thread.thread_id,
              sender_type: 'admin',
              is_read: false
            }
          });
          
          return {
            ...thread.toJSON(),
            unreadCount
          };
        })
      );

      res.json({
        success: true,
        data: {
          threads: threadsWithUnread,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get client feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create feedback thread
  async createFeedback(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { subject, message, category = 'general', priority = 'medium' } = req.body;
      const clientId = req.user.id;
      const threadId = uuidv4();

      // Create thread
      const thread = await FeedbackThread.create({
        thread_id: threadId,
        client_id: clientId,
        subject,
        category,
        priority,
        status: 'open'
      });

      // Create initial message
      const initialMessage = await FeedbackMessage.create({
        thread_id: threadId,
        sender_id: clientId,
        sender_type: 'client',
        message,
        is_read: false
      });

      // Fetch the created thread with relationships
      const threadWithDetails = await FeedbackThread.findByPk(thread.id, {
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'fullname', 'email']
          },
          {
            model: FeedbackMessage,
            as: 'messages',
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'fullname', 'role']
            }]
          }
        ]
      });

      // Notify admin users
      const adminUsers = await User.findAll({
        where: { role: { [Op.in]: ['admin', 'office'] } }
      });

      for (const admin of adminUsers) {
        await notificationService.notifyFeedbackReceived(admin.id, thread, admin);
      }

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: { thread: threadWithDetails }
      });

    } catch (error) {
      console.error('Create feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get feedback thread with messages
  async getFeedbackThread(req, res) {
    try {
      const { threadId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Build where clause based on user role
      const where = { thread_id: threadId };
      if (userRole === 'client') {
        where.client_id = userId; // Clients can only see their own threads
      }

      const thread = await FeedbackThread.findOne({
        where,
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'fullname', 'email', 'phone']
          },
          {
            model: FeedbackMessage,
            as: 'messages',
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'fullname', 'role']
            }],
            order: [['created_at', 'ASC']]
          }
        ]
      });

      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Feedback thread not found'
        });
      }

      // Mark messages as read based on user type
      const messagesToMarkRead = thread.messages.filter(msg => {
        if (userRole === 'client') {
          return msg.sender_type === 'admin' && !msg.is_read;
        } else {
          return msg.sender_type === 'client' && !msg.is_read;
        }
      });

      if (messagesToMarkRead.length > 0) {
        await FeedbackMessage.update(
          { is_read: true },
          {
            where: {
              id: { [Op.in]: messagesToMarkRead.map(msg => msg.id) }
            }
          }
        );
      }

      res.json({
        success: true,
        data: { thread }
      });

    } catch (error) {
      console.error('Get feedback thread error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback thread',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Reply to feedback thread
  async replyToFeedback(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { threadId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Verify thread exists and user has access
      const where = { thread_id: threadId };
      if (userRole === 'client') {
        where.client_id = userId;
      }

      const thread = await FeedbackThread.findOne({ where });
      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Feedback thread not found or access denied'
        });
      }

      // Create reply message
      const reply = await FeedbackMessage.create({
        thread_id: threadId,
        sender_id: userId,
        sender_type: userRole === 'client' ? 'client' : 'admin',
        message,
        is_read: false
      });

      // Update thread status if it was closed
      if (thread.status === 'closed') {
        await thread.update({ status: 'open' });
      }

      // Fetch the reply with sender details
      const replyWithSender = await FeedbackMessage.findByPk(reply.id, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'fullname', 'role']
        }]
      });

      // Send notification to the other party
      if (userRole === 'client') {
        // Notify admin users about client reply
        const adminUsers = await User.findAll({
          where: { role: { [Op.in]: ['admin', 'office'] } }
        });

        for (const admin of adminUsers) {
          await notificationService.createNotification({
            userId: admin.id,
            title: 'Feedback Reply',
            message: `Client replied to feedback: "${thread.subject}"`,
            type: 'info',
            category: 'support',
            data: { threadId: thread.thread_id, subject: thread.subject },
            user: admin,
            sendEmail: true
          });
        }
      } else {
        // Notify client about admin reply
        const client = await User.findByPk(thread.client_id);
        if (client) {
          await notificationService.createNotification({
            userId: client.id,
            title: 'Feedback Response',
            message: `You have a new response to your feedback: "${thread.subject}"`,
            type: 'info',
            category: 'support',
            data: { threadId: thread.thread_id, subject: thread.subject },
            user: client,
            sendEmail: true
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Reply sent successfully',
        data: { message: replyWithSender }
      });

    } catch (error) {
      console.error('Reply to feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reply',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update feedback thread status (Admin only)
  async updateFeedbackStatus(req, res) {
    try {
      const { threadId } = req.params;
      const { status, priority } = req.body;

      const thread = await FeedbackThread.findOne({
        where: { thread_id: threadId }
      });

      if (!thread) {
        return res.status(404).json({
          success: false,
          message: 'Feedback thread not found'
        });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;

      await thread.update(updateData);

      // Notify client about status change
      const client = await User.findByPk(thread.client_id);
      if (client && status) {
        await notificationService.createNotification({
          userId: client.id,
          title: 'Feedback Status Update',
          message: `Your feedback "${thread.subject}" status has been updated to: ${status}`,
          type: 'info',
          category: 'support',
          data: { threadId: thread.thread_id, status },
          user: client,
          sendEmail: true
        });
      }

      res.json({
        success: true,
        message: 'Feedback status updated successfully',
        data: { thread }
      });

    } catch (error) {
      console.error('Update feedback status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feedback status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get feedback statistics (Admin)
  async getFeedbackStats(req, res) {
    try {
      const { dateRange } = req.query;
      let where = {};
      
      if (dateRange) {
        const { startDate, endDate } = JSON.parse(dateRange);
        where.created_at = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const [
        totalThreads,
        openThreads,
        inProgressThreads,
        resolvedThreads,
        closedThreads,
        averageResponseTime
      ] = await Promise.all([
        FeedbackThread.count({ where }),
        FeedbackThread.count({ where: { ...where, status: 'open' } }),
        FeedbackThread.count({ where: { ...where, status: 'in_progress' } }),
        FeedbackThread.count({ where: { ...where, status: 'resolved' } }),
        FeedbackThread.count({ where: { ...where, status: 'closed' } }),
        this.calculateAverageResponseTime(where)
      ]);

      // Get feedback by category
      const categoryStats = await FeedbackThread.findAll({
        where,
        attributes: [
          'category',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['category'],
        raw: true
      });

      // Get feedback by priority
      const priorityStats = await FeedbackThread.findAll({
        where,
        attributes: [
          'priority',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['priority'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalThreads,
            openThreads,
            inProgressThreads,
            resolvedThreads,
            closedThreads,
            averageResponseTime
          },
          categoryBreakdown: categoryStats.reduce((acc, item) => {
            acc[item.category] = parseInt(item.count);
            return acc;
          }, {}),
          priorityBreakdown: priorityStats.reduce((acc, item) => {
            acc[item.priority] = parseInt(item.count);
            return acc;
          }, {})
        }
      });

    } catch (error) {
      console.error('Get feedback stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Helper method to calculate average response time
  async calculateAverageResponseTime(where = {}) {
    try {
      const threads = await FeedbackThread.findAll({
        where,
        include: [{
          model: FeedbackMessage,
          as: 'messages',
          order: [['created_at', 'ASC']]
        }]
      });

      let totalResponseTime = 0;
      let responseCount = 0;

      threads.forEach(thread => {
        const messages = thread.messages;
        for (let i = 1; i < messages.length; i++) {
          const currentMsg = messages[i];
          const previousMsg = messages[i - 1];
          
          // Calculate response time if message types are different (client to admin or vice versa)
          if (currentMsg.sender_type !== previousMsg.sender_type) {
            const responseTime = new Date(currentMsg.created_at) - new Date(previousMsg.created_at);
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      });

      if (responseCount === 0) return 0;

      // Return average response time in hours
      const averageMs = totalResponseTime / responseCount;
      return Math.round(averageMs / (1000 * 60 * 60) * 100) / 100; // Round to 2 decimal places

    } catch (error) {
      console.error('Calculate average response time error:', error);
      return 0;
    }
  }
}

module.exports = new FeedbackController();