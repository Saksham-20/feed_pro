// screens/enhanced/AdminScreen.js - Comprehensive admin dashboard
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card.js';
import Input from '../../components/common/Input';
import FeedbackThread from '../../components/business/FeedbackThread';
import Icon from 'react-native-vector-icons/Feather';

const AdminScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    users: { byRole: [], pendingApprovals: 0, totalUsers: 0 },
    orders: { byStatus: [], recent: [], totalOrders: 0, totalValue: 0 },
    feedback: { byStatus: [], totalThreads: 0 },
    revenue: { total_revenue: 0, total_bills: 0 }
  });

  // Users data
  const [users, setUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Feedback data
  const [feedbackThreads, setFeedbackThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Filters and search
  const [userFilter, setUserFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'feedback') fetchFeedback();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        'http://192.168.29.161:3000/api/admin/dashboard/overview',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const [usersRes, approvalsRes] = await Promise.all([
        axios.get('http://192.168.29.161:3000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
          params: { type: userFilter !== 'all' ? userFilter : undefined }
        }),
        axios.get('http://192.168.29.161:3000/api/admin/pending-approvals', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUsers(usersRes.data.data?.users || []);
      setPendingApprovals(approvalsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        'http://192.168.29.161:3000/api/admin/feedback',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedbackThreads(response.data.data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleUserApproval = async (userId, action, reason = '') => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const endpoint = action === 'approve' 
        ? 'http://192.168.29.161:3000/api/admin/approve-user'
        : 'http://192.168.29.161:3000/api/admin/reject-user';

      const response = await axios.post(
        endpoint,
        { userId, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert('Success', `User ${action}d successfully`);
        fetchUsers();
        fetchDashboardData();
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      Alert.alert('Error', `Failed to ${action} user`);
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
        { key: 'users', label: 'Users', icon: 'users' },
        { key: 'feedback', label: 'Feedback', icon: 'message-circle' },
        { key: 'reports', label: 'Reports', icon: 'bar-chart-2' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabItem, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Icon 
            name={tab.icon} 
            size={20} 
            color={activeTab === tab.key ? '#6366F1' : '#64748B'} 
          />
          <Text style={[
            styles.tabLabel,
            activeTab === tab.key && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDashboard = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />}
    >
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Icon name="users" size={32} color="#6366F1" />
          <Text style={styles.statNumber}>{dashboardData.users.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
          {dashboardData.users.pendingApprovals > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dashboardData.users.pendingApprovals} pending</Text>
            </View>
          )}
        </Card>

        <Card style={styles.statCard}>
          <Icon name="shopping-cart" size={32} color="#10B981" />
          <Text style={styles.statNumber}>{dashboardData.orders.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
          <Text style={styles.statSubtext}>
            ₹{dashboardData.orders.totalValue?.toLocaleString() || 0}
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <Icon name="message-circle" size={32} color="#F59E0B" />
          <Text style={styles.statNumber}>{dashboardData.feedback.totalThreads}</Text>
          <Text style={styles.statLabel}>Feedback Threads</Text>
        </Card>

        <Card style={styles.statCard}>
          <Icon name="dollar-sign" size={32} color="#EF4444" />
          <Text style={styles.statNumber}>₹{dashboardData.revenue.total_revenue?.toLocaleString() || 0}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
          <Text style={styles.statSubtext}>{dashboardData.revenue.total_bills} bills paid</Text>
        </Card>
      </View>

      {/* Users by Role Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Users by Role</Text>
        {dashboardData.users.byRole.map((item) => (
          <View key={item.role} style={styles.chartItem}>
            <Text style={styles.chartLabel}>{item.role}</Text>
            <View style={styles.chartBar}>
              <View 
                style={[
                  styles.chartProgress, 
                  { width: `${(item.count / dashboardData.users.totalUsers) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.chartValue}>{item.count}</Text>
          </View>
        ))}
      </Card>

      {/* Recent Orders */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <Button
            title="View All"
            variant="secondary"
            size="small"
            onPress={() => setActiveTab('orders')}
          />
        </View>
        {dashboardData.orders.recent.slice(0, 5).map((order) => (
          <View key={order.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{order.product_name}</Text>
              <Text style={styles.listItemSubtitle}>
                {order.client?.fullname} • ₹{order.total_amount}
              </Text>
            </View>
            <View style={[styles.statusBadge, styles[`status_${order.status}`]]}>
              <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'client', 'sales_purchase', 'marketing', 'office'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                userFilter === filter && styles.activeFilterChip
              ]}
              onPress={() => setUserFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                userFilter === filter && styles.activeFilterChipText
              ]}>
                {filter === 'all' ? 'All Users' : filter.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search users..."
          leftIcon="search"
          style={styles.searchInput}
        />
      </View>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card style={styles.approvalsCard}>
          <Text style={styles.sectionTitle}>Pending Approvals ({pendingApprovals.length})</Text>
          {pendingApprovals.slice(0, 3).map((user) => (
            <View key={user.id} style={styles.approvalItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{user.fullname}</Text>
                <Text style={styles.listItemSubtitle}>
                  {user.role} • {user.email}
                </Text>
              </View>
              <View style={styles.approvalActions}>
                <Button
                  title="Approve"
                  variant="success"
                  size="small"
                  onPress={() => handleUserApproval(user.id, 'approve')}
                  style={styles.approvalButton}
                />
                <Button
                  title="Reject"
                  variant="danger"
                  size="small"
                  onPress={() => handleUserApproval(user.id, 'reject')}
                  style={styles.approvalButton}
                />
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Users List */}
      <Card style={styles.usersCard}>
        <Text style={styles.sectionTitle}>All Users</Text>
        <FlatList
          data={users.filter(user => 
            searchQuery === '' || 
            user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => {
                setSelectedUser(item);
                setShowUserModal(true);
              }}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.fullname}</Text>
                <Text style={styles.listItemSubtitle}>
                  {item.role} • {item.email}
                </Text>
                <Text style={styles.userMeta}>
                  Joined: {new Date(item.created_at).toLocaleDateString()}
                  {item.last_login && ` • Last login: ${new Date(item.last_login).toLocaleDateString()}`}
                </Text>
              </View>
              <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUsers} />}
        />
      </Card>
    </View>
  );

  const renderFeedback = () => (
    <View style={styles.tabContent}>
      <Card style={styles.feedbackCard}>
        <Text style={styles.sectionTitle}>Feedback Threads</Text>
        <FlatList
          data={feedbackThreads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.feedbackItem}
              onPress={() => {
                setSelectedThread(item.thread_id);
                setShowFeedbackModal(true);
              }}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.subject}</Text>
                <Text style={styles.listItemSubtitle}>
                  From: {item.client?.fullname} • {item.category}
                </Text>
                <Text style={styles.userMeta}>
                  {new Date(item.updated_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.feedbackMeta}>
                <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                  <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <View style={[styles.priorityBadge, styles[`priority_${item.priority}`]]}>
                  <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFeedback} />}
        />
      </Card>
    </View>
  );

  const renderReports = () => (
    <ScrollView style={styles.tabContent}>
      <Card style={styles.reportsCard}>
        <Text style={styles.sectionTitle}>Business Reports</Text>
        
        <View style={styles.reportsList}>
          <TouchableOpacity style={styles.reportItem}>
            <Icon name="users" size={24} color="#6366F1" />
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>User Analytics</Text>
              <Text style={styles.reportDescription}>User growth, engagement metrics</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportItem}>
            <Icon name="shopping-cart" size={24} color="#10B981" />
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Sales Report</Text>
              <Text style={styles.reportDescription}>Order trends, revenue analysis</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportItem}>
            <Icon name="dollar-sign" size={24} color="#F59E0B" />
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Financial Summary</Text>
              <Text style={styles.reportDescription}>Revenue, payments, outstanding</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportItem}>
            <Icon name="message-circle" size={24} color="#EF4444" />
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>Customer Feedback</Text>
              <Text style={styles.reportDescription}>Satisfaction scores, trends</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="user" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {renderTabBar()}

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'feedback' && renderFeedback()}
      {activeTab === 'reports' && renderReports()}

      {/* User Details Modal */}
      <Modal visible={showUserModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <Button
              title="Close"
              variant="secondary"
              size="small"
              onPress={() => setShowUserModal(false)}
            />
          </View>
          
          {selectedUser && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.userDetails}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>{selectedUser.fullname}</Text>
                
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedUser.email}</Text>
                
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{selectedUser.phone}</Text>
                
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{selectedUser.role}</Text>
                
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, styles[`status_${selectedUser.status}`]]}>
                  <Text style={styles.statusText}>{selectedUser.status.toUpperCase()}</Text>
                </View>
                
                <Text style={styles.detailLabel}>Joined</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedUser.created_at).toLocaleDateString()}
                </Text>
                
                {selectedUser.last_login && (
                  <>
                    <Text style={styles.detailLabel}>Last Login</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedUser.last_login).toLocaleDateString()}
                    </Text>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Feedback Thread Modal */}
      <Modal visible={showFeedbackModal} animationType="slide">
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Feedback Thread</Text>
            <Button
              title="Close"
              variant="secondary"
              size="small"
              onPress={() => setShowFeedbackModal(false)}
            />
          </View>
          {selectedThread && (
            <FeedbackThread threadId={selectedThread} isAdmin={true} />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#6366F1',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 14,
    color: '#64748B',
    width: 100,
  },
  chartBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  chartProgress: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    width: 30,
    textAlign: 'right',
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  userMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_pending: {
    backgroundColor: '#FEF3C7',
  },
  status_approved: {
    backgroundColor: '#D1FAE5',
  },
  status_active: {
    backgroundColor: '#D1FAE5',
  },
  status_rejected: {
    backgroundColor: '#FEE2E2',
  },
  status_inactive: {
    backgroundColor: '#F1F5F9',
  },
  status_open: {
    backgroundColor: '#DBEAFE',
  },
  status_in_progress: {
    backgroundColor: '#FEF3C7',
  },
  status_resolved: {
    backgroundColor: '#D1FAE5',
  },
  status_closed: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  filterBar: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#64748B',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    marginBottom: 0,
  },
  approvalsCard: {
    margin: 16,
    marginTop: 0,
  },
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approvalButton: {
    minWidth: 80,
  },
  usersCard: {
    margin: 16,
    marginTop: 0,
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  feedbackCard: {
    margin: 16,
    flex: 1,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  feedbackMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priority_low: {
    backgroundColor: '#F0FDF4',
  },
  priority_medium: {
    backgroundColor: '#FFFBEB',
  },
  priority_high: {
    backgroundColor: '#FEE2E2',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  reportsCard: {
    margin: 16,
  },
  reportsList: {
    gap: 16,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportContent: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  reportDescription: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 44,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  userDetails: {
    gap: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
  },
});

export default AdminScreen;