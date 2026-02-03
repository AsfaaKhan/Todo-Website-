// Logging service for chat operations

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: any;
  sessionId?: string;
  userId?: number;
}

class ChatLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Keep only the last 1000 log entries
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
  private isBrowser: boolean;

  constructor() {
    // Check if we're in a browser environment
    this.isBrowser = typeof window !== 'undefined';
  }

  /**
   * Log a debug message
   */
  debug(message: string, context: any = {}, sessionId?: string, userId?: number): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, context, sessionId, userId);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context: any = {}, sessionId?: string, userId?: number): void {
    if (this.shouldLog('info')) {
      this.log('info', message, context, sessionId, userId);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context: any = {}, sessionId?: string, userId?: number): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, context, sessionId, userId);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, context: any = {}, sessionId?: string, userId?: number): void {
    if (this.shouldLog('error')) {
      this.log('error', message, context, sessionId, userId);
    }
  }

  /**
   * Internal log method
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context: any = {},
    sessionId?: string,
    userId?: number
  ): void {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      context,
      sessionId,
      userId
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.outputToConsole(logEntry);
    }

    // Store in localStorage for debugging (browser only)
    if (this.isBrowser) {
      this.storeInLocalStorage(logEntry);
    }
  }

  /**
   * Output log to console
   */
  private outputToConsole(entry: LogEntry): void {
    const formattedMessage = `[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}] ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(formattedMessage, entry.context);
        break;
      case 'info':
        console.info(formattedMessage, entry.context);
        break;
      case 'warn':
        console.warn(formattedMessage, entry.context);
        break;
      case 'error':
        console.error(formattedMessage, entry.context);
        break;
    }
  }

  /**
   * Store log in localStorage (browser only)
   */
  private storeInLocalStorage(entry: LogEntry): void {
    if (!this.isBrowser) return;

    try {
      const key = 'chat_logs';
      const existingLogs = localStorage.getItem(key) ?
        JSON.parse(localStorage.getItem(key)!) : [];

      // Add the new log entry
      existingLogs.push({
        ...entry,
        timestamp: entry.timestamp.toISOString() // Convert to string for JSON
      });

      // Keep only the last maxLogs entries
      const recentLogs = existingLogs.slice(-this.maxLogs);

      localStorage.setItem(key, JSON.stringify(recentLogs));
    } catch (error) {
      // If localStorage fails, just log to console
      console.warn('Could not save log to localStorage:', error);
    }
  }

  /**
   * Check if a log level should be logged based on current log level
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Generate a unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get logs for a specific session
   */
  getLogsForSession(sessionId: string, limit?: number): LogEntry[] {
    const sessionLogs = this.logs
      .filter(log => log.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Most recent first

    return limit ? sessionLogs.slice(0, limit) : sessionLogs;
  }

  /**
   * Get logs for a specific user
   */
  getLogsForUser(userId: number, limit?: number): LogEntry[] {
    const userLogs = this.logs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Most recent first

    return limit ? userLogs.slice(0, limit) : userLogs;
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit?: number): LogEntry[] {
    const sortedLogs = [...this.logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sortedLogs.slice(0, limit) : sortedLogs;
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: 'debug' | 'info' | 'warn' | 'error', limit?: number): LogEntry[] {
    const levelLogs = this.logs
      .filter(log => log.level === level)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Most recent first

    return limit ? levelLogs.slice(0, limit) : levelLogs;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];

    // Clear from localStorage as well
    if (this.isBrowser) {
      try {
        localStorage.removeItem('chat_logs');
      } catch (error) {
        console.warn('Could not clear logs from localStorage:', error);
      }
    }
  }

  /**
   * Set the log level
   */
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Import logs from JSON
   */
  importLogs(json: string): void {
    try {
      const importedLogs = JSON.parse(json);
      if (Array.isArray(importedLogs)) {
        this.logs = importedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp) // Convert back to Date
        }));
      }
    } catch (error) {
      console.error('Could not import logs:', error);
    }
  }
}

// Create a singleton instance
const chatLogger = new ChatLogger();

export { chatLogger, ChatLogger };