// components/business/FeedbackThread.js - Threaded feedback component
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

const FeedbackThread = ({ threadId, isAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [threadInfo, setThreadInfo] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchThread();
    // Set up polling for real-time updates
    const interval = setInterval(fetchThread, 5000);
    return () => clearInterval(interval);
  }, [threadId]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(
        `http://192.168.29.161:3000/api/feedback/thread/${threadId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setThreadInfo(response.data.data.thread);
        setMessages(response.data.data.messages);
        // Mark messages as read
        markMessagesAsRead();
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      Alert.alert('Error', 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.patch(
        `http://192.168.29.161:3000/api/feedback/thread/${threadId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.post(
        `http://192.168.29.161:3000/api/feedback/thread/${threadId}/message`,
        { message: newMessage.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNewMessage('');
        fetchThread(); // Refresh to get the new message
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const updateThreadStatus = async (status) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.patch(
        `http://192.168.29.161:3000/api/feedback/thread/${threadId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchThread();
    } catch (error) {
      console.error('Error updating thread status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = isAdmin ? item.sender_type === 'admin' : item.sender_type === 'client';
    const isLastMessage = index === messages.length - 1;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage,
        isLastMessage && styles.lastMessage
      ]}>
        <Card style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </Card>
      </View>
    );
  };

  const renderHeader = () => (
    <Card style={styles.threadHeader}>
      <Text style={styles.threadSubject}>{threadInfo?.subject}</Text>
      <View style={styles.threadMeta}>
        <View style={[styles.statusBadge, styles[`status_${threadInfo?.status}`]]}>
          <Text style={styles.statusText}>{threadInfo?.status?.toUpperCase()}</Text>
        </View>
        <View style={[styles.priorityBadge, styles[`priority_${threadInfo?.priority}`]]}>
          <Text style={styles.priorityText}>{threadInfo?.priority?.toUpperCase()}</Text>
        </View>
      </View>
      
      {isAdmin && threadInfo?.status !== 'closed' && (
        <View style={styles.adminActions}>
          <Button
            title="Mark Resolved"
            variant="success"
            size="small"
            onPress={() => updateThreadStatus('resolved')}
            style={styles.actionButton}
          />
          <Button
            title="Close Thread"
            variant="secondary"
            size="small"
            onPress={() => updateThreadStatus('closed')}
            style={styles.actionButton}
          />
        </View>
      )}
    </Card>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        ListHeaderComponent={threadInfo && renderHeader}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchThread}
      />
      
      {threadInfo?.status !== 'closed' && (
        <View style={styles.inputContainer}>
          <Input
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
            multiline
            numberOfLines={3}
            maxLength={500}
            style={styles.messageInput}
          />
          <Button
            title="Send"
            onPress={sendMessage}
            loading={sendingMessage}
            disabled={!newMessage.trim()}
            style={styles.sendButton}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  threadHeader: {
    margin: 16,
    padding: 16,
  },
  threadSubject: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  threadMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_open: {
    backgroundColor: '#DBEAFE',
  },
  status_in_progress: {
    backgroundColor: '#FEF3C7',
  },
  status_resolved: {
    backgroundColor: '#D1FAE5',
  },
  status_closed: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priority_low: {
    backgroundColor: '#F0FDF4',
  },
  priority_medium: {
    backgroundColor: '#FFFBEB',
  },
  priority_high: {
    backgroundColor: '#FEE2E2',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  lastMessage: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
  },
  myMessageBubble: {
    backgroundColor: '#6366F1',
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  messageInput: {
    marginBottom: 0,
  },
  sendButton: {
    marginTop: 8,
  },
});

export default FeedbackThread;