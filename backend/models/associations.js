const User = require('./User');
const Order = require('./Order');
const Bill = require('./Bill');
const Campaign = require('./Campaign');
const Lead = require('./Lead');
const Task = require('./Task');
const Document = require('./Document');
const { FeedbackThread, FeedbackMessage } = require('./FeedbackThread');

// User associations
User.hasMany(Order, { foreignKey: 'client_id', as: 'clientOrders' });
User.hasMany(Order, { foreignKey: 'created_by', as: 'createdOrders' });
User.hasMany(Bill, { foreignKey: 'client_id', as: 'clientBills' });
User.hasMany(Bill, { foreignKey: 'created_by', as: 'createdBills' });
User.hasMany(Campaign, { foreignKey: 'created_by', as: 'campaigns' });
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assignedLeads' });
User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
User.hasMany(Document, { foreignKey: 'uploaded_by', as: 'documents' });
User.hasMany(FeedbackThread, { foreignKey: 'client_id', as: 'feedbackThreads' });
User.hasMany(FeedbackMessage, { foreignKey: 'sender_id', as: 'feedbackMessages' });

// Order associations
Order.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Order.hasMany(Bill, { foreignKey: 'order_id', as: 'bills' });

// Bill associations
Bill.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
Bill.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Bill.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Campaign associations
Campaign.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Campaign.hasMany(Lead, { foreignKey: 'campaign_id', as: 'leads' });

// Lead associations
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Lead.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

// Task associations
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// Document associations
Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
Document.belongsTo(Document, { foreignKey: 'parent_document_id', as: 'parentDocument' });
Document.hasMany(Document, { foreignKey: 'parent_document_id', as: 'versions' });

// Feedback associations
FeedbackThread.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
FeedbackThread.hasMany(FeedbackMessage, { 
  foreignKey: 'thread_id', 
  sourceKey: 'thread_id', 
  as: 'messages' 
});

FeedbackMessage.belongsTo(FeedbackThread, { 
  foreignKey: 'thread_id', 
  targetKey: 'thread_id', 
  as: 'thread' 
});
FeedbackMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

module.exports = {
  User,
  Order,
  Bill,
  Campaign,
  Lead,
  Task,
  Document,
  FeedbackThread,
  FeedbackMessage
};
        