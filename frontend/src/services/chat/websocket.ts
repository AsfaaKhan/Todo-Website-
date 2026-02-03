// WebSocket connection manager for real-time chat communication

import { Message } from '../../types/chat';

interface WebSocketEventHandlers {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: Message) => void;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private eventHandlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private heartbeatInterval: number | null = null;
  private heartbeatTimeout: number | null = null;
  private heartbeatTimeoutDuration = 30000; // 30 seconds

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to the WebSocket server
   * @param handlers - Event handlers for WebSocket events
   */
  connect(handlers: WebSocketEventHandlers = {}): void {
    this.eventHandlers = handlers;

    // Close existing connection if any
    if (this.ws) {
      this.ws.close();
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = (event) => {
        this.reconnectAttempts = 0; // Reset attempts on successful connection
        this.startHeartbeat();

        if (this.eventHandlers.onOpen) {
          this.eventHandlers.onOpen(event);
        }
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();

        if (this.eventHandlers.onClose) {
          this.eventHandlers.onClose(event);
        }

        // Attempt to reconnect if it wasn't a manual close
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(this.eventHandlers);
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event);

        if (this.eventHandlers.onError) {
          this.eventHandlers.onError(event);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as Message;

          if (this.eventHandlers.onMessage) {
            this.eventHandlers.onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);

      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(new Event('error'));
      }
    }
  }

  /**
   * Send a message through the WebSocket
   * @param message - The message to send
   */
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', data);
      throw new Error('WebSocket is not connected');
    }
  }

  /**
   * Check if the WebSocket is currently connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.stopHeartbeat();
  }

  /**
   * Start heartbeat to keep the connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat

    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected()) {
        // Send ping message
        this.send({ type: 'ping' });

        // Set timeout for pong response
        this.heartbeatTimeout = window.setTimeout(() => {
          console.warn('Heartbeat timeout, closing connection');
          this.disconnect();
        }, this.heartbeatTimeoutDuration);
      }
    }, this.heartbeatTimeoutDuration / 2) as unknown as number; // Cast to number for TypeScript compatibility
  }

  /**
   * Stop the heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Get the current connection status
   * @returns Connection status string
   */
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (!this.ws) {
      return 'disconnected';
    }

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return this.reconnectAttempts > 0 ? 'reconnecting' : 'disconnected';
      default:
        return 'disconnected';
    }
  }
}

// Create a singleton instance
const webSocketManager = new WebSocketManager(process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:8080');

export { webSocketManager, WebSocketManager };