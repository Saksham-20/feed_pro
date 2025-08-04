// backend/services/analyticsService.js - Analytics and reporting service
const { Op } = require('sequelize');
const User = require('../models/User');
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const Task = require('../models/Task');
const { FeedbackThread } = require('../models/FeedbackThread');
const sequelize = require('../database/connection');

class AnalyticsService {
  // Dashboard overview analytics
  async getDashboardAnalytics(userId, userRole, dateRange = {}) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    
    const baseWhere = {
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Role-based filtering
    const userFilter = this.getUserFilter(userId, userRole);

    try {
      const [
        userStats,
        orderStats,
        revenueStats,
        customerStats,
        leadStats,
        taskStats
      ] = await Promise.all([
        this.getUserAnalytics(baseWhere),
        this.getOrderAnalytics(baseWhere, userFilter),
        this.getRevenueAnalytics(baseWhere, userFilter),
        this.getCustomerAnalytics(baseWhere, userFilter),
        this.getLeadAnalytics(baseWhere, userFilter),
        this.getTaskAnalytics(baseWhere, userFilter)
      ]);

      return {
        users: userStats,
        orders: orderStats,
        revenue: revenueStats,
        customers: customerStats,
        leads: leadStats,
        tasks: taskStats,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      throw error;
    }
  }

  // Sales analytics
  async getSalesAnalytics(userId, userRole, dateRange = {}) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    const userFilter = this.getUserFilter(userId, userRole);

    const orders = await Order.findAll({
      where: {
        created_at: { [Op.between]: [startDate, endDate] },
        ...userFilter
      },
      include: [
        { model: User, as: 'client', attributes: ['fullname', 'email'] },
        { model: User, as: 'creator', attributes: ['fullname'] }
      ]
    });

    const bills = await Bill.findAll({
      where: {
        created_at: { [Op.between]: [startDate, endDate] },
        ...userFilter
      }
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status breakdown
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Monthly trends
    const monthlyTrends = this.calculateMonthlyTrends(orders, 'total_amount');

    return {
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        conversionRate: this.calculateConversionRate(orders, bills)
      },
      ordersByStatus,
      monthlyTrends,
      topCustomers: await this.getTopCustomers(dateRange),
      recentOrders: orders.slice(0, 10)
    };
  }

  // Marketing analytics
  async getMarketingAnalytics(userId, userRole, dateRange = {}) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    const userFilter = this.getUserFilter(userId, userRole);

    const [campaigns, leads] = await Promise.all([
      Campaign.findAll({
        where: {
          created_at: { [Op.between]: [startDate, endDate] },
          ...userFilter
        }
      }),
      Lead.findAll({
        where: {
          created_at: { [Op.between]: [startDate, endDate] },
          ...userFilter
        }
      })
    ]);

    // Campaign performance
    const campaignPerformance = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      budget: parseFloat(campaign.budget),
      spent: parseFloat(campaign.spent_amount),
      leads: leads.filter(lead => lead.campaign_id === campaign.id).length,
      conversions: leads.filter(lead => 
        lead.campaign_id === campaign.id && lead.status === 'converted'
      ).length,
      roi: this.calculateROI(campaign.spent_amount, campaign.budget)
    }));

    // Lead funnel
    const leadFunnel = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    // Lead sources
    const leadSources = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalLeads: leads.length,
        convertedLeads: leads.filter(l => l.status === 'converted').length,
        conversionRate: (leads.filter(l => l.status === 'converted').length / leads.length * 100) || 0
      },
      campaignPerformance,
      leadFunnel,
      leadSources,
      monthlyLeads: this.calculateMonthlyTrends(leads, null, true)
    };
  }

  // Financial analytics
  async getFinancialAnalytics(dateRange = {}) {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const bills = await Bill.findAll({
      where: {
        created_at: { [Op.between]: [startDate, endDate] }
      },
      include: [{ model: User, as: 'client', attributes: ['fullname'] }]
    });

    const totalRevenue = bills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const paidBills = bills.filter(bill => bill.status === 'paid');
    const overdueBills = bills.filter(bill => 
      bill.status === 'overdue' || 
      (bill.due_date && new Date() > bill.due_date && bill.status !== 'paid')
    );

    const paidAmount = paidBills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const overdueAmount = overdueBills.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
    const pendingAmount = totalRevenue - paidAmount - overdueAmount;

    return {
      summary: {
        totalRevenue,
        paidAmount,
        pendingAmount,
        overdueAmount,
        collectionRate: (paidAmount / totalRevenue * 100) || 0
      },
      billsByStatus: bills.reduce((acc, bill) => {
        acc[bill.status] = (acc[bill.status] || 0) + 1;
        return acc;
      }, {}),
      monthlyRevenue: this.calculateMonthlyTrends(bills, 'total_amount'),
      topPayingCustomers: await this.getTopPayingCustomers(dateRange),
      overdueInvoices: overdueBills.slice(0, 10)
    };
  }

  // Helper methods
  getDateRange(dateRange) {
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    const startDate = dateRange.startDate ? 
      new Date(dateRange.startDate) : 
      new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    return { startDate, endDate };
  }

  getUserFilter(userId, userRole) {
    if (userRole === 'admin') {
      return {}; // Admin can see all data
    } else if (['sales_purchase', 'marketing', 'office'].includes(userRole)) {
      return { created_by: userId }; // Users can see their own data
    } else {
      return { client_id: userId }; // Clients can see their own data
    }
  }

  async getUserAnalytics(baseWhere) {
    const users = await User.findAll({
      attributes: [
        'role',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role', 'status'],
      raw: true
    });

    return {
      byRole: users.reduce((acc, user) => {
        if (!acc[user.role]) acc[user.role] = {};
        acc[user.role][user.status] = parseInt(user.count);
        return acc;
      }, {}),
      total: users.reduce((sum, user) => sum + parseInt(user.count), 0)
    };
  }

  async getOrderAnalytics(baseWhere, userFilter) {
    const orders = await Order.findAll({
      where: { ...baseWhere, ...userFilter },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_value']
      ],
      group: ['status'],
      raw: true
    });

    return orders.reduce((acc, order) => {
      acc[order.status] = {
        count: parseInt(order.count),
        value: parseFloat(order.total_value) || 0
      };
      return acc;
    }, {});
  }

  async getRevenueAnalytics(baseWhere, userFilter) {
    const revenue = await Bill.findAll({
      where: { ...baseWhere, ...userFilter },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      raw: true
    });

    return {
      total: parseFloat(revenue[0]?.total) || 0,
      average: parseFloat(revenue[0]?.average) || 0,
      count: parseInt(revenue[0]?.count) || 0
    };
  }

  async getCustomerAnalytics(baseWhere, userFilter) {
    const customers = await Customer.count({
      where: { ...baseWhere, ...userFilter }
    });

    return { total: customers };
  }

  async getLeadAnalytics(baseWhere, userFilter) {
    const leads = await Lead.findAll({
      where: { ...baseWhere, ...userFilter },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return leads.reduce((acc, lead) => {
      acc[lead.status] = parseInt(lead.count);
      return acc;
    }, {});
  }

  async getTaskAnalytics(baseWhere, userFilter) {
    const tasks = await Task.findAll({
      where: { ...baseWhere, ...userFilter },
      attributes: [
        'status',
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status', 'priority'],
      raw: true
    });

    return {
      byStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + parseInt(task.count);
        return acc;
      }, {}),
      byPriority: tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + parseInt(task.count);
        return acc;
      }, {})
    };
  }

  calculateMonthlyTrends(data, valueField, countOnly = false) {
    const months = {};
    
    data.forEach(item => {
      const month = new Date(item.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!months[month]) {
        months[month] = { count: 0, value: 0 };
      }
      months[month].count++;
      if (!countOnly && valueField && item[valueField]) {
        months[month].value += parseFloat(item[valueField]);
      }
    });

    return Object.keys(months).sort().map(month => ({
      month,
      count: months[month].count,
      value: months[month].value
    }));
  }

  calculateConversionRate(orders, bills) {
    if (orders.length === 0) return 0;
    const paidOrders = bills.filter(bill => bill.status === 'paid').length;
    return (paidOrders / orders.length * 100);
  }

  calculateROI(spent, budget) {
    if (spent === 0) return 0;
    return ((budget - spent) / spent * 100);
  }

  async getTopCustomers(dateRange, limit = 10) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    
    const topCustomers = await Customer.findAll({
      attributes: [
        'id', 'name', 'email', 'total_spent',
        [sequelize.fn('COUNT', sequelize.col('Orders.id')), 'order_count']
      ],
      include: [{
        model: Order,
        as: 'orders',
        where: {
          created_at: { [Op.between]: [startDate, endDate] }
        },
        required: false
      }],
      group: ['Customer.id'],
      order: [[sequelize.col('total_spent'), 'DESC']],
      limit
    });

    return topCustomers;
  }

  async getTopPayingCustomers(dateRange, limit = 10) {
    const { startDate, endDate } = this.getDateRange(dateRange);
    
    const topPayers = await Bill.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_paid'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bill_count']
      ],
      include: [{
        model: User,
        as: 'client',
        attributes: ['id', 'fullname', 'email']
      }],
      where: {
        created_at: { [Op.between]: [startDate, endDate] },
        status: 'paid'
      },
      group: ['client_id'],
      order: [[sequelize.col('total_paid'), 'DESC']],
      limit
    });

    return topPayers;
  }
}

module.exports = new AnalyticsService();