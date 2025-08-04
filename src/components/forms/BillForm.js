import React, { useState, useEffect } from 'react';
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
import { formatCurrency } from '../../utils/helpers';
import { validateRequired, validateNumber } from '../../utils/validation';

const BillForm = ({ 
  onSubmit, 
  loading = false, 
  initialData = {},
  orderData = null 
}) => {
  const [formData, setFormData] = useState({
    billDate: initialData.billDate || new Date().toISOString().split('T')[0],
    dueDate: initialData.dueDate || '',
    items: initialData.items || (orderData ? [{
      name: orderData.product_name,
      quantity: orderData.quantity,
      unitPrice: orderData.unit_price || 0,
      total: orderData.total_amount || 0
    }] : []),
    subtotal: initialData.subtotal || 0,
    taxRate: initialData.taxRate || 18,
    taxAmount: initialData.taxAmount || 0,
    discountAmount: initialData.discountAmount || 0,
    totalAmount: initialData.totalAmount || 0,
    notes: initialData.notes || '',
  });

  const [errors, setErrors] = useState({});

  // Calculate totals whenever items or tax/discount change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.taxRate, formData.discountAmount]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const taxAmount = subtotal * (formData.taxRate / 100);
    const totalAmount = subtotal + taxAmount - formData.discountAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount: Math.max(0, totalAmount)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.billDate)) {
      newErrors.billDate = 'Bill date is required';
    }

    if (!validateRequired(formData.dueDate)) {
      newErrors.dueDate = 'Due date is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    // Validate each item
    formData.items.forEach((item, index) => {
      if (!validateRequired(item.name)) {
        newErrors[`item_${index}_name`] = 'Item name is required';
      }
      if (!validateNumber(item.quantity) || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Valid quantity required';
      }
      if (!validateNumber(item.unitPrice) || item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Valid unit price required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors and try again');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          // Calculate total for this item
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));

    // Clear specific item errors
    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill Information</Text>
        
        <View style={styles.row}>
          <Input
            label="Bill Date"
            value={formData.billDate}
            onChangeText={(text) => handleInputChange('billDate', text)}
            placeholder="YYYY-MM-DD"
            error={errors.billDate}
            style={styles.flex1}
            required
          />

          <Input
            label="Due Date"
            value={formData.dueDate}
            onChangeText={(text) => handleInputChange('dueDate', text)}
            placeholder="YYYY-MM-DD"
            error={errors.dueDate}
            style={styles.flex1}
            required
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <TouchableOpacity onPress={addItem} style={styles.addButton}>
            <Icon name="plus" size={20} color={theme.colors.primary[500]} />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {formData.items.map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Item {index + 1}</Text>
              {formData.items.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeItem(index)}
                  style={styles.removeButton}
                >
                  <Icon name="trash-2" size={16} color={theme.colors.danger[500]} />
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="Item Name"
              value={item.name}
              onChangeText={(text) => updateItem(index, 'name', text)}
              placeholder="Enter item name"
              error={errors[`item_${index}_name`]}
              required
            />

            <View style={styles.row}>
              <Input
                label="Quantity"
                value={item.quantity.toString()}
                onChangeText={(text) => updateItem(index, 'quantity', parseFloat(text) || 0)}
                placeholder="0"
                keyboardType="numeric"
                error={errors[`item_${index}_quantity`]}
                style={styles.flex1}
                required
              />

              <Input
                label="Unit Price (₹)"
                value={item.unitPrice.toString()}
                onChangeText={(text) => updateItem(index, 'unitPrice', parseFloat(text) || 0)}
                placeholder="0.00"
                keyboardType="numeric"
                error={errors[`item_${index}_unitPrice`]}
                style={styles.flex1}
                required
              />
            </View>

            <View style={styles.itemTotal}>
              <Text style={styles.itemTotalLabel}>Item Total:</Text>
              <Text style={styles.itemTotalValue}>
                {formatCurrency(item.quantity * item.unitPrice)}
              </Text>
            </View>
          </View>
        ))}

        {errors.items && (
          <Text style={styles.errorText}>{errors.items}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax & Discounts</Text>
        
        <View style={styles.row}>
          <Input
            label="Tax Rate (%)"
            value={formData.taxRate.toString()}
            onChangeText={(text) => handleInputChange('taxRate', parseFloat(text) || 0)}
            placeholder="18"
            keyboardType="numeric"
            style={styles.flex1}
          />

          <Input
            label="Discount Amount (₹)"
            value={formData.discountAmount.toString()}
            onChangeText={(text) => handleInputChange('discountAmount', parseFloat(text) || 0)}
            placeholder="0.00"
            keyboardType="numeric"
            style={styles.flex1}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill Summary</Text>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(formData.subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax ({formData.taxRate}%):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(formData.taxAmount)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount:</Text>
            <Text style={styles.summaryValue}>-{formatCurrency(formData.discountAmount)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>{formatCurrency(formData.totalAmount)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Input
          label="Notes"
          value={formData.notes}
          onChangeText={(text) => handleInputChange('notes', text)}
          placeholder="Additional notes or terms"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Generate Bill"
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.primary[50],
  },
  addButtonText: {
    color: theme.colors.primary[500],
    fontWeight: '500',
    marginLeft: 4,
  },
  itemContainer: {
    padding: 16,
    backgroundColor: theme.colors.gray[50],
    borderRadius: 8,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[700],
  },
  removeButton: {
    padding: 4,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  itemTotalLabel: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  summaryContainer: {
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.colors.gray[600],
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.gray[800],
  },
  totalRow: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: theme.colors.gray[300],
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary[600],
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.danger[500],
    marginTop: 4,
  },
  footer: {
    padding: 20,
  },
  submitButton: {
    marginTop: 16,
  },
});

export default BillForm;
