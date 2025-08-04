import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../styles/theme';
import { ORDER_STATUS } from '../../utils/constants';

const OrderTracker = ({ status, createdDate, expectedDelivery }) => {
  const statusSteps = [
    { key: ORDER_STATUS.PENDING, label: 'Order Placed', icon: 'file-text' },
    { key: ORDER_STATUS.CONFIRMED, label: 'Confirmed', icon: 'check-circle' },
    { key: ORDER_STATUS.PROCESSING, label: 'Processing', icon: 'clock' },
    { key: ORDER_STATUS.SHIPPED, label: 'Shipped', icon: 'truck' },
    { key: ORDER_STATUS.DELIVERED, label: 'Delivered', icon: 'package' },
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStyle = (index) => {
    if (index < currentStepIndex) {
      return styles.stepCompleted;
    } else if (index === currentStepIndex) {
      return styles.stepActive;
    } else {
      return styles.stepPending;
    }
  };

  const getLineStyle = (index) => {
    if (index < currentStepIndex) {
      return styles.lineCompleted;
    } else {
      return styles.linePending;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>
      
      <View style={styles.tracker}>
        {statusSteps.map((step, index) => (
          <View key={step.key} style={styles.stepContainer}>
            <View style={styles.stepRow}>
              <View style={[styles.stepIcon, getStepStyle(index)]}>
                <Icon 
                  name={step.icon} 
                  size={16} 
                  color={index <= currentStepIndex ? '#FFFFFF' : theme.colors.gray[400]} 
                />
              </View>
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepLabel,
                  index <= currentStepIndex && styles.stepLabelActive
                ]}>
                  {step.label}
                </Text>
                {index === 0 && createdDate && (
                  <Text style={styles.stepDate}>
                    {new Date(createdDate).toLocaleDateString()}
                  </Text>
                )}
                {index === statusSteps.length - 1 && expectedDelivery && (
                  <Text style={styles.stepDate}>
                    Expected: {new Date(expectedDelivery).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
            
            {index < statusSteps.length - 1 && (
              <View style={[styles.stepLine, getLineStyle(index)]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    ...theme.shadows.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 16,
  },
  tracker: {
    paddingLeft: 8,
  },
  stepContainer: {
    position: 'relative',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCompleted: {
    backgroundColor: theme.colors.secondary[500],
  },
  stepActive: {
    backgroundColor: theme.colors.primary[500],
  },
  stepPending: {
    backgroundColor: theme.colors.gray[200],
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.gray[600],
  },
  stepLabelActive: {
    color: theme.colors.gray[800],
    fontWeight: '600',
  },
  stepDate: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  stepLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 24,
  },
  lineCompleted: {
    backgroundColor: theme.colors.secondary[500],
  },
  linePending: {
    backgroundColor: theme.colors.gray[200],
  },
});

export default OrderTracker;