// backend/models/FeedbackMessage.js - Individual feedback message model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

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
  message_type: {
    type: DataTypes.ENUM('text', 'file', 'system'),
    defaultValue: 'text'
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of file attachments with metadata'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_internal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Internal admin notes not visible to client'
  },
  reply_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'FeedbackMessages',
      key: 'id'
    },
    comment: 'Reference to message being replied to'
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  edited_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional message metadata like reactions, mentions, etc.'
  },
  priority_flag: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Flag for important messages'
  }
}, {
  tableName: 'feedback_messages',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (message) => {
      // Set read timestamp when marking as read
      if (message.changed('is_read') && message.is_read && !message.read_at) {
        message.read_at = new Date();
      }
    }
  },
  indexes: [
    {
      fields: ['thread_id']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['sender_type']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['thread_id', 'created_at']
    }
  ]
});

module.exports = FeedbackMessage;