// backend/services/emailService.js - Email service (FIXED)
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    if (!process.env.SMTP_HOST) {
      console.warn('Email service not configured - SMTP settings missing');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.warn('Email service not available');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Business Hub';
    const html = `
      <h2>Welcome ${user.fullname}!</h2>
      <p>Your account has been created successfully.</p>
      ${user.approval_required ? 
        '<p>Your account is pending admin approval. You will be notified once approved.</p>' :
        '<p>You can now log in and start using the platform.</p>'
      }
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  async sendApprovalNotification(user, approved = true) {
    const subject = approved ? 'Account Approved' : 'Account Update';
    const html = approved ? 
      `<h2>Congratulations ${user.fullname}!</h2>
       <p>Your account has been approved. You can now log in to the platform.</p>` :
      `<h2>Account Status Update</h2>
       <p>Hello ${user.fullname}, there has been an update to your account status.</p>`;

    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Password Reset Request';
    const html = `
      <h2>Password Reset</h2>
      <p>Hello ${user.fullname},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }
}

module.exports = new EmailService();