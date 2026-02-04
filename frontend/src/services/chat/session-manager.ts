// Session management for chat operations
// Handles session timeouts, cleanup, and security

import { Message } from '../../types/chat';

interface SessionConfig {
  timeout: number; // Timeout in milliseconds
  maxInactiveTime: number; // Max inactive time before session invalidation
  cleanupInterval: number; // How often to run cleanup
}

class SessionManager {
  private activeSessions: Map<string, {
    id: string;
    userId: number;
    createdAt: Date;
    lastActive: Date;
    isActive: boolean;
    messages: Message[];
  }> = new Map();

  private config: SessionConfig = {
    timeout: 30 * 60 * 1000, // 30 minutes
    maxInactiveTime: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
  };

  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SessionConfig>) {
    this.config = { ...this.config, ...config };
    this.startCleanupProcess();
  }

  /**
   * Create a new chat session
   * @param userId - The user ID
   * @returns Session ID
   */
  createSession(userId: number): string {
    const sessionId = this.generateSessionId();

    this.activeSessions.set(sessionId, {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastActive: new Date(),
      isActive: true,
      messages: []
    });

    return sessionId;
  }

  /**
   * Get an active session
   * @param sessionId - The session ID
   * @returns Session data or null if not found/inactive
   */
  getSession(sessionId: string): {
    id: string;
    userId: number;
    createdAt: Date;
    lastActive: Date;
    isActive: boolean;
    messages: Message[];
  } | null {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is still valid
    if (!this.isValidSession(session)) {
      this.invalidateSession(sessionId);
      return null;
    }

    // Update last active time
    session.lastActive = new Date();
    this.activeSessions.set(sessionId, session);

    return session;
  }

  /**
   * Add a message to a session
   * @param sessionId - The session ID
   * @param message - The message to add
   */
  addMessage(sessionId: string, message: Message): boolean {
    const session = this.getSession(sessionId);

    if (!session || !session.isActive) {
      return false;
    }

    session.messages.push(message);
    session.lastActive = new Date();
    this.activeSessions.set(sessionId, session);

    return true;
  }

  /**
   * End a session
   * @param sessionId - The session ID
   */
  endSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return false;
    }

    session.isActive = false;
    this.activeSessions.set(sessionId, session);

    return true;
  }

  /**
   * Invalidate a session (force end)
   * @param sessionId - The session ID
   */
  invalidateSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }

  /**
   * Check if a session is valid
   * @param session - The session to validate
   * @returns True if valid, false otherwise
   */
  private isValidSession(session: {
    id: string;
    userId: number;
    createdAt: Date;
    lastActive: Date;
    isActive: boolean;
  }): boolean {
    if (!session.isActive) {
      return false;
    }

    const now = new Date();

    // Check if session has exceeded max lifetime
    if (now.getTime() - session.createdAt.getTime() > this.config.maxInactiveTime) {
      return false;
    }

    // Check if session has been inactive too long
    if (now.getTime() - session.lastActive.getTime() > this.config.timeout) {
      return false;
    }

    return true;
  }

  /**
   * Get all active sessions for a user
   * @param userId - The user ID
   * @returns Array of active session IDs
   */
  getActiveSessionsForUser(userId: number): string[] {
    const sessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId && session.isActive && this.isValidSession(session)) {
        sessions.push(sessionId);
      }
    }

    return sessions;
  }

  /**
   * Start the periodic cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (!this.isValidSession(session)) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Generate a unique session ID
   * @returns A unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session statistics
   * @returns Session statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    inactiveSessions: number;
  } {
    let activeCount = 0;
    let inactiveCount = 0;

    for (const session of this.activeSessions.values()) {
      if (session.isActive) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    }

    return {
      totalSessions: this.activeSessions.size,
      activeSessions: activeCount,
      inactiveSessions: inactiveCount
    };
  }

  /**
   * Destroy the session manager and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.activeSessions.clear();
  }
}

// Create a singleton instance
const sessionManager = new SessionManager();

export { sessionManager, SessionManager, type SessionConfig };