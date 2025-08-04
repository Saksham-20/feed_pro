// backend/models/Campaign.js - Marketing campaign model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaign_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('field', 'digital', 'email', 'sms', 'social'),
    allowNull: false,
    defaultValue: 'field'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  target_audience: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  territory: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  goals: {
    type: DataTypes.JSON,
    allowNull: true
  },
  metrics: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      leads_generated: 0,
      conversions: 0,
      reach: 0,
      engagement: 0
    }
  }
}, {
  tableName: 'campaigns',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (campaign) => {
      if (!campaign.campaign_id) {
        campaign.campaign_id = `CAMP_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
    }
  }
});

module.exports = Campaign;