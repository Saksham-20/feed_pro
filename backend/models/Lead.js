// backend/models/Lead.js - Lead management model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  company: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  designation: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  source: {
    type: DataTypes.ENUM('website', 'social_media', 'referral', 'cold_call', 'email', 'event', 'other'),
    defaultValue: 'other'
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'),
    defaultValue: 'new'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  estimated_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  probability: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
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
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  campaign_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Campaigns',
      key: 'id'
    }
  },
  expected_close_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_contact_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  next_follow_up: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  contact_history: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  custom_fields: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'leads',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (lead) => {
      // Update last contact date if status changed to contacted
      if (lead.changed('status') && lead.status === 'contacted') {
        lead.last_contact_date = new Date();
      }
    }
  }
});

module.exports = Lead;