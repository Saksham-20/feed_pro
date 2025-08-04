// backend/models/Campaign.js - Marketing campaign model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('email', 'social_media', 'ppc', 'content', 'event', 'other'),
    defaultValue: 'other'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  spent_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  target_audience: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
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
  metrics: {
    type: DataTypes.JSON,
    defaultValue: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      leads_generated: 0,
      cost_per_click: 0,
      conversion_rate: 0
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
  tableName: 'campaigns',
  timestamps: true,
  underscored: true,
  validate: {
    endDateAfterStartDate() {
      if (this.start_date && this.end_date && this.end_date <= this.start_date) {
        throw new Error('End date must be after start date');
      }
    },
    budgetLimit() {
      if (this.budget && this.spent_amount > this.budget) {
        throw new Error('Spent amount cannot exceed budget');
      }
    }
  }
});

module.exports = Campaign;