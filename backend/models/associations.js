// backend/models/associations.js - Model relationships
const User = require('./User');
const Order = require('./Order');
const { FeedbackThread, FeedbackMessage } = require('./FeedbackThread');
const Bill = require('./Bill');

// User associations
User.hasMany(Order, { foreignKey: 'client_id', as: 'clientOrders' });
User.hasMany(Order, { foreignKey: 'created_by', as: 'createdOrders' });
User.hasMany(FeedbackThread, { foreignKey: 'client_id', as: 'feedbackThreads' });
User.hasMany(FeedbackMessage, { foreignKey: 'sender_id', as: 'feedbackMessages' });
User.hasMany(Bill, { foreignKey: 'client_id', as: 'clientBills' });
User.hasMany(Bill, { foreignKey: 'created_by', as: 'createdBills' });

// Order associations
Order.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Order.hasMany(Bill, { foreignKey: 'order_id', as: 'bills' });

// Feedback associations
FeedbackThread.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
FeedbackThread.hasMany(FeedbackMessage, { foreignKey: 'thread_id', sourceKey: 'thread_id', as: 'messages' });

FeedbackMessage.belongsTo(FeedbackThread, { foreignKey: 'thread_id', targetKey: 'thread_id', as: 'thread' });
FeedbackMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Bill associations
Bill.belongsTo(User, { foreignKey: 'client_id', as: 'client' });
Bill.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Bill.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
