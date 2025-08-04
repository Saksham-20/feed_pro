// src/services/offline.js - Offline management service
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import api from './api';

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.init();
  }

  init() {
    // Monitor network status
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      if (wasOffline && this.isOnline) {
        this.processSyncQueue();
      }
    });

    // Load sync queue from storage
    this.loadSyncQueue();
  }

  async loadSyncQueue() {
    try {
      const queue = await AsyncStorage.getItem('syncQueue');
      this.syncQueue = queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  async saveSyncQueue() {
    try {
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  async addToQueue(action, data, endpoint, method = 'POST') {
    const queueItem = {
      id: Date.now().toString(),
      action,
      data,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return queueItem.id;
  }

  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const itemsToSync = [...this.syncQueue];
    
    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
        this.removeFromQueue(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
        item.retryCount = (item.retryCount || 0) + 1;
        
        // Remove item if too many retries
        if (item.retryCount >= 3) {
          this.removeFromQueue(item.id);
        }
      }
    }

    await this.saveSyncQueue();
  }

  async syncItem(item) {
    const { endpoint, method, data } = item;
    
    switch (method.toLowerCase()) {
      case 'post':
        return await api.post(endpoint, data);
      case 'put':
        return await api.put(endpoint, data);
      case 'patch':
        return await api.patch(endpoint, data);
      case 'delete':
        return await api.delete(endpoint);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  removeFromQueue(itemId) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== itemId);
  }

  async clearQueue() {
    this.syncQueue = [];
    await this.saveSyncQueue();
  }

  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      pendingActions: this.syncQueue.map(item => ({
        id: item.id,
        action: item.action,
        timestamp: item.timestamp,
        retryCount: item.retryCount
      }))
    };
  }
}

export default new OfflineService();
