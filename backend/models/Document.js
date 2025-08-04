// backend/models/Document.js - Document management model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  document_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  access_level: {
    type: DataTypes.ENUM('public', 'internal', 'restricted', 'private'),
    defaultValue: 'internal'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  parent_document_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Documents',
      key: 'id'
    }
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (document) => {
      if (!document.document_id) {
        document.document_id = `DOC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
    }
  }
});

module.exports = Document;