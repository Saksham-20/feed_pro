// backend/routes/shared/uploads.js - Shared file upload routes
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('../../middleware/auth');
const { upload, handleUploadError } = require('../../middleware/upload');
const { body, query, validationResult } = require('express-validator');
const Document = require('../../models/Document');
const User = require('../../models/User');
const Helpers = require('../../utils/helpers');
const uploadConfig = require('../../config/upload');
const router = express.Router();

// Apply authentication
router.use(authenticateToken);

// Validation middleware
const uploadValidation = [
  body('category').optional().isIn(Object.values(uploadConfig.categories)).withMessage('Invalid category'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('is_confidential').optional().isBoolean().withMessage('Confidential flag must be boolean'),
  body('tags').optional().isJSON().withMessage('Tags must be valid JSON array')
];

const downloadValidation = [
  query('download').optional().isBoolean().withMessage('Download flag must be boolean')
];

// POST: Upload files
router.post('/', upload.array('files', uploadConfig.maxFiles), handleUploadError, uploadValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const {
      category = 'general',
      title,
      description,
      is_confidential = false,
      tags = '[]'
    } = req.body;

    const uploadedFiles = [];
    const documents = [];

    for (const file of req.files) {
      // Generate file metadata
      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path.replace(/\\/g, '/'), // Normalize path separators
        url: `/uploads/${category}/${file.filename}`,
        uploadedAt: new Date().toISOString()
      };

      uploadedFiles.push(fileInfo);

      // Calculate file checksum for integrity
      const checksum = await Helpers.calculateFileChecksum(file.path);

      // Create document record
      const document = await Document.create({
        title: title || file.originalname,
        description: description || null,
        category,
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: req.user.id,
        is_confidential: is_confidential === 'true' || is_confidential === true,
        tags: JSON.parse(tags),
        checksum,
        access_permissions: {
          public: !is_confidential,
          roles: is_confidential ? ['admin'] : ['admin', 'sales_purchase', 'marketing', 'office'],
          users: []
        }
      });

      documents.push(document);
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        files: uploadedFiles,
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          file_name: doc.file_name,
          file_size: doc.file_size,
          mime_type: doc.mime_type,
          is_confidential: doc.is_confidential,
          created_at: doc.created_at
        }))
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to clean up file:', file.path, unlinkError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: List uploaded files/documents
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      my_files,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filter by category
    if (category && Object.values(uploadConfig.categories).includes(category)) {
      where.category = category;
    }

    // Filter by uploader (my files)
    if (my_files === 'true') {
      where.uploaded_by = req.user.id;
    }

    // Search functionality
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { file_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Access control - filter based on user role and permissions
    if (req.user.role !== 'admin') {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { uploaded_by: req.user.id }, // User's own files
        { is_confidential: false }, // Non-confidential files
        {
          // Files where user has explicit access
          access_permissions: {
            [Op.like]: `%"users":[%${req.user.id}%]%`
          }
        }
      ];
    }

    const { count, rows: documents } = await Document.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullname', 'role']
        }
      ],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response data
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      file_name: doc.file_name,
      file_size: doc.file_size,
      file_size_formatted: Helpers.formatFileSize(doc.file_size),
      mime_type: doc.mime_type,
      is_confidential: doc.is_confidential,
      tags: doc.tags,
      uploader: doc.uploader,
      download_count: doc.download_count,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      can_download: this.canUserDownload(doc, req.user),
      can_delete: this.canUserDelete(doc, req.user)
    }));

    res.json({
      success: true,
      data: {
        documents: formattedDocuments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          category,
          search,
          my_files: my_files === 'true'
        }
      }
    });

  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch uploaded files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: Download/view file
router.get('/:id', downloadValidation, async (req, res) => {
  try {
    const { id } = req.params;
    const { download = 'false' } = req.query;

    const document = await Document.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['fullname', 'role']
        }
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check access permissions
    if (!this.canUserDownload(document, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists on disk
    try {
      await fs.access(document.file_path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Update download count and last accessed
    await document.update({
      download_count: document.download_count + 1,
      last_accessed: new Date()
    });

    // Set appropriate headers
    const filename = document.file_name;
    const mimetype = document.mime_type;

    res.setHeader('Content-Type', mimetype);
    
    if (download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    }

    res.setHeader('Content-Length', document.file_size);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

    // Stream the file
    const fileStream = require('fs').createReadStream(document.file_path);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT: Update file metadata
router.put('/:id', uploadValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, description, category, is_confidential, tags } = req.body;

    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can update this document
    if (!this.canUserUpdate(document, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (is_confidential !== undefined) updateData.is_confidential = is_confidential;
    if (tags) updateData.tags = JSON.parse(tags);

    // Update access permissions based on confidentiality
    if (is_confidential !== undefined) {
      updateData.access_permissions = {
        public: !is_confidential,
        roles: is_confidential ? ['admin'] : ['admin', 'sales_purchase', 'marketing', 'office'],
        users: document.access_permissions?.users || []
      };
    }

    await document.update(updateData);

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        document: {
          id: document.id,
          title: document.title,
          description: document.description,
          category: document.category,
          is_confidential: document.is_confidential,
          tags: document.tags
        }
      }
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE: Delete file
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can delete this document
    if (!this.canUserDelete(document, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete physical file
    try {
      await fs.unlink(document.file_path);
    } catch (error) {
      console.warn('Failed to delete physical file:', document.file_path, error);
    }

    // Delete database record
    await document.destroy();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET: File categories
router.get('/meta/categories', (req, res) => {
  res.json({
    success: true,
    data: {
      categories: Object.values(uploadConfig.categories),
      maxFileSize: uploadConfig.maxFileSize,
      maxFiles: uploadConfig.maxFiles,
      allowedTypes: uploadConfig.allowedTypes
    }
  });
});

// GET: Upload statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Base query conditions
    const baseWhere = userRole === 'admin' ? {} : { uploaded_by: userId };

    const [
      totalDocuments,
      totalSize,
      myDocuments,
      documentsByCategory,
      documentsByType,
      recentUploads
    ] = await Promise.all([
      Document.count({ where: baseWhere }),
      Document.sum('file_size', { where: baseWhere }) || 0,
      Document.count({ where: { uploaded_by: userId } }),
      Document.findAll({
        where: baseWhere,
        attributes: [
          'category',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
          [require('sequelize').fn('SUM', require('sequelize').col('file_size')), 'size']
        ],
        group: ['category'],
        raw: true
      }),
      Document.findAll({
        where: baseWhere,
        attributes: [
          'mime_type',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['mime_type'],
        raw: true
      }),
      Document.findAll({
        where: {
          ...baseWhere,
          created_at: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['fullname']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalSize,
          totalSizeFormatted: Helpers.formatFileSize(totalSize),
          myDocuments,
          storageUsagePercentage: uploadConfig.maxTotalStorage ? 
            ((totalSize / uploadConfig.maxTotalStorage) * 100).toFixed(2) : null
        },
        byCategory: documentsByCategory.reduce((acc, item) => {
          acc[item.category] = {
            count: parseInt(item.count),
            size: parseInt(item.size || 0),
            sizeFormatted: Helpers.formatFileSize(parseInt(item.size || 0))
          };
          return acc;
        }, {}),
        byType: documentsByType.reduce((acc, item) => {
          const extension = item.mime_type.split('/')[1] || 'unknown';
          acc[extension] = parseInt(item.count);
          return acc;
        }, {}),
        recentUploads: recentUploads.map(doc => ({
          id: doc.id,
          title: doc.title,
          file_name: doc.file_name,
          file_size_formatted: Helpers.formatFileSize(doc.file_size),
          category: doc.category,
          uploader: doc.uploader?.fullname,
          created_at: doc.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upload statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Share document with users
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_ids = [], roles = [], message } = req.body;

    const document = await Document.findByPk(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can share this document
    if (!this.canUserUpdate(document, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update access permissions
    const currentPermissions = document.access_permissions || { public: false, roles: [], users: [] };
    const newPermissions = {
      ...currentPermissions,
      users: [...new Set([...currentPermissions.users, ...user_ids])],
      roles: [...new Set([...currentPermissions.roles, ...roles])]
    };

    await document.update({ access_permissions: newPermissions });

    // Send notifications to shared users
    if (user_ids.length > 0) {
      const notificationService = require('../../services/notificationService');
      const sharedUsers = await User.findAll({
        where: { id: { [require('sequelize').Op.in]: user_ids } }
      });

      for (const user of sharedUsers) {
        await notificationService.createNotification({
          userId: user.id,
          title: 'Document Shared',
          message: `${req.user.fullname} shared a document with you: "${document.title}"${message ? ` - ${message}` : ''}`,
          type: 'info',
          category: 'general',
          data: { documentId: document.id, sharedBy: req.user.fullname },
          user,
          sendEmail: true
        });
      }
    }

    res.json({
      success: true,
      message: 'Document shared successfully',
      data: {
        sharedWith: {
          users: user_ids.length,
          roles: roles.length
        }
      }
    });

  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST: Create folder/organize documents
router.post('/folders', async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // This is a simplified folder implementation
    // In a full implementation, you'd have a separate Folder model
    const folderDocument = await Document.create({
      title: name,
      description: description || null,
      category: 'folder',
      file_name: 'folder',
      file_path: '/virtual/folder',
      file_size: 0,
      mime_type: 'application/x-folder',
      uploaded_by: req.user.id,
      is_confidential: false,
      metadata: {
        is_folder: true,
        parent_id: parent_id || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: { folder: folderDocument }
    });

  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper methods for access control
function canUserDownload(document, user) {
  // Admin can download everything
  if (user.role === 'admin') return true;
  
  // User can download their own files
  if (document.uploaded_by === user.id) return true;
  
  // Check if file is public (non-confidential)
  if (!document.is_confidential) return true;
  
  // Check explicit permissions
  const permissions = document.access_permissions || {};
  
  // Check if user's role is allowed
  if (permissions.roles && permissions.roles.includes(user.role)) return true;
  
  // Check if user is explicitly allowed
  if (permissions.users && permissions.users.includes(user.id)) return true;
  
  return false;
}

function canUserUpdate(document, user) {
  // Admin can update everything
  if (user.role === 'admin') return true;
  
  // User can update their own files
  if (document.uploaded_by === user.id) return true;
  
  return false;
}

function canUserDelete(document, user) {
  // Admin can delete everything
  if (user.role === 'admin') return true;
  
  // User can delete their own files
  if (document.uploaded_by === user.id) return true;
  
  return false;
}

// Attach helper methods to router
router.canUserDownload = canUserDownload;
router.canUserUpdate = canUserUpdate;
router.canUserDelete = canUserDelete;

module.exports = router;