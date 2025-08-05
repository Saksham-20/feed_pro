// src/services/offline.js
import NetInfo from '@react-native-community/netinfo';
import { storageService } from './storage';
import { STORAGE_KEYS } from '../utils/constants';

export const offlineService = {
  async addToSyncQueue(action) {
    try {
      const queue = await storageService.getItem(STORAGE_KEYS.SYNC_QUEUE) || [];
      const queueItem = {
        id: Date.now().toString(),
        action,
        timestamp: Date.now(),
        attempts: 0,
      };
      
      queue.push(queueItem);
      await storageService.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
      
      return { success: true, id: queueItem.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getSyncQueue() {
    try {
      const queue = await storageService.getItem(STORAGE_KEYS.SYNC_QUEUE) || [];
      return { success: true, queue };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async removeFromSyncQueue(itemId) {
    try {
      const queue = await storageService.getItem(STORAGE_KEYS.SYNC_QUEUE) || [];
      const updatedQueue = queue.filter(item => item.id !== itemId);
      await storageService.setItem(STORAGE_KEYS.SYNC_QUEUE, updatedQueue);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async processSyncQueue() {
    try {
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        return { success: false, error: 'No network connection' };
      }

      const { queue } = await this.getSyncQueue();
      const results = [];

      for (const item of queue) {
        try {
          // Process sync item based on action type
          const result = await this.processSyncItem(item);
          
          if (result.success) {
            await this.removeFromSyncQueue(item.id);
            results.push({ ...item, success: true });
          } else {
            // Increment attempts and retry later if not max attempts
            item.attempts++;
            if (item.attempts >= 3) {
              await this.removeFromSyncQueue(item.id);
              results.push({ ...item, success: false, error: 'Max attempts reached' });
            } else {
              // Update queue with new attempt count
              const updatedQueue = queue.map(qItem => 
                qItem.id === item.id ? item : qItem
              );
              await storageService.setItem(STORAGE_KEYS.SYNC_QUEUE, updatedQueue);
            }
          }
        } catch (error) {
          console.error('Sync item processing error:', error);
          results.push({ ...item, success: false, error: error.message });
        }
      }

      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async processSyncItem(item) {
    // This would be implemented based on your specific sync requirements
    // For example:
    switch (item.action.type) {
      case 'CREATE_ORDER':
        // Sync order creation
        return { success: true };
      case 'UPDATE_PROFILE':
        // Sync profile update
        return { success: true };
      default:
        return { success: false, error: 'Unknown action type' };
    }
  },

  async isOnline() {
    try {
      const networkState = await NetInfo.fetch();
      return networkState.isConnected;
    } catch (error) {
      return false;
    }
  },
};