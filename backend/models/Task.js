// backend/models/Task.js - Task management model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.STRING(100),
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
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  completed_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  estimated_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  actual_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (task) => {
      if (!task.task_id) {
        task.task_id = `TASK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
    },
    beforeUpdate: (task) => {
      if (task.changed('status') && task.status === 'completed' && !task.completed_date) {
        task.completed_date = new Date();
      }
    }
  }
});

module.exports = Task;