import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Icon from 'react-native-vector-icons/Feather';

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    department: '',
    employeeId: '',
  });
  const [loading, setLoading] = useState(false);
  const [showUserTypes, setShowUserTypes] = useState(false);

  const userTypes = [
    {
      key: 'client',
      label: 'Client',
      description: 'Create orders, view bills, send feedback',
      icon: 'user',
      color: '#10B981',
      requiresApproval: false,
    },
    {
      key: 'sales_purchase',
      label: 'Sales & Purchase Employee',
      description: 'Manage customers, process orders, track sales',
      icon: 'shopping-cart',
      color: '#6366F1',
      requiresApproval: true,
    },
    {
      key: 'marketing',
      label: 'Marketing Employee',
      description: 'Manage campaigns, track leads, field operations',
      icon: 'megaphone',
      color: '#F59E0B',
      requiresApproval: true,
    },
    {
      key: 'office',
      label: 'Office Employee',
      description: 'Document management, task tracking, reports',
      icon: 'briefcase',
      color: '#8B5CF6',
      requiresApproval: true,
    },
  ];

  const selectedUserType = userTypes.find(type => type.key === formData.role);

  const validateForm = () => {
    if (!formData.fullname.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone.replace(/[^\d]/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Additional validation for employee roles
    if (selectedUserType?.requiresApproval) {
      if (!formData.department.trim()) {
        Alert.alert('Error', 'Please enter your department');
        return false;
      }
      if (!formData.employeeId.trim()) {
        Alert.alert('Error', 'Please enter your employee ID');
        return false;
      }
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await axios.post(
        'http://192.168.29.161:3000/api/auth/register',
        {
          fullname: formData.fullname.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.replace(/[^\d]/g, ''),
          password: formData.password,
          role: formData.role,
          department: formData.department.trim(),
          employee_id: formData.employeeId.trim(),
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const { requiresApproval } = response.data.data;

        if (requiresApproval) {
          Alert.alert(
            'Registration Successful!',
            'Your account has been created and is pending admin approval. You will be notified once your account is approved.',
            [{ 
              text: 'OK', 
              onPress: () => navigation.navigate('LoginScreen')
            }]
          );
        } else {
          Alert.alert(
            'Registration Successful!',
            'Your account has been created successfully. You can now sign in.',
            [{ 
              text: 'OK', 
              onPress: () => navigation.navigate('LoginScreen')
            }]
          );
        }
      } else {
        Alert.alert('Registration Failed', response.data.message || 'Unable to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.response?.status === 409) {
        Alert.alert('Registration Failed', 'An account with this email or phone number already exists');
      } else if (error.code === 'ECONNABORTED') {
        Alert.alert('Connection Timeout', 'Please check your internet connection and try again');
      } else {
        Alert.alert('Registration Failed', 'Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeContainer}>
      <Text style={styles.userTypeLabel}>Account Type *</Text>
      
      <TouchableOpacity
        style={styles.selectedUserType}
        onPress={() => setShowUserTypes(!showUserTypes)}
      >
        <View style={styles.userTypeInfo}>
          <View style={[styles.userTypeIcon, { backgroundColor: selectedUserType?.color }]}>
            <Icon name={selectedUserType?.icon} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.userTypeText}>
            <Text style={styles.userTypeTitle}>{selectedUserType?.label}</Text>
            <Text style={styles.userTypeDesc}>{selectedUserType?.description}</Text>
          </View>
        </View>
        <Icon name={showUserTypes ? 'chevron-up' : 'chevron-down'} size={20} color="#64748B" />
      </TouchableOpacity>

      {showUserTypes && (
        <View style={styles.userTypeOptions}>
          {userTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.userTypeOption,
                formData.role === type.key && styles.userTypeOptionSelected
              ]}
              onPress={() => {
                setFormData({ ...formData, role: type.key });
                setShowUserTypes(false);
              }}
            >
              <View style={[styles.userTypeIcon, { backgroundColor: type.color }]}>
                <Icon name={type.icon} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.userTypeText}>
                <Text style={styles.userTypeTitle}>{type.label}</Text>
                <Text style={styles.userTypeDesc}>{type.description}</Text>
                {type.requiresApproval && (
                  <Text style={styles.approvalNote}>Requires admin approval</Text>
                )}
              </View>
              {formData.role === type.key && (
                <Icon name="check-circle" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedUserType?.requiresApproval && (
        <View style={styles.approvalMessage}>
          <Icon name="info" size={16} color="#F59E0B" />
          <Text style={styles.approvalMessageText}>
            Employee accounts require admin approval before you can access the system.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Join our business platform</Text>
          </View>
        </View>

        {/* Signup Form */}
        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            value={formData.fullname}
            onChangeText={(text) => setFormData({ ...formData, fullname: text })}
            placeholder="Enter your full name"
            leftIcon="user"
            required
          />

          <Input
            label="Email Address"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail"
            required
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            leftIcon="phone"
            required
          />

          {renderUserTypeSelector()}

          {selectedUserType?.requiresApproval && (
            <>
              <Input
                label="Department"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                placeholder="Enter your department"
                leftIcon="briefcase"
                required
              />

              <Input
                label="Employee ID"
                value={formData.employeeId}
                onChangeText={(text) => setFormData({ ...formData, employeeId: text })}
                placeholder="Enter your employee ID"
                leftIcon="hash"
                required
              />
            </>
          )}

          <Input
            label="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            placeholder="Enter your password"
            secureTextEntry
            leftIcon="lock"
            required
          />

          <Input
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            placeholder="Confirm your password"
            secureTextEntry
            leftIcon="lock"
            required
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            style={styles.signupButton}
          />

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LoginScreen')}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  userTypeContainer: {
    marginBottom: 16,
  },
  userTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  selectedUserType: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userTypeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userTypeText: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  userTypeDesc: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  userTypeOptions: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userTypeOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  approvalNote: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 2,
  },
  approvalMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginTop: 8,
  },
  approvalMessageText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  signupButton: {
    marginTop: 24,
    marginBottom: 24,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 4,
  },
  loginButton: {
    padding: 4,
  },
  loginButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SignupScreen;