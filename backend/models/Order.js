// backend/models/Order.js - Enhanced order model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_number: {
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
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  product_category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'pcs'
  },
  unit_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  order_type: {
    type: DataTypes.ENUM('sale', 'purchase'),
    defaultValue: 'sale'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  expected_delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  actual_delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (order) => {
      // Generate order number if not provided
      if (!order.order_number) {
        order.order_number = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
      // Calculate total amount
      if (order.unit_price && order.quantity) {
        const subtotal = order.unit_price * order.quantity;
        const discountAmount = subtotal * (order.discount / 100);
        order.total_amount = subtotal - discountAmount;
      }
    },
    beforeUpdate: (order) => {
      // Recalculate total if price or quantity changes
      if (order.changed('unit_price') || order.changed('quantity') || order.changed('discount')) {
        if (order.unit_price && order.quantity) {
          const subtotal = order.unit_price * order.quantity;
          const discountAmount = subtotal * (order.discount / 100);
          order.total_amount = subtotal - discountAmount;
        }
      }
    }
  }
});

module.exports = Order;