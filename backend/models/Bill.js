// backend/models/Bill.js - Bill model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Bill = sequelize.define('Bill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bill_number: {
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
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Orders',
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
  bill_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue'),
    defaultValue: 'pending'
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  items: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'bills',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (bill) => {
      if (!bill.bill_number) {
        bill.bill_number = `BILL_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
      // Calculate total if not provided
      if (!bill.total_amount) {
        bill.total_amount = bill.subtotal + (bill.tax_amount || 0) - (bill.discount_amount || 0);
      }
    },
    beforeUpdate: (bill) => {
      if (bill.changed('subtotal') || bill.changed('tax_amount') || bill.changed('discount_amount')) {
        bill.total_amount = bill.subtotal + (bill.tax_amount || 0) - (bill.discount_amount || 0);
      }
    }
  }
});

module.exports = Bill;
