// src/components/common/Toast.js
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const Toast = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  onHide, // Add support for onHide as well
}) => {
  const translateY = new Animated.Value(-100);
  const handleDismiss = onDismiss || onHide; // Use whichever is provided

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      handleDismiss && handleDismiss();
    });
  };

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: 'check-circle',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: 'alert-circle',
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: 'alert-triangle',
        };
      default:
        return {
          backgroundColor: '#6366F1',
          icon: 'info',
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor },
        { transform: [{ translateY }] },
      ]}
    >
      <Icon name={config.icon} size={20} color="#FFFFFF" />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default Toast;