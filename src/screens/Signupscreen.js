// src/screens/SignupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { theme } from '../styles/theme';
import { USER_ROLES } from '../utils/constants';
import api from '../services/api';

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    role: USER_ROLES.CLIENT,
    department: '',
    employeeId: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [showUserTypes, setShowUserTypes] = useState(false);

  const userTypes = [
    {
      role: USER_ROLES.CLIENT,
      label: 'Client',
      description: 'For customers and business clients',
      icon: 'user',
      color: '#6366F1',
      requiresApproval: false,
    },
    {
      role: USER_ROLES.SALES_PURCHASE,
      label: 'Sales & Purchase',
      description: 'For sales and purchase team members',
      icon: 'trending-up',
      color: '#10B981',
      requiresApproval: true,
    },
    {
      role: USER_ROLES.MARKETING,
      label: 'Marketing',
      description: 'For marketing team members',
      icon: 'megaphone',
      color: '#F59E0B',
      requiresApproval: true,
    },
    {
      role: USER_ROLES.OFFICE,
      label: 'Office Employee',
      description: 'For general office staff',
      icon: 'briefcase',
      color: '#8B5CF6',
      requiresApproval: true,
    },
  ];

  const selectedUserType = userTypes.find(type => type.role === formData.role);

  const handleSignup = async () => {
    // Validation
    if (!formData.fullname || !formData.email || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (selectedUserType?.requiresApproval && (!formData.department || !formData.employeeId)) {
      Alert.alert('Error', 'Department and Employee ID are required for employee accounts');
      return;
    }

    setLoading(true);
    try {
      const signupData = {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password,
      };

      if (selectedUserType?.requiresApproval) {
        signupData.department = formData.department;
        signupData.employee_id = formData.employeeId;
      }

      const response = await api.post('/api/auth/register', signupData);

      if (response.data.success) {
        if (selectedUserType?.requiresApproval) {
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
        <Icon name={showUserTypes ? 'chevron-up' : 'chevron-down'} size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal
        visible={showUserTypes}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserTypes(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUserTypes(false)}
        >
          <View style={styles.userTypeModal}>
            <Text style={styles.modalTitle}>Select Account Type</Text>
            
            {userTypes.map((type) => (
              <TouchableOpacity
                key={type.role}
                style={[
                  styles.userTypeOption,
                  formData.role === type.role && styles.selectedOption
                ]}
                onPress={() => {
                  setFormData({ ...formData, role: type.role });
                  setShowUserTypes(false);
                }}
              >
                <View style={styles.userTypeInfo}>
                  <View style={[styles.userTypeIcon, { backgroundColor: type.color }]}>
                    <Icon name={type.icon} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.userTypeText}>
                    <Text style={styles.userTypeTitle}>{type.label}</Text>
                    <Text style={styles.userTypeDesc}>{type.description}</Text>
                    {type.requiresApproval && (
                      <Text style={styles.approvalText}>Requires admin approval</Text>
                    )}
                  </View>
                </View>
                {formData.role === type.role && (
                  <Icon name="check" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
              disabled={loading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {loading && <LoadingSpinner overlay />}
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
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  signupButton: {
    marginTop: 24,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  loginLink: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  userTypeContainer: {
    marginBottom: 16,
  },
  userTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userTypeText: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  userTypeDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  userTypeModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F4FF',
  },
  approvalText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 2,
  },
});

export default SignupScreen;
