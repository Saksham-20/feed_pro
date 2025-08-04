// backend/routes/employees/office.js - Office employee routes
const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../../models/Task');
const Document = require('../../models/Document');
const User = require('../../models/User');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);
router.use(authorizeRole(['office', 'admin']));

// GET: Dashboard data for office employee
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get office statistics
    const [
      pendingTasks,
      completedTasks,
      overdueTasks,
      totalDocuments,
      reportsThisMonth,
      activeWorkflows
    ] = await Promise.all([
      Task.count({
        where: {
          [Op.or]: [
            { created_by: userId },
            { assigned_to: userId }
          ],
          status: 'pending'
        }
      }),
      Task.count({
        where: {
          [Op.or]: [
            { created_by: userId },
            { assigned_to: userId }
          ],
          status: 'completed'
        }
      }),
      Task.count({
        where: {
          [Op.or]: [
            { created_by: userId },
            { assigned_to: userId }
          ],
          due_date: { [Op.lt]: new Date() },
          status: { [Op.ne]: 'completed' }
        }
      }),
      Document.count({ where: { uploaded_by: userId } }),
      // Mock data for reports
      Promise.resolve(8),
      // Mock data for workflows
      Promise.resolve(5)
    ]);

    const dashboardData = {
      tasks: {
        pending: pendingTasks || 0,
        completed: completedTasks || 0,
        overdue: overdueTasks || 0
      },
      documents: {
        recent: [],
        totalFiles: totalDocuments || 0
      },
      reports: {
        thisMonth: reportsThisMonth,
        pending: 2
      },
      workflow: {
        active: activeWorkflows,
        completed: 23
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching office dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// GET: Get tasks for office employee
router.get('/tasks', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {
      [Op.or]: [
        { created_by: req.user.id },
        { assigned_to: req.user.id }
      ]
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['fullname'] },
        { model: User, as: 'assignee', attributes: ['fullname'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// POST: Create new task
router.post('/tasks', [
  body('title').trim().isLength({ min: 3 }).withMessage('Task title is required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('due_date').optional().isDate()
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

    const taskData = {
      ...req.body,
      created_by: req.user.id,
      assigned_to: req.body.assigned_to || req.user.id
    };

    const task = await Task.create(taskData);

    // Include relations in response
    const taskWithRelations = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['fullname'] },
        { model: User, as: 'assignee', attributes: ['fullname'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: taskWithRelations
    });

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// PUT: Update task
router.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { created_by: req.user.id },
          { assigned_to: req.user.id }
        ]
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.update(req.body);

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'creator', attributes: ['fullname'] },
        { model: User, as: 'assignee', attributes: ['fullname'] }
      ]
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

module.exports = router;
