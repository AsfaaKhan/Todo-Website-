// Chat API service wrapper for communication with backend

import { ChatMessageRequest, ChatMessageResponse } from '../../types/chat';

// Use NEXT_PUBLIC environment variable which is available on the client side
// If not set, dynamically determine based on deployment environment
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://khanzadiasfi0314-todoapp-chatbot.hf.space' // Use deployed backend for Vercel
    : 'http://localhost:8000'); // Default to localhost for local development

class ChatApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BACKEND_BASE_URL;
  }

  /**
   * Start a new chat session
   * @returns Session ID and Conversation ID
   */
  async startSession(): Promise<{ sessionId: string; conversationId: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting chat session:', error);
      throw error;
    }
  }

  /**
   * Send a message to the AI agent
   * @param sessionId - The chat session ID
   * @param request - The message request containing message and userId
   * @returns AI response
   */
  async sendMessage(sessionId: string, request: ChatMessageRequest): Promise<ChatMessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a session
   * @param sessionId - The chat session ID
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip
   * @returns Chat history
   */
  async getChatHistory(sessionId: string, limit?: number, offset?: number): Promise<{
    messages: any[];
    totalCount: number;
    sessionId: string;
    conversationId: number;
  }> {
    try {
      let url = `${this.baseUrl}/api/chat/${sessionId}/history`;
      const params = new URLSearchParams();

      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get chat history: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * End a chat session
   * @param sessionId - The chat session ID
   * @returns Success message
   */
  async endSession(sessionId: string): Promise<{ message: string; sessionId: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from localStorage or context
   * @returns Auth token string
   */
  private getAuthToken(): string {
    // Use the same token key as in the auth system ('access_token')
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token') || '';
    }
    return '';
  }

  /**
   * Get current user ID from auth context
   * @returns User ID
   */
  private getCurrentUserId(): number {
    // In a real app, this would come from your auth context
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          return parsed.id || 1; // Default to 1 if no user ID found
        } catch (e) {
          return 1; // Default to 1 if parsing fails
        }
      }
    }
    return 1; // Default to 1 if no user data found
  }
}

// Create a singleton instance
const chatApi = new ChatApiService();

export { chatApi, ChatApiService };