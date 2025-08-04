// backend/routes/shared/notifications.js - Fixed notifications route
const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const { query, validationResult } = require('express-validator');
const notificationService = require('../../services/notificationService');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Valid page number required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Valid limit required (1-50)'),
  query('unreadOnly').optional().isBoolean().withMessage('UnreadOnly must be boolean')
];

// GET: Get user notifications
router.get('/', paginationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;
    
    const options = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    };

    const result = notificationService.getUserNotifications(userId, options);

    res.json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / parseInt(limit)),
          totalItems: result.total,
          itemsPerPage: parseInt(limit)
        },
        unreadCount: result.unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = notificationService.getUserNotifications(userId, { unreadOnly: true });

    res.json({
      success: true,
      data: {
        unreadCount: result.unreadCount
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT: Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const success = notificationService.markAsRead(parseInt(id), userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT: Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user.id;
    const count = notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { count }
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE: Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const success = notificationService.deleteNotification(parseInt(id), userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = notificationService.getStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;