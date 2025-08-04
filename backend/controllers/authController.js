// backend/controllers/authController.js - Authentication controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const { validationResult } = require('express-validator');

class AuthController {
  // Generate JWT tokens
  generateTokens(user) {
    const payload = {
      id: user.id,
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      status: user.status
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { 
      expiresIn: '15m' 
    });
    
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { 
      expiresIn: '7d' 
    });

    return { accessToken, refreshToken };
  }

  // Register new user
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { fullname, email, phone, password, role, department, employee_id } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { phone }]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email or phone'
        });
      }

      // Create user
      const userData = {
        fullname,
        email: email.toLowerCase(),
        phone,
        password_hash: password,
        role,
        department,
        employee_id,
        status: ['sales_purchase', 'marketing', 'office'].includes(role) ? 'pending' : 'approved'
      };

      const user = await User.create(userData);
      const tokens = this.generateTokens(user);

      res.status(201).json({
        success: true,
        message: user.approval_required ? 
          'Registration successful. Awaiting admin approval.' : 
          'Registration successful',
        data: {
          user: user.toJSON(),
          tokens,
          requiresApproval: user.approval_required
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ 
        where: { email: email.toLowerCase() } 
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is approved (for employee roles)
      if (user.approval_required && user.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Account pending approval',
          data: { status: user.status }
        });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate tokens
      const tokens = this.generateTokens(user);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          tokens
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      const tokens = this.generateTokens(user);

      res.json({
        success: true,
        data: { tokens }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Don't allow updating sensitive fields
      const allowedFields = ['fullname', 'phone', 'preferences'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user.toJSON()
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await user.update({ password_hash: newPassword });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
