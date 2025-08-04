// backend/models/Document.js - Document management model
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('contract', 'invoice', 'report', 'policy', 'manual', 'certificate', 'other'),
    defaultValue: 'other'
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
    allowNull: false,
    comment: 'File size in bytes'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'archived', 'expired'),
    defaultValue: 'draft'
  },
  is_confidential: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  review_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  access_permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      public: false,
      roles: [],
      users: []
    },
    comment: 'Access control configuration'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional document metadata'
  },
  checksum: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'File integrity checksum'
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_accessed: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'documents',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeUpdate: (document) => {
      // Auto-expire document if expiry date has passed
      if (document.expiry_date && new Date() > document.expiry_date && document.status !== 'expired') {
        document.status = 'expired';
      }
    }
  },
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['status']
    },
    {
      fields: ['uploaded_by']
    },
    {
      fields: ['is_confidential']
    },
    {
      fields: ['expiry_date']
    }
  ]
});

module.exports = Document;