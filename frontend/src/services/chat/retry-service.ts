// Retry service for handling failed API calls in chat operations
// Implements exponential backoff and configurable retry strategies

interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number; // multiplier for exponential backoff
  jitter: boolean; // whether to add random jitter to delays
  retryableStatusCodes: number[]; // HTTP status codes that should trigger a retry
  timeout: number; // request timeout in milliseconds
}

interface RetryAttempt {
  attemptNumber: number;
  delay: number;
  error: any;
  timestamp: Date;
}

class RetryService {
  private config: RetryConfig;
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitter: true,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    timeout: 10000 // 10 seconds
  };

  private retryHistory: Map<string, RetryAttempt[]> = new Map();

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Execute an operation with retry logic
   * @param operation - The operation to execute
   * @param operationId - Unique identifier for this operation
   * @returns Promise that resolves to the operation result
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId?: string
  ): Promise<T> {
    const opId = operationId || this.generateOperationId();
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(operation, this.config.timeout);

        // Clear retry history for successful operation
        if (operationId) {
          this.retryHistory.delete(operationId);
        }

        return result;
      } catch (error) {
        lastError = error;

        // Log the retry attempt
        this.logRetryAttempt(opId, attempt, error);

        // If this is the last attempt, throw the error
        if (attempt === this.config.maxRetries) {
          throw error;
        }

        // Check if the error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);

        // Wait for the calculated delay
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute an operation with a timeout
   * @param operation - The operation to execute
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise that resolves to the operation result
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  }

  /**
   * Calculate delay with exponential backoff
   * @param attemptNumber - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private calculateDelay(attemptNumber: number): number {
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attemptNumber);

    // Cap the delay at maxDelay
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter if enabled
    if (this.config.jitter) {
      // Add random jitter of up to 25% of the calculated delay
      const jitter = Math.random() * delay * 0.25;
      delay += jitter;
    }

    return delay;
  }

  /**
   * Delay for a specified number of milliseconds
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: any): boolean {
    // If it's a network error or timeout
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }

    // If it's an HTTP error with a retryable status code
    if (error.status && this.config.retryableStatusCodes.includes(error.status)) {
      return true;
    }

    // If it's a specific error type that indicates a transient issue
    if (error.message && (
      error.message.includes('Network Error') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
    )) {
      return true;
    }

    return false;
  }

  /**
   * Log a retry attempt
   * @param operationId - The operation ID
   * @param attemptNumber - The attempt number
   * @param error - The error that caused the retry
   */
  private logRetryAttempt(operationId: string, attemptNumber: number, error: any): void {
    const attempt: RetryAttempt = {
      attemptNumber: attemptNumber + 1,
      delay: this.calculateDelay(attemptNumber),
      error: error,
      timestamp: new Date()
    };

    if (!this.retryHistory.has(operationId)) {
      this.retryHistory.set(operationId, []);
    }

    const history = this.retryHistory.get(operationId)!;
    history.push(attempt);

    // Keep only the last 10 attempts to prevent memory leaks
    if (history.length > 10) {
      history.shift();
    }

    console.debug(`[RETRY] Operation ${operationId} - Attempt ${attemptNumber + 1}/${this.config.maxRetries + 1} failed:`, error.message);
  }

  /**
   * Get retry history for an operation
   * @param operationId - The operation ID
   * @returns Array of retry attempts
   */
  getRetryHistory(operationId: string): RetryAttempt[] {
    return this.retryHistory.get(operationId) || [];
  }

  /**
   * Get statistics about retry operations
   * @returns Retry statistics
   */
  getRetryStats(): {
    totalOperations: number;
    successfulRetries: number;
    failedOperations: number;
    avgRetriesPerOperation: number;
  } {
    let totalOperations = 0;
    let successfulRetries = 0;
    let failedOperations = 0;
    let totalRetries = 0;

    for (const [_, history] of this.retryHistory.entries()) {
      totalOperations++;

      if (history.some(attempt => attempt.attemptNumber > 1)) {
        successfulRetries++;
      }

      if (history.length === (this.config.maxRetries + 1)) {
        // If we have maxRetries+1 attempts, it means all retries failed
        failedOperations++;
      }

      totalRetries += history.length;
    }

    const avgRetriesPerOperation = totalOperations > 0 ? totalRetries / totalOperations : 0;

    return {
      totalOperations,
      successfulRetries,
      failedOperations,
      avgRetriesPerOperation
    };
  }

  /**
   * Generate a unique operation ID
   * @returns Unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute an HTTP request with retry logic
   * @param url - The URL to request
   * @param options - Fetch options
   * @param operationId - Optional operation ID
   * @returns Promise that resolves to the response
   */
  async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    operationId?: string
  ): Promise<Response> {
    const opId = operationId || this.generateOperationId();

    return this.executeWithRetry(async () => {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        // Create an error with status code to be used in retry logic
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return response;
    }, opId);
  }

  /**
   * Execute an async function with retry logic
   * @param fn - The function to execute
   * @param args - Arguments to pass to the function
   * @param operationId - Optional operation ID
   * @returns Promise that resolves to the function result
   */
  async executeFunctionWithRetry<T>(
    fn: (...args: any[]) => Promise<T>,
    args: any[] = [],
    operationId?: string
  ): Promise<T> {
    const opId = operationId || this.generateOperationId();

    return this.executeWithRetry(async () => {
      return await fn(...args);
    }, opId);
  }

  /**
   * Reset the retry history
   */
  clearHistory(): void {
    this.retryHistory.clear();
  }

  /**
   * Update the retry configuration
   * @param newConfig - New configuration
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if an operation is currently being retried
   * @param operationId - The operation ID
   * @returns True if the operation is being retried, false otherwise
   */
  isOperationActive(operationId: string): boolean {
    return this.retryHistory.has(operationId);
  }
}

// Create a singleton instance
const retryService = new RetryService();

export { retryService, RetryService, type RetryConfig, type RetryAttempt };