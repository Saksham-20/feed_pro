
// backend/models/Lead.js - Lead management model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lead_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  contact: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  interest: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  source: {
    type: DataTypes.ENUM('field', 'website', 'referral', 'social', 'email', 'phone'),
    defaultValue: 'field'
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'),
    defaultValue: 'new'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  assigned_to: {
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  follow_up_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  converted_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  conversion_value: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'leads',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (lead) => {
      if (!lead.lead_id) {
        lead.lead_id = `LEAD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
    },
    beforeUpdate: (lead) => {
      if (lead.changed('status') && lead.status === 'converted' && !lead.converted_date) {
        lead.converted_date = new Date();
      }
    }
  }
});

module.exports = Lead;