// src/components/common/LoadingSpinner.js
import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { theme } from '../../styles/theme';

const LoadingSpinner = ({
  visible = true,
  text = 'Loading...',
  overlay = false,
  size = 'large',
  color = theme.colors.primary,
}) => {
  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.text}>{text}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
});

export default LoadingSpinner;