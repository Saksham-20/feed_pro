// src/components/forms/OrderForm.js
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
import Card from '../common/Card';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/helpers';
import { validateRequired, validateNumber, validateEmail } from '../../utils/validation';

const OrderForm = ({ 
  onSubmit, 
  loading = false, 
  initialData = {},
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    customer_name: initialData.customer_name || '',
    customer_email: initialData.customer_email || '',
    customer_phone: initialData.customer_phone || '',
    product_name: initialData.product_name || '',
    quantity: initialData.quantity?.toString() || '1',
    unit_price: initialData.unit_price?.toString() || '',
    description: initialData.description || '',
    delivery_address: initialData.delivery_address || '',
    expected_delivery: initialData.expected_delivery || '',
    special_instructions: initialData.special_instructions || '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.customer_name)) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (!validateRequired(formData.customer_email)) {
      newErrors.customer_email = 'Email is required';
    } else if (!validateEmail(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email';
    }

    if (!validateRequired(formData.customer_phone)) {
      newErrors.customer_phone = 'Phone number is required';
    }

    if (!validateRequired(formData.product_name)) {
      newErrors.product_name = 'Product name is required';
    }

    if (!validateRequired(formData.quantity)) {
      newErrors.quantity = 'Quantity is required';
    } else if (!validateNumber(formData.quantity) || parseInt(formData.quantity) < 1) {
      newErrors.quantity = 'Please enter a valid quantity';
    }

    if (!validateRequired(formData.unit_price)) {
      newErrors.unit_price = 'Unit price is required';
    } else if (!validateNumber(formData.unit_price) || parseFloat(formData.unit_price) <= 0) {
      newErrors.unit_price = 'Please enter a valid price';
    }

    if (!validateRequired(formData.delivery_address)) {
      newErrors.delivery_address = 'Delivery address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    const orderData = {
      ...formData,
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      total_amount: parseInt(formData.quantity) * parseFloat(formData.unit_price),
    };

    onSubmit(orderData);
  };

  const calculateTotal = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    return quantity * unitPrice;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        
        <Input
          label="Customer Name"
          value={formData.customer_name}
          onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
          placeholder="Enter customer name"
          error={errors.customer_name}
          required
        />

        <Input
          label="Email Address"
          value={formData.customer_email}
          onChangeText={(text) => setFormData({ ...formData, customer_email: text })}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.customer_email}
          required
        />

        <Input
          label="Phone Number"
          value={formData.customer_phone}
          onChangeText={(text) => setFormData({ ...formData, customer_phone: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          error={errors.customer_phone}
          required
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        
        <Input
          label="Product Name"
          value={formData.product_name}
          onChangeText={(text) => setFormData({ ...formData, product_name: text })}
          placeholder="Enter product name"
          error={errors.product_name}
          required
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Input
              label="Quantity"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="1"
              keyboardType="numeric"
              error={errors.quantity}
              required
            />
          </View>

          <View style={styles.halfWidth}>
            <Input
              label="Unit Price (₹)"
              value={formData.unit_price}
              onChangeText={(text) => setFormData({ ...formData, unit_price: text })}
              placeholder="0.00"
              keyboardType="numeric"
              error={errors.unit_price}
              required
            />
          </View>
        </View>

        <Input
          label="Description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Product description (optional)"
          multiline
          numberOfLines={3}
        />

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(calculateTotal())}
          </Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        
        <Input
          label="Delivery Address"
          value={formData.delivery_address}
          onChangeText={(text) => setFormData({ ...formData, delivery_address: text })}
          placeholder="Enter full delivery address"
          multiline
          numberOfLines={3}
          error={errors.delivery_address}
          required
        />

        <Input
          label="Expected Delivery Date"
          value={formData.expected_delivery}
          onChangeText={(text) => setFormData({ ...formData, expected_delivery: text })}
          placeholder="DD/MM/YYYY (optional)"
        />

        <Input
          label="Special Instructions"
          value={formData.special_instructions}
          onChangeText={(text) => setFormData({ ...formData, special_instructions: text })}
          placeholder="Any special delivery instructions (optional)"
          multiline
          numberOfLines={2}
        />
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title={isEdit ? 'Update Order' : 'Create Order'}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  section: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  buttonContainer: {
    padding: 16,
  },
});

export default OrderForm;