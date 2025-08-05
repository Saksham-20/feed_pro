// src/components/business/OrderTracker.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Card from '../common/Card';
import { theme } from '../../styles/theme';
import { formatDate } from '../../utils/helpers';

const OrderTracker = ({ order }) => {
  const getStatusSteps = () => {
    const allSteps = [
      { key: 'pending', label: 'Order Placed', icon: 'shopping-cart' },
      { key: 'confirmed', label: 'Confirmed', icon: 'check-circle' },
      { key: 'processing', label: 'Processing', icon: 'package' },
      { key: 'shipped', label: 'Shipped', icon: 'truck' },
      { key: 'delivered', label: 'Delivered', icon: 'home' },
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const steps = getStatusSteps();

  const renderStep = (step, index) => {
    const isLast = index === steps.length - 1;

    return (
      <View key={step.key} style={styles.stepContainer}>
        <View style={styles.stepIndicator}>
          <View style={[
            styles.stepIcon,
            step.completed && styles.stepIconCompleted,
            step.active && styles.stepIconActive,
          ]}>
            <Icon
              name={step.icon}
              size={20}
              color={step.completed ? '#FFFFFF' : theme.colors.textTertiary}
            />
          </View>
          {!isLast && (
            <View style={[
              styles.stepLine,
              step.completed && styles.stepLineCompleted,
            ]} />
          )}
        </View>
        
        <View style={styles.stepContent}>
          <Text style={[
            styles.stepLabel,
            step.completed && styles.stepLabelCompleted,
          ]}>
            {step.label}
          </Text>
          {step.active && order.updated_at && (
            <Text style={styles.stepTime}>
              {formatDate(order.updated_at, 'datetime')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Order Tracking</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {steps.map(renderStep)}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIconCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepIconActive: {
    backgroundColor: theme.colors.primary,
  },
  stepLine: {
    width: 2,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  stepLineCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepContent: {
    flex: 1,
    paddingTop: 8,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textTertiary,
  },
  stepLabelCompleted: {
    color: theme.colors.textPrimary,
  },
  stepTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});

export default OrderTracker;