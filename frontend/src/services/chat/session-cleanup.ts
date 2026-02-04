// Session cleanup service for chat operations
// Handles cleanup of expired or inactive chat sessions

interface SessionInfo {
  id: string;
  userId: number;
  createdAt: Date;
  lastActive: Date;
  isActive: boolean;
  messageCount: number;
  sizeEstimate: number; // Estimated size in bytes
}

interface CleanupStats {
  totalSessions: number;
  expiredSessions: number;
  cleanedSessions: number;
  cleanupTime: Date;
  freedMemory: number; // Estimated memory freed in bytes
}

class SessionCleanupService {
  private cleanupInterval: number = 30 * 60 * 1000; // 30 minutes
  private maxSessionAge: number = 24 * 60 * 60 * 1000; // 24 hours
  private inactivityTimeout: number = 4 * 60 * 60 * 1000; // 4 hours
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isCleaning: boolean = false;

  constructor(options?: {
    cleanupInterval?: number;
    maxSessionAge?: number;
    inactivityTimeout?: number;
  }) {
    if (options) {
      this.cleanupInterval = options.cleanupInterval ?? this.cleanupInterval;
      this.maxSessionAge = options.maxSessionAge ?? this.maxSessionAge;
      this.inactivityTimeout = options.inactivityTimeout ?? this.inactivityTimeout;
    }

    this.startCleanupProcess();
  }

  /**
   * Start the periodic cleanup process
   */
  startCleanupProcess(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.cleanupInterval);

    console.log(`[SESSION_CLEANUP] Started cleanup process. Interval: ${this.cleanupInterval}ms`);
  }

  /**
   * Stop the cleanup process
   */
  stopCleanupProcess(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('[SESSION_CLEANUP] Stopped cleanup process');
    }
  }

  /**
   * Perform a cleanup operation
   * @returns Cleanup statistics
   */
  async performCleanup(): Promise<CleanupStats> {
    if (this.isCleaning) {
      console.log('[SESSION_CLEANUP] Cleanup already in progress, skipping...');
      return {
        totalSessions: 0,
        expiredSessions: 0,
        cleanedSessions: 0,
        cleanupTime: new Date(),
        freedMemory: 0
      };
    }

    this.isCleaning = true;
    console.log('[SESSION_CLEANUP] Starting cleanup operation...');

    try {
      const startTime = Date.now();
      const stats: CleanupStats = {
        totalSessions: 0,
        expiredSessions: 0,
        cleanedSessions: 0,
        cleanupTime: new Date(),
        freedMemory: 0
      };

      // Get all sessions
      const allSessions = await this.getAllSessions();
      stats.totalSessions = allSessions.length;

      // Identify expired sessions
      const now = new Date();
      const expiredSessions = allSessions.filter(session => {
        // Check if session is too old
        const age = now.getTime() - session.createdAt.getTime();
        if (age > this.maxSessionAge) {
          return true;
        }

        // Check if session has been inactive too long
        const inactiveTime = now.getTime() - session.lastActive.getTime();
        if (inactiveTime > this.inactivityTimeout) {
          return true;
        }

        return false;
      });

      stats.expiredSessions = expiredSessions.length;

      // Clean up expired sessions
      for (const session of expiredSessions) {
        try {
          const freedMemory = await this.cleanupSession(session.id);
          stats.cleanedSessions++;
          stats.freedMemory += freedMemory;
        } catch (error) {
          console.error(`[SESSION_CLEANUP] Failed to clean up session ${session.id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[SESSION_CLEANUP] Cleanup completed in ${duration}ms. Cleaned ${stats.cleanedSessions} sessions, freed ~${stats.freedMemory} bytes.`);

      return stats;
    } finally {
      this.isCleaning = false;
    }
  }

  /**
   * Get all active sessions
   * @returns Array of session information
   */
  private async getAllSessions(): Promise<SessionInfo[]> {
    // In a real implementation, this would query a database or in-memory store
    // For this example, we'll simulate by looking at localStorage for session-like data

    const sessions: SessionInfo[] = [];
    const now = new Date();

    // Look for items that might be session-related in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chat-session-')) {
        try {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            // Estimate size
            const size = new Blob([sessionData]).size;

            // For this example, we'll create a mock session
            // In a real implementation, you'd parse the actual session data
            sessions.push({
              id: key.replace('chat-session-', ''),
              userId: 1, // Mock value
              createdAt: new Date(now.getTime() - Math.random() * this.maxSessionAge), // Random time in the past
              lastActive: new Date(now.getTime() - Math.random() * this.inactivityTimeout), // Random last active time
              isActive: Math.random() > 0.5, // Random active status
              messageCount: Math.floor(Math.random() * 100), // Random message count
              sizeEstimate: size
            });
          }
        } catch (error) {
          console.error(`Error parsing session data for key ${key}:`, error);
        }
      }
    }

    // Also look for other potential session-related storage
    const potentialSessionKeys = [
      'chat_messages',
      'chat_history',
      'chat_conversations',
      'ai_chat_state'
    ];

    for (const key of potentialSessionKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        const size = new Blob([data]).size;
        sessions.push({
          id: key,
          userId: 1, // Mock value
          createdAt: new Date(now.getTime() - Math.random() * this.maxSessionAge),
          lastActive: new Date(now.getTime() - Math.random() * this.inactivityTimeout),
          isActive: true,
          messageCount: Math.floor(Math.random() * 50),
          sizeEstimate: size
        });
      }
    }

    return sessions;
  }

  /**
   * Clean up a specific session
   * @param sessionId - The ID of the session to clean up
   * @returns Estimated memory freed in bytes
   */
  private async cleanupSession(sessionId: string): Promise<number> {
    console.log(`[SESSION_CLEANUP] Cleaning up session: ${sessionId}`);

    let freedMemory = 0;

    // Remove session-related data from localStorage
    if (localStorage.getItem(`chat-session-${sessionId}`)) {
      const sessionData = localStorage.getItem(`chat-session-${sessionId}`);
      if (sessionData) {
        freedMemory += new Blob([sessionData]).size;
      }
      localStorage.removeItem(`chat-session-${sessionId}`);
    }

    // Clean up any related data
    const relatedKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(sessionId)) {
        relatedKeys.push(key);
      }
    }

    for (const key of relatedKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        freedMemory += new Blob([data]).size;
      }
      localStorage.removeItem(key);
      console.log(`[SESSION_CLEANUP] Removed related data: ${key}`);
    }

    // In a real implementation, you might also:
    // - Close WebSocket connections
    // - Cancel pending requests
    // - Notify the backend to clean up server-side session data
    // - Remove from in-memory caches

    console.log(`[SESSION_CLEANUP] Session ${sessionId} cleaned up, freed ~${freedMemory} bytes`);

    return freedMemory;
  }

  /**
   * Force cleanup of a specific session
   * @param sessionId - The ID of the session to force cleanup
   */
  async forceSessionCleanup(sessionId: string): Promise<void> {
    console.log(`[SESSION_CLEANUP] Force cleaning session: ${sessionId}`);

    try {
      await this.cleanupSession(sessionId);
    } catch (error) {
      console.error(`[SESSION_CLEANUP] Error forcing cleanup for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   * @returns Current cleanup statistics
   */
  async getCleanupStats(): Promise<CleanupStats> {
    const allSessions = await this.getAllSessions();
    const now = new Date();

    const expiredSessions = allSessions.filter(session => {
      const age = now.getTime() - session.createdAt.getTime();
      const inactiveTime = now.getTime() - session.lastActive.getTime();

      return age > this.maxSessionAge || inactiveTime > this.inactivityTimeout;
    });

    return {
      totalSessions: allSessions.length,
      expiredSessions: expiredSessions.length,
      cleanedSessions: 0, // This would be tracked in a real implementation
      cleanupTime: new Date(),
      freedMemory: expiredSessions.reduce((sum, session) => sum + session.sizeEstimate, 0)
    };
  }

  /**
   * Get the next scheduled cleanup time
   * @returns Date of next scheduled cleanup
   */
  getNextCleanupTime(): Date {
    if (this.cleanupTimer) {
      return new Date(Date.now() + this.cleanupInterval);
    }
    return new Date(0); // Unix epoch if not scheduled
  }

  /**
   * Manually trigger a cleanup operation
   * @returns Cleanup statistics
   */
  async triggerCleanup(): Promise<CleanupStats> {
    console.log('[SESSION_CLEANUP] Manual cleanup triggered');
    return this.performCleanup();
  }

  /**
   * Update cleanup configuration
   * @param options - New configuration options
   */
  updateConfig(options: {
    cleanupInterval?: number;
    maxSessionAge?: number;
    inactivityTimeout?: number;
  }): void {
    if (options.cleanupInterval !== undefined) {
      this.cleanupInterval = options.cleanupInterval;
    }
    if (options.maxSessionAge !== undefined) {
      this.maxSessionAge = options.maxSessionAge;
    }
    if (options.inactivityTimeout !== undefined) {
      this.inactivityTimeout = options.inactivityTimeout;
    }

    // Restart the cleanup process with new configuration
    this.stopCleanupProcess();
    this.startCleanupProcess();

    console.log('[SESSION_CLEANUP] Configuration updated and process restarted');
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): {
    cleanupInterval: number;
    maxSessionAge: number;
    inactivityTimeout: number;
  } {
    return {
      cleanupInterval: this.cleanupInterval,
      maxSessionAge: this.maxSessionAge,
      inactivityTimeout: this.inactivityTimeout
    };
  }

  /**
   * Perform cleanup and return detailed report
   * @returns Detailed cleanup report
   */
  async performDetailedCleanup(): Promise<{
    stats: CleanupStats;
    cleanedSessions: string[];
    errors: { sessionId: string; error: any }[];
  }> {
    if (this.isCleaning) {
      throw new Error('Cleanup already in progress');
    }

    this.isCleaning = true;

    try {
      const cleanedSessions: string[] = [];
      const errors: { sessionId: string; error: any }[] = [];
      const allSessions = await this.getAllSessions();
      const now = new Date();

      // Identify sessions to clean
      const sessionsToClean = allSessions.filter(session => {
        const age = now.getTime() - session.createdAt.getTime();
        const inactiveTime = now.getTime() - session.lastActive.getTime();

        return age > this.maxSessionAge || inactiveTime > this.inactivityTimeout;
      });

      // Clean each session
      for (const session of sessionsToClean) {
        try {
          await this.cleanupSession(session.id);
          cleanedSessions.push(session.id);
        } catch (error) {
          errors.push({ sessionId: session.id, error });
          console.error(`[SESSION_CLEANUP] Error cleaning session ${session.id}:`, error);
        }
      }

      // Generate stats
      const stats: CleanupStats = {
        totalSessions: allSessions.length,
        expiredSessions: sessionsToClean.length,
        cleanedSessions: cleanedSessions.length,
        cleanupTime: new Date(),
        freedMemory: sessionsToClean.reduce((sum, session) => sum + session.sizeEstimate, 0)
      };

      return { stats, cleanedSessions, errors };
    } finally {
      this.isCleaning = false;
    }
  }

  /**
   * Cleanup method to dispose of resources
   */
  dispose(): void {
    this.stopCleanupProcess();
    console.log('[SESSION_CLEANUP] Service disposed');
  }

  /**
   * Check if a session is expired
   * @param session - The session to check
   * @returns True if expired, false otherwise
   */
  isSessionExpired(session: SessionInfo): boolean {
    const now = new Date();
    const age = now.getTime() - session.createdAt.getTime();
    const inactiveTime = now.getTime() - session.lastActive.getTime();

    return age > this.maxSessionAge || inactiveTime > this.inactivityTimeout;
  }

  /**
   * Get the age of a session in milliseconds
   * @param session - The session to check
   * @returns Age in milliseconds
   */
  getSessionAge(session: SessionInfo): number {
    return Date.now() - session.createdAt.getTime();
  }

  /**
   * Get the inactivity time of a session in milliseconds
   * @param session - The session to check
   * @returns Inactivity time in milliseconds
   */
  getSessionInactivityTime(session: SessionInfo): number {
    return Date.now() - session.lastActive.getTime();
  }
}

// Create a singleton instance
const sessionCleanupService = new SessionCleanupService();

export { sessionCleanupService, SessionCleanupService, type SessionInfo, type CleanupStats };