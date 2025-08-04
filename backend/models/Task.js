// backend/models/Task.js - Task management model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled', 'on_hold'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  actual_hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  progress_percentage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  dependencies: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of task IDs that this task depends on'
  },
  checklist: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of checklist items with completion status'
  },
  comments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  recurring: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'Recurring task configuration'
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (task) => {
      // Auto-complete task when progress reaches 100%
      if (task.changed('progress_percentage') && task.progress_percentage === 100 && task.status !== 'completed') {
        task.status = 'completed';
        task.completed_date = new Date();
      }
      
      // Set completed date when status changes to completed
      if (task.changed('status') && task.status === 'completed' && !task.completed_date) {
        task.completed_date = new Date();
        if (task.progress_percentage < 100) {
          task.progress_percentage = 100;
        }
      }
      
      // Clear completed date if status changes from completed
      if (task.changed('status') && task.status !== 'completed') {
        task.completed_date = null;
      }
    }
  }
});

module.exports = Task;