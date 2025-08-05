// src/components/forms/FeedbackForm.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';
import { theme } from '../../styles/theme';
import { useFeedback } from '../../context/FeedbackContext';
import { validateRequired } from '../../utils/validation';

const FeedbackForm = ({ 
  onSubmit, 
  loading = false, 
  initialData = {},
  mode = 'create' // 'create' or 'reply'
}) => {
  const { createThread, sendMessage } = useFeedback();
  const [formData, setFormData] = useState({
    subject: initialData.subject || '',
    message: initialData.message || '',
    priority: initialData.priority || 'medium',
    category: initialData.category || 'general',
    attachments: initialData.attachments || [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priorities = [
    { 
      key: 'low', 
      label: 'Low', 
      color: '#10B981', 
      icon: 'arrow-down',
      description: 'Non-urgent query'
    },
    { 
      key: 'medium', 
      label: 'Medium', 
      color: '#F59E0B', 
      icon: 'minus',
      description: 'Standard priority'
    },
    { 
      key: 'high', 
      label: 'High', 
      color: '#EF4444', 
      icon: 'arrow-up',
      description: 'Urgent attention needed'
    },
    { 
      key: 'urgent', 
      label: 'Urgent', 
      color: '#DC2626', 
      icon: 'alert-triangle',
      description: 'Critical issue'
    },
  ];

  const categories = [
    { 
      key: 'general', 
      label: 'General Inquiry', 
      icon: 'help-circle',
      description: 'General questions and support'
    },
    { 
      key: 'technical', 
      label: 'Technical Issue', 
      icon: 'settings',
      description: 'App bugs and technical problems'
    },
    { 
      key: 'billing', 
      label: 'Billing Question', 
      icon: 'credit-card',
      description: 'Payment and billing related'
    },
    { 
      key: 'feature', 
      label: 'Feature Request', 
      icon: 'plus-circle',
      description: 'Suggest new features'
    },
    { 
      key: 'complaint', 
      label: 'Complaint', 
      icon: 'alert-triangle',
      description: 'Service complaints and issues'
    },
    { 
      key: 'compliment', 
      label: 'Compliment', 
      icon: 'heart',
      description: 'Positive feedback and praise'
    },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.subject)) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!validateRequired(formData.message)) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.length > 2000) {
      newErrors.message = 'Message must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData = {
        ...formData,
        attachments: formData.attachments.map(att => att.uri || att.id),
      };

      let result;
      if (mode === 'create') {
        result = await createThread(feedbackData);
      } else {
        result = await sendMessage(initialData.threadId, feedbackData.message);
      }

      if (result.success) {
        Alert.alert(
          'Success', 
          mode === 'create' 
            ? 'Your feedback has been submitted successfully. We will respond shortly.'
            : 'Your message has been sent successfully.',
          [{ text: 'OK', onPress: () => onSubmit && onSubmit(result.data) }]
        );
        
        // Reset form if creating new feedback
        if (mode === 'create') {
          setFormData({
            subject: '',
            message: '',
            priority: 'medium',
            category: 'general',
            attachments: [],
          });
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Submit feedback error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachment = () => {
    // This would integrate with image/document picker
    Alert.alert('Attachments', 'Attachment feature coming soon!');
  };

  const removeAttachment = (index) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const renderPrioritySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Priority *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.priorityRow}>
          {priorities.map((priority) => (
            <TouchableOpacity
              key={priority.key}
              style={[
                styles.priorityCard,
                formData.priority === priority.key && styles.priorityCardSelected,
              ]}
              onPress={() => setFormData({ ...formData, priority: priority.key })}
            >
              <View style={[
                styles.priorityIcon,
                { backgroundColor: priority.color }
              ]}>
                <Icon
                  name={priority.icon}
                  size={16}
                  color="#FFFFFF"
                />
              </View>
              <Text style={[
                styles.priorityLabel,
                formData.priority === priority.key && styles.priorityLabelSelected,
              ]}>
                {priority.label}
              </Text>
              <Text style={styles.priorityDescription}>
                {priority.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Category *</Text>
      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryCard,
              formData.category === category.key && styles.categoryCardSelected,
            ]}
            onPress={() => setFormData({ ...formData, category: category.key })}
          >
            <Icon
              name={category.icon}
              size={24}
              color={formData.category === category.key ? theme.colors.primary : '#64748B'}
            />
            <Text style={[
              styles.categoryLabel,
              formData.category === category.key && styles.categoryLabelSelected,
            ]}>
              {category.label}
            </Text>
            <Text style={styles.categoryDescription}>
              {category.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAttachments = () => (
    <View style={styles.attachmentContainer}>
      <View style={styles.attachmentHeader}>
        <Text style={styles.selectorLabel}>Attachments (Optional)</Text>
        <TouchableOpacity
          style={styles.addAttachmentButton}
          onPress={handleAttachment}
        >
          <Icon name="paperclip" size={16} color={theme.colors.primary} />
          <Text style={styles.addAttachmentText}>Add File</Text>
        </TouchableOpacity>
      </View>
      
      {formData.attachments.length > 0 && (
        <View style={styles.attachmentList}>
          {formData.attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Icon name="file" size={16} color="#64748B" />
              <Text style={styles.attachmentName}>{attachment.name}</Text>
              <TouchableOpacity
                onPress={() => removeAttachment(index)}
                style={styles.removeAttachment}
              >
                <Icon name="x" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.formCard}>
        <View style={styles.formHeader}>
          <Icon name="message-circle" size={32} color={theme.colors.primary} />
          <Text style={styles.formTitle}>
            {mode === 'create' ? 'Send Feedback' : 'Reply to Thread'}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === 'create' 
              ? 'We value your feedback and will respond as soon as possible.'
              : 'Continue the conversation with our support team.'
            }
          </Text>
        </View>
        
        {mode === 'create' && (
          <Input
            label="Subject"
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            placeholder="Brief description of your feedback"
            error={errors.subject}
            required
            maxLength={100}
          />
        )}

        {mode === 'create' && renderCategorySelector()}
        {mode === 'create' && renderPrioritySelector()}

        <Input
          label={mode === 'create' ? 'Message' : 'Your Reply'}
          value={formData.message}
          onChangeText={(text) => setFormData({ ...formData, message: text })}
          placeholder={mode === 'create' 
            ? 'Please provide detailed information about your feedback...'
            : 'Type your reply here...'
          }
          multiline
          numberOfLines={6}
          error={errors.message}
          required
          maxLength={2000}
        />

        <View style={styles.characterCount}>
          <Text style={styles.characterCountText}>
            {formData.message.length}/2000 characters
          </Text>
        </View>

        {mode === 'create' && renderAttachments()}

        <View style={styles.submitContainer}>
          <Button
            title={mode === 'create' ? 'Send Feedback' : 'Send Reply'}
            onPress={handleSubmit}
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
            icon={mode === 'create' ? 'send' : 'message-circle'}
            style={styles.submitButton}
          />
          
          <Text style={styles.responseTime}>
            💬 Average response time: 2-4 hours
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  formCard: {
    margin: 16,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  priorityCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  priorityCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F4FF',
  },
  priorityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  priorityLabelSelected: {
    color: theme.colors.primary,
  },
  priorityDescription: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  categoryCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F4FF',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: theme.colors.primary,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  attachmentContainer: {
    marginBottom: 24,
  },
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: '#F0F4FF',
    gap: 6,
  },
  addAttachmentText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  attachmentList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  removeAttachment: {
    padding: 4,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  characterCountText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  submitContainer: {
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    marginBottom: 16,
  },
  responseTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
export default FeedbackForm;