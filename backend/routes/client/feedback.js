// backend/routes/client/feedback.js - Client feedback management
const express = require('express');
const { body, validationResult } = require('express-validator');
const { FeedbackThread, FeedbackMessage } = require('../../models/FeedbackThread');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);
router.use(authorizeRole(['client']));

// Validation rules
const feedbackValidation = [
  body('subject').trim().isLength({ min: 3, max: 255 }).withMessage('Subject must be 3-255 characters'),
  body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be 10-5000 characters'),
  body('category').optional().isIn(['general', 'complaint', 'suggestion', 'support']),
  body('priority').optional().isIn(['low', 'medium', 'high'])
];

// GET: Get client's feedback threads
router.get('/', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { client_id: req.user.id };
    if (status && status !== 'all') whereClause.status = status;
    if (category && category !== 'all') whereClause.category = category;

    const { count, rows: threads } = await FeedbackThread.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FeedbackMessage,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{ 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'fullname', 'role'] 
          }]
        }
      ],
      order: [['updated_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: threads,
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
      message: 'Failed to fetch feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Create new feedback thread
router.post('/', feedbackValidation, async (req, res) => {
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
    const threadId = uuidv4();

    // Create thread
    const thread = await FeedbackThread.create({
      thread_id: threadId,
      client_id: req.user.id,
      subject,
      category,
      priority,
      status: 'open'
    });

    // Create initial message
    const initialMessage = await FeedbackMessage.create({
      thread_id: threadId,
      sender_id: req.user.id,
      sender_type: 'client',
      message,
      is_read: false
    });

    // Return thread with initial message
    const threadWithMessages = await FeedbackThread.findByPk(thread.id, {
      include: [
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

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: threadWithMessages
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Get specific feedback thread with messages
router.get('/thread/:threadId', async (req, res) => {
  try {
    const thread = await FeedbackThread.findOne({
      where: { 
        thread_id: req.params.threadId,
        client_id: req.user.id // Ensure client can only access their threads
      },
      include: [
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
        message: 'Thread not found'
      });
    }

    // Count unread admin messages
    const unreadCount = thread.messages.filter(msg => 
      msg.sender_type === 'admin' && !msg.is_read
    ).length;

    res.json({
      success: true,
      data: {
        thread,
        messages: thread.messages,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching feedback thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Add message to thread
router.post('/thread/:threadId/message', [
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

    // Verify thread belongs to client
    const thread = await FeedbackThread.findOne({
      where: { 
        thread_id: req.params.threadId,
        client_id: req.user.id
      }
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
        message: 'Cannot add message to closed thread'
      });
    }

    // Create message
    const message = await FeedbackMessage.create({
      thread_id: req.params.threadId,
      sender_id: req.user.id,
      sender_type: 'client',
      message: req.body.message,
      is_read: false
    });

    // Update thread status and timestamp
    await thread.update({ 
      status: 'open',
      updated_at: new Date()
    });

    // Include sender details in response
    const messageWithSender = await FeedbackMessage.findByPk(message.id, {
      include: [{ 
        model: User, 
        as: 'sender', 
        attributes: ['id', 'fullname', 'role'] 
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: messageWithSender
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH: Mark messages as read
router.patch('/thread/:threadId/read', async (req, res) => {
  try {
    // Verify thread belongs to client
    const thread = await FeedbackThread.findOne({
      where: { 
        thread_id: req.params.threadId,
        client_id: req.user.id
      }
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Mark admin messages as read
    const [updatedCount] = await FeedbackMessage.update(
      { is_read: true },
      {
        where: {
          thread_id: req.params.threadId,
          sender_type: 'admin',
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
      markedCount: updatedCount
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH: Update thread status (client can only reopen closed threads)
router.patch('/thread/:threadId/status', [
  body('status').isIn(['open']).withMessage('Clients can only reopen threads')
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
      where: { 
        thread_id: req.params.threadId,
        client_id: req.user.id
      }
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    if (thread.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Thread is not closed'
      });
    }

    await thread.update({ 
      status: 'open',
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Thread reopened successfully',
      data: thread
    });

  } catch (error) {
    console.error('Error updating thread status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update thread status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;