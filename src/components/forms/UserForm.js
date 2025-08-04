// src/components/forms/UserForm.js - Complete User management form
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Button from '../common/Button';
import Input from '../common/Input';
import { theme } from '../../styles/theme';
import { USER_ROLES } from '../../utils/constants';
import { validateEmail, validatePhone } from '../../utils/validation';

const UserForm = ({ 
  onSubmit, 
  loading = false, 
  initialData = {},
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    fullname: initialData.fullname || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    role: initialData.role || USER_ROLES.CLIENT,
    department: initialData.department || '',
    employee_id: initialData.employee_id || '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const userRoles = [
    { key: USER_ROLES.CLIENT, label: 'Client', needsApproval: false },
    { key: USER_ROLES.SALES_PURCHASE, label: 'Sales & Purchase', needsApproval: true },
    { key: USER_ROLES.MARKETING, label: 'Marketing', needsApproval: true },
    { key: USER_ROLES.OFFICE, label: 'Office', needsApproval: true },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Employee specific validations
    const selectedRole = userRoles.find(role => role.key === formData.role);
    if (selectedRole?.needsApproval) {
      if (!formData.department.trim()) {
        newErrors.department = 'Department is required for employees';
      }
      if (!formData.employee_id.trim()) {
        newErrors.employee_id = 'Employee ID is required for employees';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors and try again');
      return;
    }

    const submitData = { ...formData };
    
    // Remove password fields if editing and passwords are empty
    if (isEdit && !submitData.password) {
      delete submitData.password;
      delete submitData.confirmPassword;
    }

    onSubmit(submitData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const selectedRole = userRoles.find(role => role.key === formData.role);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <Input
          label="Full Name"
          value={formData.fullname}
          onChangeText={(text) => handleInputChange('fullname', text)}
          placeholder="Enter full name"
          error={errors.fullname}
          required
        />

        <Input
          label="Email Address"
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          required
        />

        <Input
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => handleInputChange('phone', text)}
          placeholder="Enter 10-digit phone number"
          keyboardType="phone-pad"
          maxLength={10}
          error={errors.phone}
          required
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role & Permissions</Text>
        
        <Text style={styles.label}>User Role *</Text>
        <TouchableOpacity
          style={styles.roleSelector}
          onPress={() => setShowRoleSelector(!showRoleSelector)}
        >
          <View style={styles.roleInfo}>
            <Text style={styles.roleLabel}>{selectedRole?.label}</Text>
            {selectedRole?.needsApproval && (
              <Text style={styles.approvalNote}>Requires admin approval</Text>
            )}
          </View>
          <Icon 
            name={showRoleSelector ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.colors.gray[600]} 
          />
        </TouchableOpacity>

        {showRoleSelector && (
          <View style={styles.roleOptions}>
            {userRoles.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={[
                  styles.roleOption,
                  formData.role === role.key && styles.selectedRole
                ]}
                onPress={() => {
                  handleInputChange('role', role.key);
                  setShowRoleSelector(false);
                }}
              >
                <View style={styles.roleOptionContent}>
                  <Text style={styles.roleOptionLabel}>{role.label}</Text>
                  {role.needsApproval && (
                    <Text style={styles.roleOptionNote}>Requires approval</Text>
                  )}
                </View>
                {formData.role === role.key && (
                  <Icon name="check" size={20} color={theme.colors.primary[500]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedRole?.needsApproval && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Details</Text>
          
          <Input
            label="Department"
            value={formData.department}
            onChangeText={(text) => handleInputChange('department', text)}
            placeholder="Enter department"
            error={errors.department}
            required
          />

          <Input
            label="Employee ID"
            value={formData.employee_id}
            onChangeText={(text) => handleInputChange('employee_id', text)}
            placeholder="Enter employee ID"
            error={errors.employee_id}
            required
          />
        </View>
      )}

      {!isEdit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <Input
            label="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            placeholder="Enter password"
            secureTextEntry
            error={errors.password}
            required
          />

          <Input
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            placeholder="Confirm password"
            secureTextEntry
            error={errors.confirmPassword}
            required
          />
        </View>
      )}

      <View style={styles.footer}>
        <Button
          title={isEdit ? 'Update User' : 'Create User'}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  section: {
    backgroundColor: theme.colors.white,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[800],
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    marginBottom: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  approvalNote: {
    fontSize: 12,
    color: theme.colors.accent[600],
    marginTop: 2,
  },
  roleOptions: {
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: 8,
    backgroundColor: theme.colors.white,
    marginTop: -16,
    marginBottom: 16,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  selectedRole: {
    backgroundColor: theme.colors.primary[50],
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  roleOptionNote: {
    fontSize: 12,
    color: theme.colors.accent[600],
    marginTop: 2,
  },
  footer: {
    padding: 20,
  },
  submitButton: {
    marginTop: 16,
  },
});

export default UserForm;