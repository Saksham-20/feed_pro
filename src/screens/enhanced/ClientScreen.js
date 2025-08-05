import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card.js';
import Input from '../../components/common/Input';
import FeedbackThread from '../../components/business/FeedbackThread';
import Icon from 'react-native-vector-icons/Feather';

const ClientScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [feedbackThreads, setFeedbackThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);

  // Order form state
  const [orderForm, setOrderForm] = useState({
    productName: '',
    productCategory: '',
    quantity: '',
    unit: 'pcs',
    description: '',
    priority: 'medium',
    expectedDeliveryDate: '',
  });

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });

  useEffect(() => {
    loadUserData();
    fetchDashboardData();
  }, []);

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
      
      // Fetch orders, bills, and feedback in parallel
      const [ordersRes, billsRes, feedbackRes] = await Promise.all([
        axios.get('http://192.168.29.161:3000/api/client/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://192.168.29.161:3000/api/client/bills', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://192.168.29.161:3000/api/client/feedback', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setOrders(ordersRes.data.data || []);
      setBills(billsRes.data.data || []);
      setFeedbackThreads(feedbackRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async () => {
    try {
      // Validate form
      if (!orderForm.productName || !orderForm.quantity) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.post(
        'http://192.168.29.161:3000/api/client/orders',
        orderForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Order submitted successfully');
        setShowOrderForm(false);
        setOrderForm({
          productName: '',
          productCategory: '',
          quantity: '',
          unit: 'pcs',
          description: '',
          priority: 'medium',
          expectedDeliveryDate: '',
        });
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      Alert.alert('Error', 'Failed to submit order');
    }
  };

  const submitFeedback = async () => {
    try {
      if (!feedbackForm.subject || !feedbackForm.message) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.post(
        'http://192.168.29.161:3000/api/client/feedback',
        feedbackForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Feedback submitted successfully');
        setShowFeedbackForm(false);
        setFeedbackForm({
          subject: '',
          category: 'general',
          priority: 'medium',
          message: '',
        });
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <Card style={styles.statCard}>
        <Icon name="shopping-cart" size={24} color="#6366F1" />
        <Text style={styles.statNumber}>{orders.length}</Text>
        <Text style={styles.statLabel}>Orders</Text>
      </Card>
      <Card style={styles.statCard}>
        <Icon name="file-text" size={24} color="#10B981" />
        <Text style={styles.statNumber}>{bills.length}</Text>
        <Text style={styles.statLabel}>Bills</Text>
      </Card>
      <Card style={styles.statCard}>
        <Icon name="message-circle" size={24} color="#F59E0B" />
        <Text style={styles.statNumber}>{feedbackThreads.length}</Text>
        <Text style={styles.statLabel}>Conversations</Text>
      </Card>
    </View>
  );

  const renderRecentOrders = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <Button
          title="New Order"
          variant="primary"
          size="small"
          onPress={() => setShowOrderForm(true)}
        />
      </View>
      
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="shopping-cart" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Create your first order to get started</Text>
        </View>
      ) : (
        orders.slice(0, 3).map((order) => (
          <View key={order.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{order.product_name}</Text>
              <Text style={styles.listItemSubtitle}>
                Qty: {order.quantity} {order.unit} • {order.status}
              </Text>
            </View>
            <View style={[styles.statusBadge, styles[`status_${order.status}`]]}>
              <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>
        ))
      )}
    </Card>
  );

  const renderRecentBills = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Bills</Text>
        <Button
          title="View All"
          variant="secondary"
          size="small"
          onPress={() => navigation.navigate('Bills')}
        />
      </View>
      
      {bills.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="file-text" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No bills yet</Text>
        </View>
      ) : (
        bills.slice(0, 3).map((bill) => (
          <View key={bill.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Bill #{bill.bill_number}</Text>
              <Text style={styles.listItemSubtitle}>
                ₹{bill.total_amount} • Due: {new Date(bill.due_date).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, styles[`payment_${bill.payment_status}`]]}>
              <Text style={styles.statusText}>{bill.payment_status.toUpperCase()}</Text>
            </View>
          </View>
        ))
      )}
    </Card>
  );

  const renderFeedbackThreads = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Conversations</Text>
        <Button
          title="New Message"
          variant="primary"
          size="small"
          onPress={() => setShowFeedbackForm(true)}
        />
      </View>
      
      {feedbackThreads.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="message-circle" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start a conversation with our team</Text>
        </View>
      ) : (
        feedbackThreads.slice(0, 3).map((thread) => (
          <View key={thread.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{thread.subject}</Text>
              <Text style={styles.listItemSubtitle}>
                {thread.category} • {new Date(thread.updated_at).toLocaleDateString()}
              </Text>
            </View>
            <Button
              title="View"
              variant="outline"
              size="small"
              onPress={() => setSelectedThread(thread.thread_id)}
            />
          </View>
        ))
      )}
    </Card>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back, {user?.fullname}!</Text>
        <Text style={styles.subGreeting}>Here's what's happening with your account</Text>
      </View>

      {renderQuickStats()}
      {renderRecentOrders()}
      {renderRecentBills()}
      {renderFeedbackThreads()}

      {/* Order Form Modal */}
      <Modal visible={showOrderForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Order</Text>
            <Button
              title="Cancel"
              variant="secondary"
              size="small"
              onPress={() => setShowOrderForm(false)}
            />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Input
              label="Product Name"
              value={orderForm.productName}
              onChangeText={(text) => setOrderForm({...orderForm, productName: text})}
              placeholder="Enter product name"
              required
            />
            
            <Input
              label="Product Category"
              value={orderForm.productCategory}
              onChangeText={(text) => setOrderForm({...orderForm, productCategory: text})}
              placeholder="Enter product category"
            />
            
            <Input
              label="Quantity"
              value={orderForm.quantity}
              onChangeText={(text) => setOrderForm({...orderForm, quantity: text})}
              placeholder="Enter quantity"
              keyboardType="numeric"
              required
            />
            
            <Input
              label="Description"
              value={orderForm.description}
              onChangeText={(text) => setOrderForm({...orderForm, description: text})}
              placeholder="Additional details"
              multiline
              numberOfLines={3}
            />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title="Submit Order"
              onPress={submitOrder}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>

      {/* Feedback Form Modal */}
      <Modal visible={showFeedbackForm} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Feedback</Text>
            <Button
              title="Cancel"
              variant="secondary"
              size="small"
              onPress={() => setShowFeedbackForm(false)}
            />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Input
              label="Subject"
              value={feedbackForm.subject}
              onChangeText={(text) => setFeedbackForm({...feedbackForm, subject: text})}
              placeholder="Enter subject"
              required
            />
            
            <Input
              label="Message"
              value={feedbackForm.message}
              onChangeText={(text) => setFeedbackForm({...feedbackForm, message: text})}
              placeholder="Enter your message"
              multiline
              numberOfLines={5}
              required
            />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              title="Send Message"
              onPress={submitFeedback}
              style={styles.submitButton}
            />
          </View>
        </View>
      </Modal>

      {/* Feedback Thread Modal */}
      <Modal visible={!!selectedThread} animationType="slide">
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Conversation</Text>
            <Button
              title="Close"
              variant="secondary"
              size="small"
              onPress={() => setSelectedThread(null)}
            />
          </View>
          {selectedThread && (
            <FeedbackThread threadId={selectedThread} isAdmin={false} />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  },
  sectionCard: {
    margin: 20,
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
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_pending: {
    backgroundColor: '#FEF3C7',
  },
  status_confirmed: {
    backgroundColor: '#DBEAFE',
  },
  status_processing: {
    backgroundColor: '#E0E7FF',
  },
  status_shipped: {
    backgroundColor: '#DDD6FE',
  },
  status_delivered: {
    backgroundColor: '#D1FAE5',
  },
  payment_pending: {
    backgroundColor: '#FEF3C7',
  },
  payment_paid: {
    backgroundColor: '#D1FAE5',
  },
  payment_overdue: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
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
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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

export default ClientScreen;
    