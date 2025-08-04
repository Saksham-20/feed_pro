const express = require('express');
const { body, validationResult } = require('express-validator');
const { FeedbackThread, FeedbackMessage } = require('../../models/FeedbackThread');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// GET: Get all feedback threads for admin
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      category, 
      priority, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    let whereClause = {};
    
    // Apply filters
    if (status && status !== 'all') whereClause.status = status;
    if (category && category !== 'all') whereClause.category = category;
    if (priority && priority !== 'all') whereClause.priority = priority;

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: threads } = await FeedbackThread.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'client', 
          attributes: ['fullname', 'email'],
          where: search ? {
            [Op.or]: [
              { fullname: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } }
            ]
          } : undefined
        },
        {
          model: FeedbackMessage,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{ model: User, as: 'sender', attributes: ['fullname'] }]
        }
      ],
      order: [['updated_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Get statistics
    const stats = await FeedbackThread.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      success: true,
      data: threads,
      stats: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
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
    console.error('Error fetching feedback threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback threads',
      error: error.message
    });
  }
});

// GET: Get specific feedback thread with messages
router.get('/thread/:threadId', async (req, res) => {
  try {
    const thread = await FeedbackThread.findOne({
      where: { thread_id: req.params.threadId },
      include: [
        { model: User, as: 'client', attributes: ['fullname', 'email'] },
        {
          model: FeedbackMessage,
          as: 'messages',
          include: [{ model: User, as: 'sender', attributes: ['fullname'] }],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    res.json({
      success: true,
      data: {
        thread,
        messages: thread.messages
      }
    });

  } catch (error) {
    console.error('Error fetching feedback thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread',
      error: error.message
    });
  }
});

// POST: Admin reply to feedback thread
router.post('/thread/:threadId/reply', [
  body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message required')
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

    // Verify thread exists
    const thread = await FeedbackThread.findOne({
      where: { thread_id: req.params.threadId }
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Check if thread is closed
    if (thread.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reply to closed thread'
      });
    }

    // Create admin message
    const message = await FeedbackMessage.create({
      thread_id: req.params.threadId,
      sender_id: req.user.id,
      sender_type: 'admin',
      message: req.body.message
    });

    // Update thread status
    await thread.update({ 
      status: 'in_progress',
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending admin reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
});

// PATCH: Update thread status
router.patch('/thread/:threadId/status', [
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status')
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

    const thread = await FeedbackThread.findOne({
      where: { thread_id: req.params.threadId }
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    await thread.update({ 
      status: req.body.status,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Thread status updated successfully',
      data: thread
    });

  } catch (error) {
    console.error('Error updating thread status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thread status',
      error: error.message
    });
  }
});

// PATCH: Mark messages as read (admin)
router.patch('/thread/:threadId/read', async (req, res) => {
  try {
    const thread = await FeedbackThread.findOne({
      where: { thread_id: req.params.threadId }
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Mark client messages as read
    await FeedbackMessage.update(
      { is_read: true },
      {
        where: {
          thread_id: req.params.threadId,
          sender_type: 'client',
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
});

// GET: Feedback analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Thread statistics
    const threadStats = await FeedbackThread.findAll({
      attributes: [
        'status',
        'category',
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['status', 'category', 'priority'],
      raw: true
    });

    // Response time analytics (average time from thread creation to first admin reply)
    const responseTimeStats = await sequelize.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (fm.created_at - ft.created_at))/3600) as avg_response_hours,
        COUNT(DISTINCT ft.id) as threads_with_response
      FROM feedback_threads ft
      JOIN feedback_messages fm ON ft.thread_id = fm.thread_id
      WHERE fm.sender_type = 'admin'
      AND ft.created_at BETWEEN :startDate AND :endDate
      AND fm.created_at = (
        SELECT MIN(created_at) 
        FROM feedback_messages 
        WHERE thread_id = ft.thread_id 
        AND sender_type = 'admin'
      )
    `, {
      replacements: { startDate, endDate },
      type: sequelize.QueryTypes.SELECT
    });

    // Resolution rate
    const resolutionStats = await FeedbackThread.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_threads'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END")), 'resolved_threads']
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      raw: true
    });

    const analytics = {
      timeRange,
      period: { startDate, endDate },
      threadStats: {
        byStatus: {},
        byCategory: {},
        byPriority: {}
      },
      responseTime: responseTimeStats[0] || { avg_response_hours: 0, threads_with_response: 0 },
      resolutionRate: resolutionStats[0] ? {
        total: parseInt(resolutionStats[0].total_threads),
        resolved: parseInt(resolutionStats[0].resolved_threads),
        rate: resolutionStats[0].total_threads > 0 
          ? (parseInt(resolutionStats[0].resolved_threads) / parseInt(resolutionStats[0].total_threads) * 100).toFixed(1)
          : 0
      } : { total: 0, resolved: 0, rate: 0 }
    };

    // Process thread statistics
    threadStats.forEach(stat => {
      if (!analytics.threadStats.byStatus[stat.status]) {
        analytics.threadStats.byStatus[stat.status] = 0;
      }
      if (!analytics.threadStats.byCategory[stat.category]) {
        analytics.threadStats.byCategory[stat.category] = 0;
      }
      if (!analytics.threadStats.byPriority[stat.priority]) {
        analytics.threadStats.byPriority[stat.priority] = 0;
      }
      
      analytics.threadStats.byStatus[stat.status] += parseInt(stat.count);
      analytics.threadStats.byCategory[stat.category] += parseInt(stat.count);
      analytics.threadStats.byPriority[stat.priority] += parseInt(stat.count);
    });

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router;