// backend/models/User.js - Enhanced user model
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../database/connection');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  fullname: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [2, 255],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      len: [10, 15],
      isNumeric: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('client', 'sales_purchase', 'marketing', 'office', 'admin'),
    allowNull: false,
    defaultValue: 'client'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'inactive'),
    defaultValue: 'pending'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  employee_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  approval_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profile_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
      // Generate user_id if not provided
      if (!user.user_id) {
        user.user_id = `USER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
      // Set approval requirement based on role
      user.approval_required = ['sales_purchase', 'marketing', 'office'].includes(user.role);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

module.exports = User;
