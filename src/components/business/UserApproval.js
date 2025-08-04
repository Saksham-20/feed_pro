import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../styles/theme';
import { USER_STATUS } from '../../utils/constants';

const UserApproval = ({ user, onApprove, onReject, loading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case USER_STATUS.APPROVED:
        return theme.colors.secondary[500];
      case USER_STATUS.REJECTED:
        return theme.colors.danger[500];
      case USER_STATUS.PENDING:
        return theme.colors.accent[500];
      default:
        return theme.colors.gray[500];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case USER_STATUS.APPROVED:
        return 'check-circle';
      case USER_STATUS.REJECTED:
        return 'x-circle';
      case USER_STATUS.PENDING:
        return 'clock';
      default:
        return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Icon name="user" size={24} color={theme.colors.gray[600]} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.fullname}</Text>
            <Text style={styles.userRole}>{user.role?.replace('_', ' ')}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
          <Icon name={getStatusIcon(user.status)} size={16} color="#FFFFFF" />
          <Text style={styles.statusText}>{user.status?.toUpperCase()}</Text>
        </View>
      </View>

      {user.department && (
        <View style={styles.additionalInfo}>
          <Text style={styles.infoLabel}>Department:</Text>
          <Text style={styles.infoValue}>{user.department}</Text>
        </View>
      )}

      {user.employee_id && (
        <View style={styles.additionalInfo}>
          <Text style={styles.infoLabel}>Employee ID:</Text>
          <Text style={styles.infoValue}>{user.employee_id}</Text>
        </View>
      )}

      <View style={styles.additionalInfo}>
        <Text style={styles.infoLabel}>Joined:</Text>
        <Text style={styles.infoValue}>
          {new Date(user.created_at).toLocaleDateString()}
        </Text>
      </View>

      {user.status === USER_STATUS.PENDING && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => onApprove(user.id)}
            disabled={loading}
          >
            <Icon name="check" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => onReject(user.id)}
            disabled={loading}
          >
            <Icon name="x" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {user.rejection_reason && (
        <View style={styles.rejectionReason}>
          <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
          <Text style={styles.rejectionText}>{user.rejection_reason}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  userRole: {
    fontSize: 14,
    color: theme.colors.primary[600],
    textTransform: 'capitalize',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: theme.colors.gray[600],
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  additionalInfo: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.gray[600],
    fontWeight: '500',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.gray[800],
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: theme.colors.secondary[500],
  },
  rejectButton: {
    backgroundColor: theme.colors.danger[500],
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  rejectionReason: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.danger[50],
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger[500],
  },
  rejectionLabel: {
    fontSize: 12,
    color: theme.colors.danger[700],
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: theme.colors.danger[800],
  },
});

export default UserApproval;
