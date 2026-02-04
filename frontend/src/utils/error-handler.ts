// Error handling utilities for the chatbot application

export interface ChatError {
  id: string;
  message: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  context?: any;
}

class ErrorHandler {
  private errors: ChatError[] = [];
  private maxErrors: number = 100; // Keep only the last 100 errors

  /**
   * Log an error with context
   * @param message - Error message
   * @param source - Source of the error (component, service, etc.)
   * @param context - Additional context for debugging
   * @param level - Error level (default: 'error')
   */
  logError(
    message: string,
    source: string,
    context?: any,
    level: 'info' | 'warning' | 'error' | 'critical' = 'error'
  ): void {
    const error: ChatError = {
      id: this.generateErrorId(),
      message,
      timestamp: new Date(),
      level,
      source,
      context
    };

    this.errors.push(error);

    // Keep only the last maxErrors errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const consoleMethod = level === 'warning' ? 'warn' : (level === 'critical' ? 'error' : level);
      console[consoleMethod](error);
    }
  }

  /**
   * Handle an error and return a user-friendly message
   * @param error - The error object
   * @param source - Source of the error
   * @param userFriendlyMessage - Optional user-friendly message
   * @returns User-friendly error message
   */
  handleError(
    error: any,
    source: string,
    userFriendlyMessage?: string
  ): string {
    let errorMessage = userFriendlyMessage || 'An error occurred';

    // Extract error message from various possible sources
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      if (error.message) {
        errorMessage = error.message;
      } else if (error.msg) {
        errorMessage = error.msg;
      } else if (error.detail) {
        errorMessage = error.detail;
      } else {
        errorMessage = JSON.stringify(error);
      }
    }

    // Log the full error details
    this.logError(errorMessage, source, error);

    // Return user-friendly message based on the error type
    if (errorMessage.toLowerCase().includes('network')) {
      return 'Network connection issue. Please check your internet connection.';
    } else if (errorMessage.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.';
    } else if (errorMessage.toLowerCase().includes('auth') ||
               errorMessage.toLowerCase().includes('unauthorized') ||
               errorMessage.toLowerCase().includes('401')) {
      return 'Authentication error. Please log in again.';
    } else if (errorMessage.toLowerCase().includes('forbidden') ||
               errorMessage.toLowerCase().includes('403')) {
      return 'You do not have permission to perform this action.';
    } else if (errorMessage.toLowerCase().includes('not found') ||
               errorMessage.toLowerCase().includes('404')) {
      return 'Requested resource not found.';
    } else {
      return userFriendlyMessage || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Generate a unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent errors
   * @param limit - Number of recent errors to return
   */
  getRecentErrors(limit?: number): ChatError[] {
    const errors = [...this.errors].reverse(); // Most recent first
    return limit ? errors.slice(0, limit) : errors;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Format error for display
   * @param error - The error to format
   */
  formatErrorForDisplay(error: ChatError): string {
    return `[${error.level.toUpperCase()}] ${error.source}: ${error.message}`;
  }

  /**
   * Check if an error is related to network issues
   * @param error - The error to check
   */
  isNetworkError(error: any): boolean {
    if (error instanceof Error) {
      return error.message.toLowerCase().includes('network') ||
             error.message.toLowerCase().includes('fetch') ||
             error.message.toLowerCase().includes('failed to fetch') ||
             error.message.includes('TypeError') ||
             (error.message.includes('50') && error.message.includes('HTTP')); // Server errors
    }
    return false;
  }

  /**
   * Check if an error is related to authentication
   * @param error - The error to check
   */
  isAuthError(error: any): boolean {
    if (typeof error === 'string') {
      return error.toLowerCase().includes('auth') ||
             error.toLowerCase().includes('unauthorized') ||
             error.toLowerCase().includes('401');
    } else if (error && typeof error === 'object') {
      return (error.message &&
              (error.message.toLowerCase().includes('auth') ||
               error.message.toLowerCase().includes('unauthorized'))) ||
             (error.status === 401) ||
             (error.code === 'UNAUTHORIZED');
    }
    return false;
  }

  /**
   * Retry an async operation with exponential backoff
   * @param operation - The operation to retry
   * @param maxRetries - Maximum number of retries
   * @param baseDelay - Base delay in milliseconds
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (i < maxRetries - 1) {
          // Exponential backoff: delay *= 2^attempt
          const delay = baseDelay * Math.pow(2, i);
          await this.delay(delay);

          this.logError(
            `Retry attempt ${i + 1} failed: ${(error as any)?.message || String(error)}`,
            'ErrorHandler.retryOperation',
            { attempt: i + 1, maxRetries }
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Simple delay function for async operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create a singleton instance
const errorHandler = new ErrorHandler();

export { errorHandler, ErrorHandler };