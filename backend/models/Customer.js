// backend/models/Customer.js - Customer management model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
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
  alternate_phone: {
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
  type: {
    type: DataTypes.ENUM('individual', 'business'),
    defaultValue: 'individual'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  category: {
    type: DataTypes.ENUM('regular', 'premium', 'vip'),
    defaultValue: 'regular'
  },
  address: {
    type: DataTypes.JSON,
    defaultValue: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India'
    }
  },
  billing_address: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'If null, uses main address'
  },
  shipping_address: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'If null, uses main address'
  },
  gst_number: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i
    }
  },
  pan_number: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i
    }
  },
  credit_limit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  payment_terms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 30,
    comment: 'Payment terms in days'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Sales person assigned'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  source: {
    type: DataTypes.ENUM('website', 'referral', 'cold_call', 'social_media', 'event', 'other'),
    defaultValue: 'other'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  custom_fields: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  social_profiles: {
    type: DataTypes.JSON,
    defaultValue: {
      linkedin: '',
      facebook: '',
      twitter: '',
      instagram: ''
    }
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      communication_method: 'email',
      newsletter: true,
      promotional_emails: true
    }
  },
  last_interaction: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_orders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_spent: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  last_order_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (customer) => {
      if (!customer.customer_code) {
        const currentYear = new Date().getFullYear();
        const count = await Customer.count({
          where: sequelize.where(
            sequelize.fn('YEAR', sequelize.col('created_at')),
            currentYear
          )
        });
        customer.customer_code = `CUST-${currentYear}-${String(count + 1).padStart(4, '0')}`;
      }
    }
  },
  indexes: [
    {
      fields: ['customer_code']
    },
    {
      fields: ['email']
    },
    {
      fields: ['phone']
    },
    {
      fields: ['status']
    },
    {
      fields: ['assigned_to']
    }
  ]
});

module.exports = Customer;