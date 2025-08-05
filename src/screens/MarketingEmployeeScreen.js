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
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Button from '../components/common/Button';
import Card from '../components/common/Card.js';
import Input from '../components/common/Input';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const MarketingEmployeeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    campaigns: { active: 0, completed: 0, leads: 0 },
    leads: { total: 0, converted: 0, pending: 0 },
    territories: { assigned: 0, covered: 0 },
    performance: { thisMonth: 0, target: 100 }
  });

  // Campaigns data
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    type: 'field',
    startDate: '',
    endDate: '',
    budget: '',
    targetAudience: '',
    territory: ''
  });

  // Leads data
  const [leads, setLeads] = useState([]);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: '',
    contact: '',
    email: '',
    company: '',
    location: '',
    interest: '',
    source: 'field',
    notes: ''
  });

  // Submissions data
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    loadUserData();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns();
    if (activeTab === 'leads') fetchLeads();
    if (activeTab === 'submissions') fetchSubmissions();
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
        'http://192.168.29.161:3000/api/employees/marketing/dashboard',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Mock data for development
      setDashboardData({
        campaigns: { active: 3, completed: 12, leads: 45 },
        leads: { total: 156, converted: 28, pending: 12 },
        territories: { assigned: 5, covered: 4 },
        performance: { thisMonth: 78, target: 100 }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Mock data for campaigns
      setCampaigns([
        {
          id: 1,
          name: 'Q1 Product Launch',
          description: 'Launch campaign for new product line',
          type: 'field',
          status: 'active',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          budget: 50000,
          leads: 23,
          territory: 'North Region'
        },
        {
          id: 2,
          name: 'Customer Retention Drive',
          description: 'Focus on existing customer engagement',
          type: 'digital',
          status: 'completed',
          startDate: '2023-11-01',
          endDate: '2023-12-31',
          budget: 30000,
          leads: 45,
          territory: 'South Region'
        }
      ]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Mock data for leads
      setLeads([
        {
          id: 1,
          name: 'ABC Corporation',
          contact: '+91 9876543210',
          email: 'contact@abc.com',
          company: 'ABC Corp',
          location: 'Mumbai',
          interest: 'Enterprise Solution',
          source: 'field',
          status: 'pending',
          notes: 'Interested in bulk purchase, follow up next week',
          createdDate: '2024-01-10'
        },
        {
          id: 2,
          name: 'John Smith',
          contact: '+91 8765432109',
          email: 'john@xyz.com',
          company: 'XYZ Ltd',
          location: 'Delhi',
          interest: 'Premium Package',
          source: 'referral',
          status: 'converted',
          notes: 'Converted to customer, very satisfied',
          createdDate: '2024-01-08'
        }
      ]);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // Mock data for submissions
      setSubmissions([
        {
          id: 1,
          campaignName: 'Q1 Product Launch',
          leadName: 'Tech Solutions Inc',
          submissionDate: '2024-01-12',
          status: 'submitted',
          canEdit: true,
          data: {
            contact: '+91 7654321098',
            email: 'info@techsol.com',
            location: 'Bangalore',
            interest: 'Software License'
          }
        },
        {
          id: 2,
          campaignName: 'Customer Retention Drive',
          leadName: 'Global Enterprises',
          submissionDate: '2024-01-10',
          status: 'reviewed',
          canEdit: false,
          data: {
            contact: '+91 6543210987',
            email: 'sales@global.com',
            location: 'Chennai',
            interest: 'Maintenance Contract'
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSubmit = async () => {
    try {
      if (!campaignForm.name || !campaignForm.description) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.post(
        'http://192.168.29.161:3000/api/employees/marketing/campaigns',
        campaignForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Campaign created successfully');
        setShowCampaignModal(false);
        setCampaignForm({
          name: '',
          description: '',
          type: 'field',
          startDate: '',
          endDate: '',
          budget: '',
          targetAudience: '',
          territory: ''
        });
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      Alert.alert('Error', 'Failed to create campaign');
    }
  };

  const handleLeadSubmit = async () => {
    try {
      if (!leadForm.name || !leadForm.contact) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.post(
        'http://192.168.29.161:3000/api/employees/marketing/leads',
        leadForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Lead added successfully');
        setShowLeadModal(false);
        setLeadForm({
          name: '',
          contact: '',
          email: '',
          company: '',
          location: '',
          interest: '',
          source: 'field',
          notes: ''
        });
        fetchLeads();
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      Alert.alert('Error', 'Failed to add lead');
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
        { key: 'campaigns', label: 'Campaigns', icon: 'megaphone' },
        { key: 'leads', label: 'Leads', icon: 'users' },
        { key: 'submissions', label: 'Submissions', icon: 'send' },
        { key: 'territory', label: 'Territory', icon: 'map' },
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
        <Text style={styles.welcomeText}>Hello, {user?.fullname}!</Text>
        <Text style={styles.welcomeSubtext}>Your marketing performance overview</Text>
      </View>

      {/* Performance Overview */}
      <Card style={styles.performanceCard}>
        <Text style={styles.sectionTitle}>This Month's Performance</Text>
        <View style={styles.performanceBar}>
          <View style={styles.performanceProgress}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(dashboardData.performance.thisMonth / dashboardData.performance.target) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.performanceText}>
            {dashboardData.performance.thisMonth} / {dashboardData.performance.target}
          </Text>
        </View>
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Icon name="megaphone" size={28} color="#6366F1" />
          <Text style={styles.statNumber}>{dashboardData.campaigns.active}</Text>
          <Text style={styles.statLabel}>Active Campaigns</Text>
        </Card>

        <Card style={styles.statCard}>
          <Icon name="users" size={28} color="#10B981" />
          <Text style={styles.statNumber}>{dashboardData.leads.total}</Text>
          <Text style={styles.statLabel}>Total Leads</Text>
        </Card>

        <Card style={styles.statCard}>
          <Icon name="trending-up" size={28} color="#F59E0B" />
          <Text style={styles.statNumber}>{dashboardData.leads.converted}</Text>
          <Text style={styles.statLabel}>Converted</Text>
        </Card>

        <Card style={styles.statCard}>
          <Icon name="map" size={28} color="#EF4444" />
          <Text style={styles.statNumber}>{dashboardData.territories.assigned}</Text>
          <Text style={styles.statLabel}>Territories</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowCampaignModal(true)}
          >
            <Icon name="plus-circle" size={24} color="#6366F1" />
            <Text style={styles.quickActionText}>New Campaign</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowLeadModal(true)}
          >
            <Icon name="user-plus" size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Add Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <Icon name="map-pin" size={24} color="#F59E0B" />
            <Text style={styles.quickActionText}>Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction}>
            <Icon name="bar-chart-2" size={24} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.activityCard}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Icon name="user-plus" size={20} color="#10B981" />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New Lead Added</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Icon name="megaphone" size={20} color="#6366F1" />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Campaign Updated</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Icon name="send" size={20} color="#F59E0B" />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Data Submitted</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  const renderCampaigns = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Campaign Management</Text>
        <Button
          title="New Campaign"
          variant="primary"
          size="small"
          onPress={() => setShowCampaignModal(true)}
        />
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <Text style={styles.campaignTitle}>{item.name}</Text>
              <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.campaignDescription}>{item.description}</Text>
            <View style={styles.campaignMeta}>
              <Text style={styles.campaignMetaText}>Budget: ₹{item.budget.toLocaleString()}</Text>
              <Text style={styles.campaignMetaText}>Leads: {item.leads}</Text>
            </View>
            <View style={styles.campaignFooter}>
              <Text style={styles.campaignDates}>
                {item.startDate} - {item.endDate}
              </Text>
              <Text style={styles.campaignTerritory}>{item.territory}</Text>
            </View>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchCampaigns} />}
      />
    </View>
  );

  const renderLeads = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lead Management</Text>
        <Button
          title="Add Lead"
          variant="primary"
          size="small"
          onPress={() => setShowLeadModal(true)}
        />
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.leadCard}>
            <View style={styles.leadHeader}>
              <View style={styles.leadInfo}>
                <Text style={styles.leadName}>{item.name}</Text>
                <Text style={styles.leadCompany}>{item.company}</Text>
              </View>
              <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.leadDetails}>
              <Text style={styles.leadDetailText}>📞 {item.contact}</Text>
              <Text style={styles.leadDetailText}>📍 {item.location}</Text>
              <Text style={styles.leadDetailText}>💼 {item.interest}</Text>
            </View>
            <Text style={styles.leadNotes}>{item.notes}</Text>
            <View style={styles.leadFooter}>
              <Text style={styles.leadDate}>Added: {item.createdDate}</Text>
              <Text style={styles.leadSource}>Source: {item.source}</Text>
            </View>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchLeads} />}
      />
    </View>
  );

  const renderSubmissions = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Field Submissions</Text>
        <Text style={styles.sectionSubtitle}>View and edit your submissions</Text>
      </View>

      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.submissionCard}>
            <View style={styles.submissionHeader}>
              <Text style={styles.submissionTitle}>{item.leadName}</Text>
              <View style={styles.submissionMeta}>
                <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
                {item.canEdit && (
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                      setSelectedSubmission(item);
                      setShowSubmissionModal(true);
                    }}
                  >
                    <Icon name="edit-2" size={16} color="#6366F1" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.submissionDetails}>
              <Text style={styles.submissionCampaign}>Campaign: {item.campaignName}</Text>
              <Text style={styles.submissionDate}>Submitted: {item.submissionDate}</Text>
            </View>
            <View style={styles.submissionData}>
              <Text style={styles.submissionDataText}>📞 {item.data.contact}</Text>
              <Text style={styles.submissionDataText}>📧 {item.data.email}</Text>
              <Text style={styles.submissionDataText}>📍 {item.data.location}</Text>
              <Text style={styles.submissionDataText}>💼 {item.data.interest}</Text>
            </View>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSubmissions} />}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketing Hub</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="user" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {renderTabBar()}

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'campaigns' && renderCampaigns()}
      {activeTab === 'leads' && renderLeads()}
      {activeTab === 'submissions' && renderSubmissions()}
      {activeTab === 'territory' && (
        <View style={styles.comingSoon}>
          <Icon name="map" size={64} color="#94A3B8" />
          <Text style={styles.comingSoonText}>Territory Management</Text>
          <Text style={styles.comingSoonSubtext}>Coming soon...</Text>
        </View>
      )}

      {/* Campaign Modal */}
      <Modal visible={showCampaignModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Campaign</Text>
            <Button
              title="Cancel"
              variant="secondary"
              size="small"
              onPress={() => setShowCampaignModal(false)}
            />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Input
              label="Campaign Name"
              value={campaignForm.name}
              onChangeText={(text) => setCampaignForm({...campaignForm, name: text})}
              placeholder="Enter campaign name"
              required
            />
            
            <Input
              label="Description"
              value={campaignForm.description}
              onChangeText={(text) => setCampaignForm({...campaignForm, description: text})}
              placeholder="Campaign description"
              multiline
              numberOfLines={3}
              required
            />
            
            <Input
              label="Budget"
              value={campaignForm.budget}
              onChangeText={(text) => setCampaignForm({...campaignForm, budget: text})}
              placeholder="Enter budget amount"
              keyboardType="numeric"
            />
            
            <Input
              label="Territory"
              value={campaignForm.territory}
              onChangeText={(text) => setCampaignForm({...campaignForm, territory: text})}
              placeholder="Target territory"
            />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title="Create Campaign"
              onPress={handleCampaignSubmit}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>

      {/* Lead Modal */}
      <Modal visible={showLeadModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Lead</Text>
            <Button
              title="Cancel"
              variant="secondary"
              size="small"
              onPress={() => setShowLeadModal(false)}
            />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Input
              label="Contact Name"
              value={leadForm.name}
              onChangeText={(text) => setLeadForm({...leadForm, name: text})}
              placeholder="Enter contact name"
              required
            />
            
            <Input
              label="Phone Number"
              value={leadForm.contact}
              onChangeText={(text) => setLeadForm({...leadForm, contact: text})}
              placeholder="+91 XXXXXXXXXX"
              keyboardType="phone-pad"
              required
            />
            
            <Input
              label="Email"
              value={leadForm.email}
              onChangeText={(text) => setLeadForm({...leadForm, email: text})}
              placeholder="email@example.com"
              keyboardType="email-address"
            />
            
            <Input
              label="Company"
              value={leadForm.company}
              onChangeText={(text) => setLeadForm({...leadForm, company: text})}
              placeholder="Company name"
            />
            
            <Input
              label="Location"
              value={leadForm.location}
              onChangeText={(text) => setLeadForm({...leadForm, location: text})}
              placeholder="City, State"
            />
            
            <Input
              label="Interest"
              value={leadForm.interest}
              onChangeText={(text) => setLeadForm({...leadForm, interest: text})}
              placeholder="Product/Service of interest"
            />
            
            <Input
              label="Notes"
              value={leadForm.notes}
              onChangeText={(text) => setLeadForm({...leadForm, notes: text})}
              placeholder="Additional notes"
              multiline
              numberOfLines={3}
            />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title="Add Lead"
              onPress={handleLeadSubmit}
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
  performanceCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  performanceBar: {
    alignItems: 'center',
  },
  performanceProgress: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
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