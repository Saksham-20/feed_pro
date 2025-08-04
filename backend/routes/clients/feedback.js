const express = require('express');
const { body, validationResult } = require('express-validator');
const { FeedbackThread, FeedbackMessage } = require('../../models/FeedbackThread');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
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
    const threads = await FeedbackThread.findAll({
      where: { client_id: req.user.id },
      include: [
        {
          model: FeedbackMessage,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{ model: User, as: 'sender', attributes: ['fullname'] }]
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      data: threads
    });

  } catch (error) {
    console.error('Error fetching feedback threads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
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

    // Create thread
    const thread = await FeedbackThread.create({
      client_id: req.user.id,
      subject,
      category,
      priority
    });

    // Create initial message
    await FeedbackMessage.create({
      thread_id: thread.thread_id,
      sender_id: req.user.id,
      sender_type: 'client',
      message
    });

    // Return thread with initial message
    const threadWithMessages = await FeedbackThread.findByPk(thread.id, {
      include: [
        {
          model: FeedbackMessage,
          as: 'messages',
          include: [{ model: User, as: 'sender', attributes: ['fullname'] }]
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
      error: error.message
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
      message: req.body.message
    });

    // Update thread status and timestamp
    await thread.update({ 
      status: 'open',
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
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
    await FeedbackMessage.update(
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

module.exports = router;
