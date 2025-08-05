// src/utils/permissions.js (Enhanced version)
import { USER_ROLES } from './constants';

export const permissions = {
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  APPROVE_USERS: 'approve_users',
  DELETE_USERS: 'delete_users',
  VIEW_ALL_DATA: 'view_all_data',
  SYSTEM_SETTINGS: 'system_settings',
  MANAGE_ROLES: 'manage_roles',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_DATA: 'export_data',
  
  // Sales permissions
  MANAGE_CUSTOMERS: 'manage_customers',
  CREATE_ORDERS: 'create_orders',
  EDIT_ORDERS: 'edit_orders',
  DELETE_ORDERS: 'delete_orders',
  VIEW_SALES_DATA: 'view_sales_data',
  MANAGE_INVENTORY: 'manage_inventory',
  CREATE_BILLS: 'create_bills',
  
  // Marketing permissions
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  CREATE_CAMPAIGNS: 'create_campaigns',
  EDIT_CAMPAIGNS: 'edit_campaigns',
  DELETE_CAMPAIGNS: 'delete_campaigns',
  MANAGE_LEADS: 'manage_leads',
  VIEW_MARKETING_DATA: 'view_marketing_data',
  SEND_NOTIFICATIONS: 'send_notifications',
  
  // Office permissions
  MANAGE_TASKS: 'manage_tasks',
  CREATE_TASKS: 'create_tasks',
  ASSIGN_TASKS: 'assign_tasks',
  MANAGE_DOCUMENTS: 'manage_documents',
  UPLOAD_DOCUMENTS: 'upload_documents',
  GENERATE_REPORTS: 'generate_reports',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Client permissions
  CREATE_CLIENT_ORDERS: 'create_client_orders',
  VIEW_CLIENT_DATA: 'view_client_data',
  EDIT_PROFILE: 'edit_profile',
  SEND_FEEDBACK: 'send_feedback',
  VIEW_BILLS: 'view_bills',
  TRACK_ORDERS: 'track_orders',
  
  // Shared permissions
  VIEW_DASHBOARD: 'view_dashboard',
  RECEIVE_NOTIFICATIONS: 'receive_notifications',
  UPDATE_PASSWORD: 'update_password',
};

const rolePermissions = {
  [USER_ROLES.ADMIN]: [
    // All admin permissions
    permissions.MANAGE_USERS,
    permissions.APPROVE_USERS,
    permissions.DELETE_USERS,
    permissions.VIEW_ALL_DATA,
    permissions.SYSTEM_SETTINGS,
    permissions.MANAGE_ROLES,
    permissions.VIEW_AUDIT_LOGS,
    permissions.EXPORT_DATA,
    
    // All other role permissions
    permissions.MANAGE_CUSTOMERS,
    permissions.CREATE_ORDERS,
    permissions.EDIT_ORDERS,
    permissions.DELETE_ORDERS,
    permissions.VIEW_SALES_DATA,
    permissions.MANAGE_INVENTORY,
    permissions.CREATE_BILLS,
    permissions.MANAGE_CAMPAIGNS,
    permissions.CREATE_CAMPAIGNS,
    permissions.EDIT_CAMPAIGNS,
    permissions.DELETE_CAMPAIGNS,
    permissions.MANAGE_LEADS,
    permissions.VIEW_MARKETING_DATA,
    permissions.SEND_NOTIFICATIONS,
    permissions.MANAGE_TASKS,
    permissions.CREATE_TASKS,
    permissions.ASSIGN_TASKS,
    permissions.MANAGE_DOCUMENTS,
    permissions.UPLOAD_DOCUMENTS,
    permissions.GENERATE_REPORTS,
    permissions.VIEW_ANALYTICS,
    
    // Shared permissions
    permissions.VIEW_DASHBOARD,
    permissions.RECEIVE_NOTIFICATIONS,
    permissions.UPDATE_PASSWORD,
  ],
  
  [USER_ROLES.SALES_PURCHASE]: [
    permissions.MANAGE_CUSTOMERS,
    permissions.CREATE_ORDERS,
    permissions.EDIT_ORDERS,
    permissions.VIEW_SALES_DATA,
    permissions.MANAGE_INVENTORY,
    permissions.CREATE_BILLS,
    permissions.VIEW_DASHBOARD,
    permissions.RECEIVE_NOTIFICATIONS,
    permissions.UPDATE_PASSWORD,
    permissions.EDIT_PROFILE,
  ],
  
  [USER_ROLES.MARKETING]: [
    permissions.MANAGE_CAMPAIGNS,
    permissions.CREATE_CAMPAIGNS,
    permissions.EDIT_CAMPAIGNS,
    permissions.MANAGE_LEADS,
    permissions.VIEW_MARKETING_DATA,
    permissions.SEND_NOTIFICATIONS,
    permissions.VIEW_DASHBOARD,
    permissions.RECEIVE_NOTIFICATIONS,
    permissions.UPDATE_PASSWORD,
    permissions.EDIT_PROFILE,
  ],
  
  [USER_ROLES.OFFICE]: [
    permissions.MANAGE_TASKS,
    permissions.CREATE_TASKS,
    permissions.ASSIGN_TASKS,
    permissions.MANAGE_DOCUMENTS,
    permissions.UPLOAD_DOCUMENTS,
    permissions.GENERATE_REPORTS,
    permissions.VIEW_ANALYTICS,
    permissions.VIEW_DASHBOARD,
    permissions.RECEIVE_NOTIFICATIONS,
    permissions.UPDATE_PASSWORD,
    permissions.EDIT_PROFILE,
  ],
  
  [USER_ROLES.CLIENT]: [
    permissions.CREATE_CLIENT_ORDERS,
    permissions.VIEW_CLIENT_DATA,
    permissions.EDIT_PROFILE,
    permissions.SEND_FEEDBACK,
    permissions.VIEW_BILLS,
    permissions.TRACK_ORDERS,
    permissions.VIEW_DASHBOARD,
    permissions.RECEIVE_NOTIFICATIONS,
    permissions.UPDATE_PASSWORD,
  ],
};

export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  return rolePermissions[userRole]?.includes(permission) || false;
};

export const hasAnyPermission = (userRole, permissionsList) => {
  if (!Array.isArray(permissionsList)) return false;
  return permissionsList.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissionsList) => {
  if (!Array.isArray(permissionsList)) return false;
  return permissionsList.every(permission => hasPermission(userRole, permission));
};

export const getUserPermissions = (userRole) => {
  return rolePermissions[userRole] || [];
};

export const canAccessRoute = (userRole, routePermissions) => {
  if (!routePermissions || routePermissions.length === 0) {
    return true; // Public route
  }
  
  return hasAnyPermission(userRole, routePermissions);
};

export const filterByPermission = (items, userRole, permissionKey) => {
  return items.filter(item => {
    const requiredPermission = item[permissionKey];
    return !requiredPermission || hasPermission(userRole, requiredPermission);
  });
};

export const getPermissionLevel = (userRole) => {
  const levels = {
    [USER_ROLES.ADMIN]: 5,
    [USER_ROLES.SALES_PURCHASE]: 3,
    [USER_ROLES.MARKETING]: 3,
    [USER_ROLES.OFFICE]: 3,
    [USER_ROLES.CLIENT]: 1,
  };
  
  return levels[userRole] || 0;
};

export const canManageUser = (currentUserRole, targetUserRole) => {
  const currentLevel = getPermissionLevel(currentUserRole);
  const targetLevel = getPermissionLevel(targetUserRole);
  
  return currentLevel > targetLevel;
};
