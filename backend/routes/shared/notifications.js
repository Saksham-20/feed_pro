// backend/routes/shared/notifications.js - Notifications management
const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);

// In-memory notification store (use Redis in production)
const notifications = new Map();

// GET: Get user notifications
router.get('/', async (req, res) => {
  try {
    const userNotifications = notifications.get(req.user.id) || [];
    
    res.json({
      success: true,
      data: userNotifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// POST: Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const userNotifications = notifications.get(req.user.id) || [];
    const notification = userNotifications.find(n => n.id === req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    notification.readAt = new Date();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
});

// Utility function to add notification
const addNotification = (userId, notification) => {
  const userNotifications = notifications.get(userId) || [];
  const newNotification = {
    id: Date.now().toString(),
    ...notification,
    createdAt: new Date(),
    read: false
  };
  
  userNotifications.unshift(newNotification);
  
  // Keep only last 50 notifications
  if (userNotifications.length > 50) {
    userNotifications.splice(50);
  }
  
  notifications.set(userId, userNotifications);
  return newNotification;
};

module.exports = { router, addNotification };