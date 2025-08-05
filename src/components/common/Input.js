// src/components/common/Input.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../styles/theme';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry = false,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const handleSecureTextToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const containerStyles = [
    styles.container,
    isFocused && styles.focused,
    error && styles.error,
    style,
  ];

  const inputStyles = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
    multiline && styles.multilineInput,
    inputStyle,
  ];

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={containerStyles}>
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={isFocused ? theme.colors.primary : '#9CA3AF'}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={inputStyles}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={handleSecureTextToggle}
            style={styles.rightIcon}
          >
            <Icon
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <Icon
              name={rightIcon}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  focused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  error: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: 12,
  },
  inputWithLeftIcon: {
    marginLeft: 12,
  },
  inputWithRightIcon: {
    marginRight: 12,
  },
  multilineInput: {
    paddingVertical: 16,
    minHeight: 80,
  },
  leftIcon: {
    marginRight: 4,
  },
  rightIcon: {
    padding: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default Input;
