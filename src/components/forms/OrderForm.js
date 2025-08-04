import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Button from '../common/Button';
import Input from '../common/Input';
import { theme } from '../../styles/theme';
import { validateRequired, validateNumber } from '../../utils/validation';

const OrderForm = ({ onSubmit, loading = false, initialData = {} }) => {
  const [formData, setFormData] = useState({
    productName: initialData.productName || '',
    productCategory: initialData.productCategory || '',
    quantity: initialData.quantity?.toString() || '',
    unit: initialData.unit || 'pcs',
    unitPrice: initialData.unitPrice?.toString() || '',
    discount: initialData.discount?.toString() || '0',
    description: initialData.description || '',
    priority: initialData.priority || 'medium',
    expectedDeliveryDate: initialData.expectedDeliveryDate || '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.productName)) {
      newErrors.productName = 'Product name is required';
    }

    if (!validateRequired(formData.quantity)) {
      newErrors.quantity = 'Quantity is required';
    } else if (!validateNumber(formData.quantity) || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }

    if (formData.unitPrice && (!validateNumber(formData.unitPrice) || parseFloat(formData.unitPrice) < 0)) {
      newErrors.unitPrice = 'Please enter a valid unit price';
    }

    if (formData.discount && (!validateNumber(formData.discount) || parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100)) {
      newErrors.discount = 'Discount must be between 0-100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors and try again');
      return;
    }

    const processedData = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
      discount: parseFloat(formData.discount || 0),
    };

    onSubmit(processedData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const discount = parseFloat(formData.discount) || 0;
    
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;
    
    return { subtotal, discountAmount, total };
  };

  const { subtotal, discountAmount, total } = calculateTotal();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Information</Text>
        
        <Input
          label="Product Name"
          value={formData.productName}
          onChangeText={(text) => handleInputChange('productName', text)}
          placeholder="Enter product name"
          error={errors.productName}
          required
        />

        <Input
          label="Product Category"
          value={formData.productCategory}
          onChangeText={(text) => handleInputChange('productCategory', text)}
          placeholder="Enter product category"
        />

        <Input
          label="Description"
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
          placeholder="Product description"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quantity & Pricing</Text>
        
        <View style={styles.row}>
          <Input
            label="Quantity"
            value={formData.quantity}
            onChangeText={(text) => handleInputChange('quantity', text)}
            placeholder="0"
            keyboardType="numeric"
            error={errors.quantity}
            style={styles.flex2}
            required
          />

          <Input
            label="Unit"
            value={formData.unit}
            onChangeText={(text) => handleInputChange('unit', text)}
            placeholder="pcs"
            style={styles.flex1}
          />
        </View>

        <Input
          label="Unit Price (₹)"
          value={formData.unitPrice}
          onChangeText={(text) => handleInputChange('unitPrice', text)}
          placeholder="0.00"
          keyboardType="numeric"
          error={errors.unitPrice}
        />

        <Input
          label="Discount (%)"
          value={formData.discount}
          onChangeText={(text) => handleInputChange('discount', text)}
          placeholder="0"
          keyboardType="numeric"
          error={errors.discount}
        />

        {formData.unitPrice && formData.quantity && (
          <View style={styles.calculations}>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Subtotal:</Text>
              <Text style={styles.calculationValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Discount:</Text>
              <Text style={styles.calculationValue}>-₹{discountAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.calculationRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Details</Text>
        
        <Input
          label="Expected Delivery Date"
          value={formData.expectedDeliveryDate}
          onChangeText={(text) => handleInputChange('expectedDeliveryDate', text)}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Submit Order"
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  calculations: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 16,
    color: theme.colors.gray[600],
  },
  calculationValue: {
    fontSize: 16,
    color: theme.colors.gray[800],
    fontWeight: '500',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary[600],
  },
  footer: {
    padding: 20,
  },
  submitButton: {
    marginTop: 16,
  },
});

export default OrderForm;
