// backend/controllers/authController.js - Authentication controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');
const emailService = require('../services/emailService');

class AuthController {
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

      const { fullname, email, password, phone, role = 'client' } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Determine if approval is required
      const approval_required = ['sales_purchase', 'marketing', 'office'].includes(role);

      // Create user
      const user = await User.create({
        fullname,
        email,
        password: hashedPassword,
        phone,
        role,
        status: approval_required ? 'pending' : 'active',
        approval_required
      });

      // Send welcome email
      await emailService.sendWelcomeEmail(user);

      res.status(201).json({
        success: true,
        message: approval_required 
          ? 'Registration successful. Your account is pending admin approval.'
          : 'Registration successful. You can now log in.',
        data: {
          user: {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status
          }
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        let message = 'Account is not active';
        if (user.status === 'pending') {
          message = 'Account is pending admin approval';
        } else if (user.status === 'suspended') {
          message = 'Account has been suspended';
        }
        
        return res.status(403).json({
          success: false,
          message
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtConfig.access.secret,
        { expiresIn: jwtConfig.access.expiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        jwtConfig.refresh.secret,
        { expiresIn: jwtConfig.refresh.expiresIn }
      );

      // Update last login
      await user.update({ last_login: new Date() });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, jwtConfig.refresh.secret);
      
      // Find user
      const user = await User.findByPk(decoded.userId);
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        jwtConfig.access.secret,
        { expiresIn: jwtConfig.access.expiresIn }
      );

      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        { userId: user.id },
        jwtConfig.refresh.secret,
        { expiresIn: jwtConfig.refresh.expiresIn }
      );

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken
          }
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { fullname, phone } = req.body;
      
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ fullname, phone });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await user.update({ password: hashedPassword });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
}

module.exports = new AuthController();