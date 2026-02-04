// Offline mode handler for chat operations
// Manages chat functionality when the user is offline

interface OfflineMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status: 'sent' | 'pending' | 'failed';
  retryCount: number;
}

interface OfflineQueueItem {
  id: string;
  action: 'sendMessage' | 'updateTodo' | 'createTodo' | 'deleteTodo' | 'completeTodo';
  params: any;
  timestamp: Date;
  retryCount: number;
}

class OfflineHandler {
  private isOffline: boolean = false;
  private pendingMessages: OfflineMessage[] = [];
  private actionQueue: OfflineQueueItem[] = [];
  private retryTimeout: number = 5000; // 5 seconds
  private maxRetries: number = 3;
  private retryIntervals: number[] = [5000, 15000, 30000]; // 5s, 15s, 30s

  constructor() {
    this.setupOfflineListeners();
    this.loadFromStorage();
  }

  /**
   * Set up event listeners for online/offline events
   */
  private setupOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Listen for custom network status events from other parts of the app
    window.addEventListener('network-status-change', (event: any) => {
      if (event.detail.status === 'offline') {
        this.handleOffline();
      } else if (event.detail.status === 'online') {
        this.handleOnline();
      }
    });
  }

  /**
   * Handle transition to offline mode
   */
  private handleOffline(): void {
    this.isOffline = true;
    console.log('[OFFLINE] Chat is now offline. Queuing messages and actions.');

    // Update UI to indicate offline status
    this.updateOfflineUI(true);

    // Save current state to storage
    this.saveToStorage();
  }

  /**
   * Handle transition to online mode
   */
  private handleOnline(): void {
    this.isOffline = false;
    console.log('[ONLINE] Chat is now online. Processing queued items.');

    // Update UI to indicate online status
    this.updateOfflineUI(false);

    // Process queued messages and actions
    setTimeout(() => {
      this.processQueuedItems();
    }, 1000); // Wait a moment for connection to stabilize
  }

  /**
   * Update UI to reflect offline status
   * @param isOffline - Whether the app is offline
   */
  private updateOfflineUI(isOffline: boolean): void {
    // Update any visual indicators of offline status
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.style.display = isOffline ? 'block' : 'none';
      offlineIndicator.textContent = isOffline ? 'Offline - Messages will be sent when connected' : 'Connected';
      offlineIndicator.className = isOffline ? 'offline-status' : 'online-status';
    }

    // Add/remove offline class to body
    if (isOffline) {
      document.body.classList.add('offline-mode');
    } else {
      document.body.classList.remove('offline-mode');
    }

    // Dispatch event for other components to listen to
    window.dispatchEvent(new CustomEvent('chat-offline-status-change', {
      detail: { isOffline }
    }));
  }

  /**
   * Check if the app is currently offline
   * @returns True if offline, false if online
   */
  isCurrentlyOffline(): boolean {
    return this.isOffline || !navigator.onLine;
  }

  /**
   * Queue a message for sending when online
   * @param message - The message to queue
   * @returns Queued message ID
   */
  queueMessage(message: Omit<OfflineMessage, 'id' | 'status' | 'retryCount'>): string {
    const queuedMessage: OfflineMessage = {
      id: this.generateId(),
      ...message,
      status: 'pending',
      retryCount: 0
    };

    this.pendingMessages.push(queuedMessage);
    this.saveToStorage();

    // Update UI to show queued message
    this.updateMessageUI(queuedMessage);

    return queuedMessage.id;
  }

  /**
   * Queue an action for execution when online
   * @param action - The action type
   * @param params - Parameters for the action
   * @returns Queued action ID
   */
  queueAction(action: OfflineQueueItem['action'], params: any): string {
    const queueItem: OfflineQueueItem = {
      id: this.generateId(),
      action,
      params,
      timestamp: new Date(),
      retryCount: 0
    };

    this.actionQueue.push(queueItem);
    this.saveToStorage();

    console.log(`[OFFLINE] Queued action: ${action}`, params);

    return queueItem.id;
  }

  /**
   * Process all queued messages and actions
   */
  private async processQueuedItems(): Promise<void> {
    console.log(`[ONLINE] Processing ${this.pendingMessages.length} queued messages and ${this.actionQueue.length} queued actions`);

    // Process messages first
    await this.processQueuedMessages();

    // Then process actions
    await this.processQueuedActions();

    // Save any changes to storage
    this.saveToStorage();
  }

  /**
   * Process queued messages
   */
  private async processQueuedMessages(): Promise<void> {
    const messagesToSend = [...this.pendingMessages];

    for (const message of messagesToSend) {
      if (message.status === 'pending' && message.sender === 'user') {
        try {
          // In a real implementation, this would send the message via the chat API
          // For now, we'll simulate the API call
          const success = await this.simulateSendMessage(message);

          if (success) {
            // Mark as sent
            const index = this.pendingMessages.findIndex(m => m.id === message.id);
            if (index !== -1) {
              this.pendingMessages[index].status = 'sent';
              this.updateMessageUI(this.pendingMessages[index]);
            }
          } else {
            // Increment retry count
            const index = this.pendingMessages.findIndex(m => m.id === message.id);
            if (index !== -1) {
              this.pendingMessages[index].retryCount++;

              if (this.pendingMessages[index].retryCount >= this.maxRetries) {
                this.pendingMessages[index].status = 'failed';
                this.updateMessageUI(this.pendingMessages[index]);
              }
            }
          }
        } catch (error) {
          console.error(`[OFFLINE] Failed to send queued message ${message.id}:`, error);

          // Increment retry count
          const index = this.pendingMessages.findIndex(m => m.id === message.id);
          if (index !== -1) {
            this.pendingMessages[index].retryCount++;

            if (this.pendingMessages[index].retryCount >= this.maxRetries) {
              this.pendingMessages[index].status = 'failed';
              this.updateMessageUI(this.pendingMessages[index]);
            }
          }
        }
      }
    }

    // Remove successfully sent messages
    this.pendingMessages = this.pendingMessages.filter(m => m.status !== 'sent');
  }

  /**
   * Process queued actions
   */
  private async processQueuedActions(): Promise<void> {
    const actionsToProcess = [...this.actionQueue];

    for (const actionItem of actionsToProcess) {
      try {
        // In a real implementation, this would execute the action via the appropriate API
        // For now, we'll simulate the action
        const success = await this.simulateActionExecution(actionItem);

        if (success) {
          // Remove from queue
          this.actionQueue = this.actionQueue.filter(a => a.id !== actionItem.id);
        } else {
          // Increment retry count
          const index = this.actionQueue.findIndex(a => a.id === actionItem.id);
          if (index !== -1) {
            this.actionQueue[index].retryCount++;

            if (this.actionQueue[index].retryCount >= this.maxRetries) {
              console.error(`[OFFLINE] Failed to execute action ${actionItem.id} after ${this.maxRetries} attempts`);
              // Keep in queue for potential future retry or user notification
            }
          }
        }
      } catch (error) {
        console.error(`[OFFLINE] Failed to execute queued action ${actionItem.id}:`, error);

        // Increment retry count
        const index = this.actionQueue.findIndex(a => a.id === actionItem.id);
        if (index !== -1) {
          this.actionQueue[index].retryCount++;

          if (this.actionQueue[index].retryCount >= this.maxRetries) {
            console.error(`[OFFLINE] Failed to execute action ${actionItem.id} after ${this.maxRetries} attempts`);
          }
        }
      }
    }
  }

  /**
   * Simulate sending a message (replace with actual API call)
   * @param message - The message to send
   * @returns Promise that resolves to success status
   */
  private async simulateSendMessage(message: OfflineMessage): Promise<boolean> {
    // This is a simulation - in a real app, this would be an actual API call
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate success 80% of the time
        const success = Math.random() > 0.2;
        resolve(success);
      }, 1000);
    });
  }

  /**
   * Simulate executing an action (replace with actual API call)
   * @param actionItem - The action to execute
   * @returns Promise that resolves to success status
   */
  private async simulateActionExecution(actionItem: OfflineQueueItem): Promise<boolean> {
    // This is a simulation - in a real app, this would be an actual API call
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate success 80% of the time
        const success = Math.random() > 0.2;
        resolve(success);
      }, 1500);
    });
  }

  /**
   * Update UI for a specific message
   * @param message - The message to update in UI
   */
  private updateMessageUI(message: OfflineMessage): void {
    // Update any message-specific UI elements
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
    if (messageElement) {
      const statusElement = messageElement.querySelector('.message-status');
      if (statusElement) {
        switch (message.status) {
          case 'pending':
            statusElement.textContent = 'Sending...';
            statusElement.className = 'message-status pending';
            break;
          case 'sent':
            statusElement.textContent = 'Sent';
            statusElement.className = 'message-status sent';
            break;
          case 'failed':
            statusElement.textContent = 'Failed';
            statusElement.className = 'message-status failed';
            break;
        }
      }
    }
  }

  /**
   * Get offline status information
   * @returns Offline status information
   */
  getOfflineStatus(): {
    isOffline: boolean;
    queuedMessagesCount: number;
    queuedActionsCount: number;
    lastOnlineTime: Date | null;
  } {
    // In a real implementation, you'd track last online time
    return {
      isOffline: this.isCurrentlyOffline(),
      queuedMessagesCount: this.pendingMessages.filter(m => m.status === 'pending').length,
      queuedActionsCount: this.actionQueue.length,
      lastOnlineTime: null // Would be tracked in a real implementation
    };
  }

  /**
   * Clear all queued items
   */
  clearQueues(): void {
    this.pendingMessages = [];
    this.actionQueue = [];
    this.saveToStorage();
  }

  /**
   * Get all pending messages
   * @returns Array of pending messages
   */
  getPendingMessages(): OfflineMessage[] {
    return this.pendingMessages.filter(m => m.status === 'pending');
  }

  /**
   * Get all queued actions
   * @returns Array of queued actions
   */
  getQueuedActions(): OfflineQueueItem[] {
    return this.actionQueue;
  }

  /**
   * Generate a unique ID
   * @returns Unique ID string
   */
  private generateId(): string {
    return `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save offline state to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        pendingMessages: this.pendingMessages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        actionQueue: this.actionQueue.map(action => ({
          ...action,
          timestamp: action.timestamp.toISOString()
        })),
        isOffline: this.isOffline
      };

      localStorage.setItem('chat-offline-data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data to storage:', error);
    }
  }

  /**
   * Load offline state from localStorage
   */
  private loadFromStorage(): void {
    try {
      const dataStr = localStorage.getItem('chat-offline-data');
      if (dataStr) {
        const data = JSON.parse(dataStr);

        this.pendingMessages = data.pendingMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));

        this.actionQueue = data.actionQueue.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        }));

        this.isOffline = data.isOffline ?? false;

        // If we were offline when the app closed, maintain that state
        if (this.isOffline && navigator.onLine) {
          // Check if we're actually online now
          if (navigator.onLine) {
            this.handleOnline();
          }
        } else if (!this.isOffline && !navigator.onLine) {
          // If we thought we were online but the browser says offline
          this.handleOffline();
        }
      }
    } catch (error) {
      console.error('Failed to load offline data from storage:', error);
      // Initialize with empty arrays if loading fails
      this.pendingMessages = [];
      this.actionQueue = [];
    }
  }

  /**
   * Retry a specific failed message
   * @param messageId - ID of the message to retry
   * @returns Promise that resolves when retry is complete
   */
  async retryMessage(messageId: string): Promise<boolean> {
    const messageIndex = this.pendingMessages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      return false;
    }

    const message = this.pendingMessages[messageIndex];

    if (message.status !== 'failed' && message.status !== 'pending') {
      return false;
    }

    try {
      // Reset retry count and status
      this.pendingMessages[messageIndex].retryCount = 0;
      this.pendingMessages[messageIndex].status = 'pending';

      if (navigator.onLine) {
        // Try to send immediately
        const success = await this.simulateSendMessage(this.pendingMessages[messageIndex]);

        if (success) {
          this.pendingMessages[messageIndex].status = 'sent';
          this.updateMessageUI(this.pendingMessages[messageIndex]);
        } else {
          this.pendingMessages[messageIndex].retryCount++;
          if (this.pendingMessages[messageIndex].retryCount >= this.maxRetries) {
            this.pendingMessages[messageIndex].status = 'failed';
          }
        }

        this.saveToStorage();
        return success;
      } else {
        // Will be retried when we come back online
        return false;
      }
    } catch (error) {
      console.error(`Failed to retry message ${messageId}:`, error);
      return false;
    }
  }

  /**
   * Retry a specific failed action
   * @param actionId - ID of the action to retry
   * @returns Promise that resolves when retry is complete
   */
  async retryAction(actionId: string): Promise<boolean> {
    const actionIndex = this.actionQueue.findIndex(a => a.id === actionId);

    if (actionIndex === -1) {
      return false;
    }

    const action = this.actionQueue[actionIndex];

    try {
      if (navigator.onLine) {
        // Try to execute immediately
        const success = await this.simulateActionExecution(action);

        if (success) {
          // Remove from queue
          this.actionQueue.splice(actionIndex, 1);
        } else {
          this.actionQueue[actionIndex].retryCount++;
        }

        this.saveToStorage();
        return success;
      } else {
        // Will be retried when we come back online
        return false;
      }
    } catch (error) {
      console.error(`Failed to retry action ${actionId}:`, error);
      return false;
    }
  }

  /**
   * Get messages that failed to send
   * @returns Array of failed messages
   */
  getFailedMessages(): OfflineMessage[] {
    return this.pendingMessages.filter(m => m.status === 'failed');
  }

  /**
   * Get actions that failed to execute
   * @returns Array of failed actions
   */
  getFailedActions(): OfflineQueueItem[] {
    return this.actionQueue.filter(a => a.retryCount >= this.maxRetries);
  }

  /**
   * Remove a specific message from the queue
   * @param messageId - ID of the message to remove
   * @returns True if message was removed, false otherwise
   */
  removeMessage(messageId: string): boolean {
    const initialLength = this.pendingMessages.length;
    this.pendingMessages = this.pendingMessages.filter(m => m.id !== messageId);
    const removed = initialLength !== this.pendingMessages.length;

    if (removed) {
      this.saveToStorage();
    }

    return removed;
  }

  /**
   * Remove a specific action from the queue
   * @param actionId - ID of the action to remove
   * @returns True if action was removed, false otherwise
   */
  removeAction(actionId: string): boolean {
    const initialLength = this.actionQueue.length;
    this.actionQueue = this.actionQueue.filter(a => a.id !== actionId);
    const removed = initialLength !== this.actionQueue.length;

    if (removed) {
      this.saveToStorage();
    }

    return removed;
  }

  /**
   * Clear all failed items
   */
  clearFailedItems(): void {
    this.pendingMessages = this.pendingMessages.filter(m => m.status !== 'failed');
    this.actionQueue = this.actionQueue.filter(a => a.retryCount < this.maxRetries);
    this.saveToStorage();
  }

  /**
   * Get statistics about offline operations
   * @returns Offline operation statistics
   */
  getStatistics(): {
    totalQueuedMessages: number;
    sentMessages: number;
    failedMessages: number;
    totalQueuedActions: number;
    completedActions: number;
    failedActions: number;
    currentOfflineTime: number | null;
  } {
    const sentMessages = this.pendingMessages.filter(m => m.status === 'sent').length;
    const failedMessages = this.pendingMessages.filter(m => m.status === 'failed').length;

    const failedActions = this.actionQueue.filter(a => a.retryCount >= this.maxRetries).length;
    const completedActions = 0; // Would track completed actions in a real implementation

    return {
      totalQueuedMessages: this.pendingMessages.length,
      sentMessages,
      failedMessages,
      totalQueuedActions: this.actionQueue.length,
      completedActions,
      failedActions,
      currentOfflineTime: null // Would track this in a real implementation
    };
  }

  /**
   * Cleanup method to remove event listeners
   */
  cleanup(): void {
    // In a real implementation, you'd remove event listeners
    // This is kept simple for this example
  }
}

// Create a singleton instance
const offlineHandler = new OfflineHandler();

export { offlineHandler, OfflineHandler, type OfflineMessage, type OfflineQueueItem };