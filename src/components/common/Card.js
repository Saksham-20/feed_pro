// src/components/common/Card.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

const Card = ({ children, style, padding = 16, ...props }) => {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});

export default Card;
