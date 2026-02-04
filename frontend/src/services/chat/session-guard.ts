// Session hijacking protection for chat operations
// Implements various security measures to prevent session hijacking

interface SessionGuardConfig {
  enableFingerprinting: boolean;
  enableIpValidation: boolean;
  enableActivityMonitoring: boolean;
  maxConcurrentSessions: number;
  tokenRefreshInterval: number; // in minutes
}

interface ActiveSession {
  sessionId: string;
  userId: number;
  fingerprint: string;
  ipHash?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity: Date;
  concurrentCount: number;
}

class SessionGuard {
  private activeSessions: Map<string, ActiveSession> = new Map();
  private suspiciousActivities: Map<string, number[]> = new Map(); // sessionId -> timestamps of suspicious activities

  private config: SessionGuardConfig = {
    enableFingerprinting: true,
    enableIpValidation: true,
    enableActivityMonitoring: true,
    maxConcurrentSessions: 3,
    tokenRefreshInterval: 30 // 30 minutes
  };

  constructor(config?: Partial<SessionGuardConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Initialize a new session with security measures
   * @param sessionId - The session ID
   * @param userId - The user ID
   * @param requestContext - Information about the request context
   * @returns True if initialization is successful and secure
   */
  initializeSession(sessionId: string, userId: number, requestContext: any): boolean {
    try {
      // Create a fingerprint for the session
      const fingerprint = this.generateFingerprint(requestContext);

      // Hash the IP if IP validation is enabled
      let ipHash: string | undefined;
      if (this.config.enableIpValidation && requestContext.ip) {
        ipHash = this.hashString(requestContext.ip);
      }

      // Check if user already has too many concurrent sessions
      if (this.config.maxConcurrentSessions > 0) {
        const userSessions = this.getUserSessions(userId);
        if (userSessions.length >= this.config.maxConcurrentSessions) {
          console.warn(`User ${userId} has reached maximum concurrent sessions (${this.config.maxConcurrentSessions})`);
          return false;
        }
      }

      // Create the session record
      const session: ActiveSession = {
        sessionId,
        userId,
        fingerprint,
        ipHash,
        userAgent: requestContext.userAgent,
        createdAt: new Date(),
        lastActivity: new Date(),
        concurrentCount: this.getUserSessions(userId).length + 1
      };

      this.activeSessions.set(sessionId, session);

      // Log the initialization for monitoring
      if (this.config.enableActivityMonitoring) {
        this.logActivity(sessionId, 'session_init', requestContext);
      }

      return true;
    } catch (error) {
      console.error('Error initializing session:', error);
      return false;
    }
  }

  /**
   * Validate a session for security
   * @param sessionId - The session ID to validate
   * @param requestContext - Information about the current request
   * @returns Security validation result
   */
  validateSession(sessionId: string, requestContext: any): {
    isValid: boolean;
    isSecure: boolean;
    reason?: string;
  } {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return {
        isValid: false,
        isSecure: false,
        reason: 'Session not found'
      };
    }

    // Check if session is still active
    if (this.isSessionExpired(session)) {
      this.terminateSession(sessionId);
      return {
        isValid: false,
        isSecure: false,
        reason: 'Session expired'
      };
    }

    // Update last activity time
    session.lastActivity = new Date();
    this.activeSessions.set(sessionId, session);

    // Validate fingerprint if enabled
    if (this.config.enableFingerprinting) {
      const currentFingerprint = this.generateFingerprint(requestContext);
      if (session.fingerprint !== currentFingerprint) {
        console.warn(`Fingerprint mismatch for session ${sessionId}`);

        // Log suspicious activity
        if (this.config.enableActivityMonitoring) {
          this.recordSuspiciousActivity(sessionId, 'fingerprint_mismatch');
        }

        return {
          isValid: true, // Session still exists
          isSecure: false, // But security is compromised
          reason: 'Fingerprint mismatch - possible session hijacking'
        };
      }
    }

    // Validate IP if enabled
    if (this.config.enableIpValidation && session.ipHash && requestContext.ip) {
      const currentIpHash = this.hashString(requestContext.ip);
      if (session.ipHash !== currentIpHash) {
        console.warn(`IP address changed for session ${sessionId}`);

        // Log suspicious activity
        if (this.config.enableActivityMonitoring) {
          this.recordSuspiciousActivity(sessionId, 'ip_change');
        }

        return {
          isValid: true, // Session still exists
          isSecure: false, // But security is compromised
          reason: 'IP address changed - possible session hijacking'
        };
      }
    }

    // Check for suspicious activity patterns
    if (this.config.enableActivityMonitoring) {
      const suspiciousCount = this.getSuspiciousActivityCount(sessionId);
      if (suspiciousCount > 3) { // Threshold for suspicious activity
        console.warn(`High suspicious activity count for session ${sessionId}`);
        return {
          isValid: false,
          isSecure: false,
          reason: 'Too many suspicious activities detected'
        };
      }
    }

    return {
      isValid: true,
      isSecure: true
    };
  }

  /**
   * Terminate a session
   * @param sessionId - The session ID to terminate
   */
  terminateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.suspiciousActivities.delete(sessionId);
  }

  /**
   * Check if a session has expired
   * @param session - The session to check
   * @returns True if expired, false otherwise
   */
  private isSessionExpired(session: ActiveSession): boolean {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return now.getTime() - session.createdAt.getTime() > maxAge;
  }

  /**
   * Generate a unique fingerprint for a request context
   * @param context - Request context information
   * @returns Fingerprint string
   */
  private generateFingerprint(context: any): string {
    const components: string[] = [];

    // Include user agent if available
    if (context.userAgent) {
      components.push(context.userAgent);
    }

    // Include screen resolution if available (client-side only)
    if (context.screenResolution) {
      components.push(context.screenResolution);
    }

    // Include timezone offset
    if (context.timezoneOffset !== undefined) {
      components.push(context.timezoneOffset.toString());
    }

    // Include language preferences
    if (context.language) {
      components.push(context.language);
    }

    // Include platform information
    if (context.platform) {
      components.push(context.platform);
    }

    // Join all components and hash them
    const combined = components.join('|');
    return this.hashString(combined);
  }

  /**
   * Hash a string for comparison
   * @param str - String to hash
   * @returns Hashed string
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get all sessions for a user
   * @param userId - The user ID
   * @returns Array of session IDs
   */
  private getUserSessions(userId: number): string[] {
    const sessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        sessions.push(sessionId);
      }
    }

    return sessions;
  }

  /**
   * Record suspicious activity for a session
   * @param sessionId - The session ID
   * @param activityType - Type of suspicious activity
   */
  private recordSuspiciousActivity(sessionId: string, activityType: string): void {
    const now = Date.now();

    if (!this.suspiciousActivities.has(sessionId)) {
      this.suspiciousActivities.set(sessionId, []);
    }

    const activities = this.suspiciousActivities.get(sessionId)!;
    activities.push(now);

    // Keep only the last hour of suspicious activities
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentActivities = activities.filter(timestamp => timestamp > oneHourAgo);
    this.suspiciousActivities.set(sessionId, recentActivities);
  }

  /**
   * Get the count of suspicious activities for a session
   * @param sessionId - The session ID
   * @returns Count of suspicious activities in the last hour
   */
  private getSuspiciousActivityCount(sessionId: string): number {
    const activities = this.suspiciousActivities.get(sessionId);
    if (!activities) {
      return 0;
    }

    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return activities.filter(timestamp => timestamp > oneHourAgo).length;
  }

  /**
   * Log security-related activity
   * @param sessionId - The session ID
   * @param activityType - Type of activity
   * @param context - Additional context
   */
  private logActivity(sessionId: string, activityType: string, context: any): void {
    // In a real implementation, this would log to a security monitoring system
    console.log(`[SECURITY] Session ${sessionId} - ${activityType}`, {
      timestamp: new Date().toISOString(),
      userAgent: context.userAgent,
      ip: context.ip
    });
  }

  /**
   * Get session security information
   * @param sessionId - The session ID
   * @returns Security information about the session
   */
  getSessionSecurityInfo(sessionId: string): {
    isValid: boolean;
    fingerprintMatches: boolean;
    ipMatches: boolean;
    suspiciousActivityCount: number;
    lastActivity: Date;
  } | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      isValid: !this.isSessionExpired(session),
      fingerprintMatches: true, // Would be checked against current context in validateSession
      ipMatches: true, // Would be checked against current IP in validateSession
      suspiciousActivityCount: this.getSuspiciousActivityCount(sessionId),
      lastActivity: session.lastActivity
    };
  }

  /**
   * Refresh session security tokens if needed
   * @param sessionId - The session ID
   * @returns True if refresh was needed and successful
   */
  maybeRefreshTokens(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    const now = new Date();
    const timeSinceCreation = now.getTime() - session.createdAt.getTime();
    const refreshThreshold = this.config.tokenRefreshInterval * 60 * 1000; // Convert to milliseconds

    if (timeSinceCreation > refreshThreshold) {
      // In a real implementation, this would refresh security tokens
      session.createdAt = new Date(); // Reset for token refresh interval
      this.activeSessions.set(sessionId, session);
      return true;
    }

    return false;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions(): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (this.isSessionExpired(session)) {
        this.terminateSession(sessionId);
      }
    }
  }

  /**
   * Get security statistics
   * @returns Security statistics
   */
  getSecurityStats(): {
    totalSessions: number;
    suspiciousSessions: number;
    averageSuspiciousActivities: number;
  } {
    let totalSuspiciousActivities = 0;
    let suspiciousSessions = 0;

    for (const sessionId of this.activeSessions.keys()) {
      const count = this.getSuspiciousActivityCount(sessionId);
      if (count > 0) {
        suspiciousSessions++;
      }
      totalSuspiciousActivities += count;
    }

    const totalSessions = this.activeSessions.size;
    const averageSuspiciousActivities = totalSessions > 0 ? totalSuspiciousActivities / totalSessions : 0;

    return {
      totalSessions,
      suspiciousSessions,
      averageSuspiciousActivities
    };
  }
}

// Create a singleton instance
const sessionGuard = new SessionGuard();

export { sessionGuard, SessionGuard, type SessionGuardConfig };