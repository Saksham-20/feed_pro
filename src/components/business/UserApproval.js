// src/components/business/UserApproval.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import { theme } from '../../styles/theme';
import { formatDate, capitalizeWords } from '../../utils/helpers';
import { useUser } from '../../context/UserContext';

const UserApproval = ({ user, onApprove, onReject }) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    Alert.alert(
      'Approve User',
      `Are you sure you want to approve ${user.fullname}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await onApprove(user.user_id);
            } catch (error) {
              console.error('Approve error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await onReject(user.user_id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Reject error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      sales_purchase: '#10B981',
      marketing: '#F59E0B',
      office: '#8B5CF6',
      admin: '#EF4444',
      client: '#6366F1',
    };
    return colors[role] || '#64748B';
  };

  const getUserTypeIcon = (role) => {
    const icons = {
      sales_purchase: 'trending-up',
      marketing: 'megaphone',
      office: 'briefcase',
      admin: 'shield',
      client: 'user',
    };
    return icons[role] || 'user';
  };

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: getRoleColor(user.role) }]}>
              <Icon name={getUserTypeIcon(user.role)} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.fullname}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleContainer}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                  <Text style={styles.roleText}>
                    {capitalizeWords(user.role.replace('_', ' '))}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Icon name="clock" size={12} color="#F59E0B" />
              <Text style={styles.statusText}>Pending</Text>
            </View>
            <Text style={styles.dateText}>
              {formatDate(user.created_at, 'short')}
            </Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Icon name="phone" size={16} color="#64748B" />
            <Text style={styles.detailText}>{user.phone}</Text>
          </View>
          
          {user.department && (
            <View style={styles.detailRow}>
              <Icon name="briefcase" size={16} color="#64748B" />
              <Text style={styles.detailText}>Department: {user.department}</Text>
            </View>
          )}
          
          {user.employee_id && (
            <View style={styles.detailRow}>
              <Icon name="hash" size={16} color="#64748B" />
              <Text style={styles.detailText}>Employee ID: {user.employee_id}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionSection}>
          <Button
            title="Reject"
            variant="outline"
            onPress={() => setShowRejectModal(true)}
            style={styles.rejectButton}
            textStyle={styles.rejectButtonText}
            icon="x"
            disabled={loading}
          />
          
          <Button
            title="Approve"
            onPress={handleApprove}
            style={styles.approveButton}
            icon="check"
            loading={loading}
            disabled={loading}
          />
        </View>
      </Card>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject User Application</Text>
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                style={styles.modalClose}
              >
                <Icon name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting {user.fullname}'s application:
            </Text>

            <Input
              label="Rejection Reason"
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Enter reason for rejection..."
              multiline
              numberOfLines={4}
              required
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowRejectModal(false)}
                style={styles.modalCancelButton}
                disabled={loading}
              />
              
              <Button
                title="Reject User"
                onPress={handleReject}
                style={styles.modalRejectButton}
                textStyle={styles.modalRejectButtonText}
                loading={loading}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  roleContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginBottom: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  detailsSection: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    color: '#EF4444',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  modalClose: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalRejectButton: {
    flex: 1,
    backgroundColor: '#EF4444',
  },
  modalRejectButtonText: {
    color: '#FFFFFF',
  },
});

export default UserApproval;