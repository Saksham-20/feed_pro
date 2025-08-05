import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Button from '../components/common/Button';
import Card from '../components/common/Card.js';
import Input from '../components/common/Input';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const OfficeEmployeeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    tasks: { pending: 0, completed: 0, overdue: 0 },
    documents: { recent: [], totalFiles: 0 },
    reports: { thisMonth: 0, pending: 0 },
    workflow: { active: 0, completed: 0 }
  });

  // Tasks data
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    category: 'general'
  });

  // Documents data
  const [documents, setDocuments] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    description: '',
    category: 'general',
    tags: ''
  });

  // Reports data
  const [reports, setReports] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'tasks') fetchTasks();
    if (activeTab === 'documents') fetchDocuments();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        'http://192.168.29.161:3000/api/employees/office/dashboard',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Mock data for development
      setDashboardData({
        tasks: { pending: 12, completed: 45, overdue: 3 },
        documents: { recent: [], totalFiles: 156 },
        reports: { thisMonth: 8, pending: 2 },
        workflow: { active: 5, completed: 23 }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        'http://192.168.29.161:3000/api/employees/office/tasks',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Mock data
      setTasks([
        {
          id: 1,
          title: 'Prepare Monthly Report',
          description: 'Compile sales and performance data for monthly report',
          priority: 'high',
          status: 'pending',
          dueDate: '2024-01-15',
          assignedTo: 'John Doe',
          category: 'reporting'
        },
        {
          id: 2,
          title: 'Update Client Database',
          description: 'Clean and update client contact information',
          priority: 'medium',
          status: 'in_progress',
          dueDate: '2024-01-20',
          assignedTo: 'Jane Smith',
          category: 'data_management'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Mock data for documents
      setDocuments([
        {
          id: 1,
          title: 'Q4 Sales Report',
          description: 'Comprehensive sales analysis for Q4 2023',
          category: 'reports',
          uploadDate: '2024-01-10',
          fileSize: '2.5 MB',
          fileType: 'PDF',
          tags: ['sales', 'quarterly', 'analysis']
        },
        {
          id: 2,
          title: 'Employee Handbook',
          description: 'Updated employee policies and procedures',
          category: 'hr',
          uploadDate: '2024-01-08',
          fileSize: '1.8 MB',
          fileType: 'PDF',
          tags: ['hr', 'policies', 'handbook']
        }
      ]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Mock data for reports
      setReports([
        {
          id: 1,
          name: 'Weekly Performance Report',
          type: 'performance',
          status: 'completed',
          generatedDate: '2024-01-12',
          description: 'Weekly team performance metrics and KPIs'
        },
        {
          id: 2,
          name: 'Monthly Financial Summary',
          type: 'financial',
          status: 'pending',
          dueDate: '2024-01-15',
          description: 'Monthly revenue and expense summary'
        }
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async () => {
    try {
      if (!taskForm.title || !taskForm.description) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.post(
        'http://192.168.29.161:3000/api/employees/office/tasks',
        taskForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Task created successfully');
        setShowTaskModal(false);
        setTaskForm({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          assignedTo: '',
          category: 'general'
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
        { key: 'tasks', label: 'Tasks', icon: 'check-square' },
        { key: 'documents', label: 'Documents', icon: 'file-text' },
        { key: 'reports', label: 'Reports', icon: 'bar-chart-2' },
        { key: 'workflow', label: 'Workflow', icon: 'workflow' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabItem, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Icon 
            name={tab.icon} 
            size={18} 
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
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {user?.fullname}!</Text>
        <Text style={styles.welcomeSubtext}>Here's your office overview</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Icon name="check-square" size={28} color="#6366F1" />
          <Text style={styles.statNumber}>{dashboardData.tasks.pending}</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </Card>

        <Card style={styles.statCard}>
          <Icon name="file-text" size={28} color="#10B981" />
          <Text style={styles.statNumber}>{dashboardData.documents.totalFiles}</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </Card>

        <Card style={styles.statCard}>
          <Icon name="bar-chart-2" size={28} color="#F59E0B" />
          <Text style={styles.statNumber}>{dashboardData.reports.thisMonth}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </Card>

        <Card style={styles.statCard}>
          <Icon name="trending-up" size={28} color="#EF4444" />
          <Text style={styles.statNumber}>{dashboardData.workflow.active}</Text>
          <Text style={styles.statLabel}>Active Workflows</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowTaskModal(true)}
          >
            <Icon name="plus-circle" size={24} color="#6366F1" />
            <Text style={styles.quickActionText}>New Task</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowDocModal(true)}
          >
            <Icon name="upload" size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Upload Doc</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowReportModal(true)}
          >
            <Icon name="file-plus" size={24} color="#F59E0B" />
            <Text style={styles.quickActionText}>New Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <Icon name="settings" size={24} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.activityCard}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Icon name="check-circle" size={20} color="#10B981" />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Task Completed</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Icon name="file-text" size={20} color="#6366F1" />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Document Uploaded</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Icon name="bar-chart-2" size={20} color="#F59E0B" />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Report Generated</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const renderTasks = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Task Management</Text>
        <Button
          title="New Task"
          variant="primary"
          size="small"
          onPress={() => setShowTaskModal(true)}
        />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View style={[styles.priorityBadge, styles[`priority_${item.priority}`]]}>
                <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.taskDescription}>{item.description}</Text>
            <View style={styles.taskMeta}>
              <Text style={styles.taskMetaText}>Due: {item.dueDate}</Text>
              <Text style={styles.taskMetaText}>Assigned: {item.assignedTo}</Text>
            </View>
            <View style={styles.taskActions}>
              <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <Button
                title="Edit"
                variant="outline"
                size="small"
                onPress={() => {
                  setSelectedTask(item);
                  setTaskForm(item);
                  setShowTaskModal(true);
                }}
              />
            </View>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTasks} />}
      />
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Document Management</Text>
        <Button
          title="Upload"
          variant="primary"
          size="small"
          onPress={() => setShowDocModal(true)}
        />
      </View>

      <FlatList
        data={documents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.docCard}>
            <View style={styles.docHeader}>
              <Icon name="file" size={24} color="#6366F1" />
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{item.title}</Text>
                <Text style={styles.docMeta}>
                  {item.fileType} • {item.fileSize} • {item.uploadDate}
                </Text>
              </View>
              <Icon name="download" size={20} color="#64748B" />
            </View>
            <Text style={styles.docDescription}>{item.description}</Text>
            <View style={styles.docTags}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDocuments} />}
      />
    </View>
  );

  const renderReports = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Report Management</Text>
        <Button
          title="Generate"
          variant="primary"
          size="small"
          onPress={() => setShowReportModal(true)}
        />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Icon name="bar-chart-2" size={24} color="#10B981" />
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{item.name}</Text>
                <Text style={styles.reportType}>{item.type}</Text>
              </View>
              <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.reportDescription}>{item.description}</Text>
            <View style={styles.reportMeta}>
              <Text style={styles.reportDate}>
                {item.generatedDate ? `Generated: ${item.generatedDate}` : `Due: ${item.dueDate}`}
              </Text>
            </View>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchReports} />}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Office Dashboard</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="user" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {renderTabBar()}

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'tasks' && renderTasks()}
      {activeTab === 'documents' && renderDocuments()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'workflow' && (
        <View style={styles.comingSoon}>
          <Icon name="settings" size={64} color="#94A3B8" />
          <Text style={styles.comingSoonText}>Workflow Management</Text>
          <Text style={styles.comingSoonSubtext}>Coming soon...</Text>
        </View>
      )}

      {/* Task Modal */}
      <Modal visible={showTaskModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedTask ? 'Edit Task' : 'New Task'}</Text>
            <Button
              title="Cancel"
              variant="secondary"
              size="small"
              onPress={() => {
                setShowTaskModal(false);
                setSelectedTask(null);
                setTaskForm({
                  title: '',
                  description: '',
                  priority: 'medium',
                  dueDate: '',
                  assignedTo: '',
                  category: 'general'
                });
              }}
            />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Input
              label="Task Title"
              value={taskForm.title}
              onChangeText={(text) => setTaskForm({...taskForm, title: text})}
              placeholder="Enter task title"
              required
            />
            
            <Input
              label="Description"
              value={taskForm.description}
              onChangeText={(text) => setTaskForm({...taskForm, description: text})}
              placeholder="Task description"
              multiline
              numberOfLines={3}
              required
            />
            
            <Input
              label="Assigned To"
              value={taskForm.assignedTo}
              onChangeText={(text) => setTaskForm({...taskForm, assignedTo: text})}
              placeholder="Assign to team member"
            />
            
            <Input
              label="Due Date"
              value={taskForm.dueDate}
              onChangeText={(text) => setTaskForm({...taskForm, dueDate: text})}
              placeholder="YYYY-MM-DD"
            />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title={selectedTask ? 'Update Task' : 'Create Task'}
              onPress={handleTaskSubmit}
              style={styles.submitButton}
            />
          </View>
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
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#6366F1',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
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
  quickActionsCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: (width - 76) / 2,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  activityCard: {
    margin: 16,
    marginTop: 0,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  activityTime: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  taskCard: {
    margin: 16,
    marginTop: 0,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_pending: {
    backgroundColor: '#FEF3C7',
  },
  status_in_progress: {
    backgroundColor: '#DBEAFE',
  },
  status_completed: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  docCard: {
    margin: 16,
    marginTop: 0,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  docInfo: {
    flex: 1,
    marginLeft: 12,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  docMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  docDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  docTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  reportCard: {
    margin: 16,
    marginTop: 0,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  reportType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  reportDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  reportMeta: {
    marginTop: 8,
  },
  reportDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  modalFooter: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    width: '100%',
  },
});

export default OfficeEmployeeScreen;