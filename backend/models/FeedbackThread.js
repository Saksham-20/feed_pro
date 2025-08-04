// backend/models/FeedbackThread.js - Threaded feedback system
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const FeedbackThread = sequelize.define('FeedbackThread', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  thread_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('general', 'complaint', 'suggestion', 'support'),
    defaultValue: 'general'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open'
  }
}, {
  tableName: 'feedback_threads',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (thread) => {
      if (!thread.thread_id) {
        thread.thread_id = `THREAD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
    }
  }
});

const FeedbackMessage = sequelize.define('FeedbackMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  thread_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'FeedbackThreads',
      key: 'thread_id'
    }
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sender_type: {
    type: DataTypes.ENUM('client', 'admin'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'feedback_messages',
  timestamps: true,
  underscored: true
});

module.exports = { FeedbackThread, FeedbackMessage };