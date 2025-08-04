// backend/services/notificationService.js - Notification service
const emailService = require('./emailService');

class NotificationService {
  constructor() {
    this.notifications = []; // In-memory storage for demo - use Redis in production
  }

  // Create notification
  async createNotification(data) {
    const notification = {
      id: Date.now(),
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      category: data.category || 'general',
      isRead: false,
      data: data.data || {},
      createdAt: new Date(),
      expiresAt: data.expiresAt || null
    };

    this.notifications.push(notification);
    
    // Send email if required
    if (data.sendEmail && data.user) {
      await this.sendEmailNotification(data.user, notification);
    }

    return notification;
  }

  // Get user notifications
  getUserNotifications(userId, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    
    let userNotifications = this.notifications.filter(n => 
      n.userId === userId && 
      (!unreadOnly || !n.isRead) &&
      (!n.expiresAt || new Date() < n.expiresAt)
    );

    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => b.createdAt - a.createdAt);

    return {
      notifications: userNotifications.slice(offset, offset + limit),
      total: userNotifications.length,
      unreadCount: userNotifications.filter(n => !n.isRead).length
    };
  }

  // Mark notification as read
  markAsRead(notificationId, userId) {
    const notification = this.notifications.find(n => 
      n.id === notificationId && n.userId === userId
    );
    
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      return true;
    }
    
    return false;
  }

  // Mark all user notifications as read
  markAllAsRead(userId) {
    let count = 0;
    this.notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date();
        count++;
      }
    });
    return count;
  }

  // Delete notification
  deleteNotification(notificationId, userId) {
    const index = this.notifications.findIndex(n => 
      n.id === notificationId && n.userId === userId
    );
    
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    
    return false;
  }

  // Send email notification
  async sendEmailNotification(user, notification) {
    const subject = `${notification.title} - Business Hub`;
    const html = `
      <h2>${notification.title}</h2>
      <p>${notification.message}</p>
      <hr>
      <p><small>This is an automated notification from Business Hub.</small></p>
    `;

    return emailService.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  // Notification templates
  static templates = {
    ORDER_CREATED: {
      title: 'New Order Created',
      message: 'A new order has been created and requires your attention.',
      type: 'success',
      category: 'orders'
    },
    ORDER_UPDATED: {
      title: 'Order Updated',
      message: 'An order has been updated.',
      type: 'info',
      category: 'orders'
    },
    BILL_GENERATED: {
      title: 'Bill Generated',
      message: 'A new bill has been generated.',
      type: 'info',
      category: 'billing'
    },
    PAYMENT_RECEIVED: {
      title: 'Payment Received',
      message: 'Payment has been received for a bill.',
      type: 'success',
      category: 'billing'
    },
    FEEDBACK_RECEIVED: {
      title: 'New Feedback',
      message: 'New feedback has been received from a client.',
      type: 'info',
      category: 'support'
    },
    TASK_ASSIGNED: {
      title: 'Task Assigned',
      message: 'A new task has been assigned to you.',
      type: 'info',
      category: 'tasks'
    },
    TASK_OVERDUE: {
      title: 'Task Overdue',
      message: 'You have overdue tasks that need attention.',
      type: 'warning',
      category: 'tasks'
    },
    ACCOUNT_APPROVED: {
      title: 'Account Approved',
      message: 'Your account has been approved and is now active.',
      type: 'success',
      category: 'account'
    },
    LEAD_ASSIGNED: {
      title: 'Lead Assigned',
      message: 'A new lead has been assigned to you.',
      type: 'info',
      category: 'leads'
    },
    CAMPAIGN_STARTED: {
      title: 'Campaign Started',
      message: 'A marketing campaign has been started.',
      type: 'info',
      category: 'marketing'
    }
  };

  // Helper methods for common notifications
  async notifyOrderCreated(userId, order, user = null) {
    const template = NotificationService.templates.ORDER_CREATED;
    return this.createNotification({
      userId,
      title: template.title,
      message: `Order #${order.order_number} has been created successfully.`,
      type: template.type,
      category: template.category,
      data: { orderId: order.id, orderNumber: order.order_number },
      user,
      sendEmail: !!user
    });
  }

  async notifyBillGenerated(userId, bill, user = null) {
    const template = NotificationService.templates.BILL_GENERATED;
    return this.createNotification({
      userId,
      title: template.title,
      message: `Bill #${bill.bill_number} has been generated.`,
      type: template.type,
      category: template.category,
      data: { billId: bill.id, billNumber: bill.bill_number },
      user,
      sendEmail: !!user
    });
  }

  async notifyFeedbackReceived(userId, feedback, user = null) {
    const template = NotificationService.templates.FEEDBACK_RECEIVED;
    return this.createNotification({
      userId,
      title: template.title,
      message: `New feedback: "${feedback.subject}"`,
      type: template.type,
      category: template.category,
      data: { threadId: feedback.thread_id, subject: feedback.subject },
      user,
      sendEmail: !!user
    });
  }

  async notifyTaskAssigned(userId, task, user = null) {
    const template = NotificationService.templates.TASK_ASSIGNED;
    return this.createNotification({
      userId,
      title: template.title,
      message: `Task "${task.title}" has been assigned to you.`,
      type: template.type,
      category: template.category,
      data: { taskId: task.id, taskTitle: task.title },
      user,
      sendEmail: !!user
    });
  }

  async notifyAccountApproved(userId, user) {
    const template = NotificationService.templates.ACCOUNT_APPROVED;
    return this.createNotification({
      userId,
      title: template.title,
      message: 'Your account has been approved and you can now access all features.',
      type: template.type,
      category: template.category,
      user,
      sendEmail: true
    });
  }

  async notifyLeadAssigned(userId, lead, user = null) {
    const template = NotificationService.templates.LEAD_ASSIGNED;
    return this.createNotification({
      userId,
      title: template.title,
      message: `Lead "${lead.name}" from ${lead.company || 'Unknown Company'} has been assigned to you.`,
      type: template.type,
      category: template.category,
      data: { leadId: lead.id, leadName: lead.name, company: lead.company },
      user,
      sendEmail: !!user
    });
  }

  // Bulk notifications
  async notifyMultipleUsers(userIds, notificationData) {
    const promises = userIds.map(userId => 
      this.createNotification({ ...notificationData, userId })
    );
    return Promise.all(promises);
  }

  // Clean up expired notifications
  cleanupExpiredNotifications() {
    const now = new Date();
    this.notifications = this.notifications.filter(n => 
      !n.expiresAt || n.expiresAt > now
    );
  }

  // Get notification statistics
  getStats(userId) {
    const userNotifications = this.notifications.filter(n => n.userId === userId);
    const categories = {};
    
    userNotifications.forEach(n => {
      if (!categories[n.category]) {
        categories[n.category] = { total: 0, unread: 0 };
      }
      categories[n.category].total++;
      if (!n.isRead) {
        categories[n.category].unread++;
      }
    });

    return {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.isRead).length,
      categories
    };
  }
}

module.exports = new NotificationService();