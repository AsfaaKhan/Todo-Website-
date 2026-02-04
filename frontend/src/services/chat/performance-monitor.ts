// Performance monitoring service for chat operations
// Tracks performance metrics and identifies bottlenecks

interface PerformanceMetric {
  id: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  error?: any;
  metadata?: Record<string, any>;
  userId?: number;
  sessionId?: string;
}

interface PerformanceSummary {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  errorCount: number;
  errorRate: number;
  lastOccurrence: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetricsStored: number = 1000; // Limit to prevent memory issues
  private monitoringEnabled: boolean = true;
  private thresholds: {
    slowOperation: number; // Duration in ms that's considered slow
    errorRate: number; // Percentage threshold for error rate alerts
  } = {
    slowOperation: 2000, // 2 seconds
    errorRate: 0.05 // 5%
  };

  /**
   * Start monitoring a specific operation
   * @param operation - Name of the operation being monitored
   * @param metadata - Additional metadata to associate with the operation
   * @param userId - Optional user ID
   * @param sessionId - Optional session ID
   * @returns Unique metric ID for tracking this operation
   */
  startOperation(
    operation: string,
    metadata?: Record<string, any>,
    userId?: number,
    sessionId?: string
  ): string {
    if (!this.monitoringEnabled) {
      return '';
    }

    const metricId = this.generateId();
    const startTime = performance.now();

    const metric: PerformanceMetric = {
      id: metricId,
      operation,
      startTime,
      status: 'pending',
      metadata,
      userId,
      sessionId
    };

    this.metrics.push(metric);

    // Maintain maximum metrics limit
    if (this.metrics.length > this.maxMetricsStored) {
      this.metrics = this.metrics.slice(-this.maxMetricsStored);
    }

    return metricId;
  }

  /**
   * Mark an operation as completed successfully
   * @param metricId - The ID of the metric to update
   * @param additionalMetadata - Additional metadata to add
   */
  completeOperation(metricId: string, additionalMetadata?: Record<string, any>): void {
    const metric = this.metrics.find(m => m.id === metricId);
    if (!metric) {
      console.warn(`[PERFORMANCE] Metric ${metricId} not found for completion`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = 'success';

    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // Log slow operations
    if (duration > this.thresholds.slowOperation) {
      console.warn(`[PERFORMANCE] Slow operation detected: ${metric.operation} took ${duration.toFixed(2)}ms`, {
        metricId,
        duration,
        metadata: metric.metadata
      });
    }

    this.checkThresholds(metric);
  }

  /**
   * Mark an operation as failed
   * @param metricId - The ID of the metric to update
   * @param error - The error that occurred
   * @param additionalMetadata - Additional metadata to add
   */
  failOperation(metricId: string, error: any, additionalMetadata?: Record<string, any>): void {
    const metric = this.metrics.find(m => m.id === metricId);
    if (!metric) {
      console.warn(`[PERFORMANCE] Metric ${metricId} not found for failure marking`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = 'error';
    metric.error = error;

    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    this.checkThresholds(metric);
  }

  /**
   * Measure an operation automatically using a promise
   * @param operation - Name of the operation
   * @param operationFn - Function that returns a promise to measure
   * @param metadata - Additional metadata
   * @param userId - Optional user ID
   * @param sessionId - Optional session ID
   * @returns Promise that resolves to the result of operationFn
   */
  async measureOperation<T>(
    operation: string,
    operationFn: () => Promise<T>,
    metadata?: Record<string, any>,
    userId?: number,
    sessionId?: string
  ): Promise<T> {
    if (!this.monitoringEnabled) {
      return operationFn();
    }

    const metricId = this.startOperation(operation, metadata, userId, sessionId);

    try {
      const result = await operationFn();
      this.completeOperation(metricId);
      return result;
    } catch (error) {
      this.failOperation(metricId, error);
      throw error;
    }
  }

  /**
   * Get performance summary for a specific operation
   * @param operation - Name of the operation
   * @returns Performance summary
   */
  getOperationSummary(operation: string): PerformanceSummary | null {
    const operationMetrics = this.metrics.filter(m => m.operation === operation && m.duration !== undefined);

    if (operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map(m => m.duration!).filter(d => d !== undefined) as number[];
    const errors = operationMetrics.filter(m => m.status === 'error');

    const avgDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const errorCount = errors.length;
    const errorRate = errorCount / operationMetrics.length;

    // Find the most recent occurrence
    const lastMetric = operationMetrics.reduce((latest, current) =>
      (current.endTime && (!latest.endTime || current.endTime > latest.endTime)) ? current : latest
    );

    return {
      operation,
      count: operationMetrics.length,
      avgDuration,
      minDuration,
      maxDuration,
      errorCount,
      errorRate,
      lastOccurrence: lastMetric.endTime ? new Date(lastMetric.endTime) : new Date()
    };
  }

  /**
   * Get performance summary for all operations
   * @returns Array of performance summaries
   */
  getAllSummaries(): PerformanceSummary[] {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    return operations
      .map(op => this.getOperationSummary(op))
      .filter(summary => summary !== null) as PerformanceSummary[];
  }

  /**
   * Get recent performance metrics
   * @param limit - Number of recent metrics to return
   * @returns Array of recent performance metrics
   */
  getRecentMetrics(limit: number = 50): PerformanceMetric[] {
    return [...this.metrics]
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
      .slice(0, limit);
  }

  /**
   * Get slowest operations
   * @param limit - Number of slowest operations to return
   * @returns Array of slowest operations
   */
  getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return [...this.metrics]
      .filter(m => m.duration !== undefined && m.status === 'success')
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, limit);
  }

  /**
   * Get operations with highest error rates
   * @param limit - Number of operations to return
   * @returns Array of operations with highest error rates
   */
  getHighestErrorRateOperations(limit: number = 10): PerformanceSummary[] {
    const summaries = this.getAllSummaries();
    return summaries
      .filter(summary => summary.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  /**
   * Check if a metric exceeds any thresholds
   * @param metric - The metric to check
   */
  private checkThresholds(metric: PerformanceMetric): void {
    // Check for slow operations
    if (metric.duration && metric.duration > this.thresholds.slowOperation) {
      this.onThresholdExceeded({
        type: 'slow_operation',
        operation: metric.operation,
        duration: metric.duration,
        threshold: this.thresholds.slowOperation,
        metric
      });
    }

    // Check for errors
    if (metric.status === 'error') {
      this.onThresholdExceeded({
        type: 'operation_error',
        operation: metric.operation,
        error: metric.error,
        metric
      });
    }
  }

  /**
   * Handler for when thresholds are exceeded
   * @param alert - The threshold alert
   */
  private onThresholdExceeded(alert: {
    type: 'slow_operation' | 'operation_error';
    operation: string;
    duration?: number;
    threshold?: number;
    error?: any;
    metric: PerformanceMetric;
  }): void {
    console.warn(`[PERFORMANCE ALERT] ${alert.type.toUpperCase()}: ${alert.operation}`, {
      duration: alert.duration,
      threshold: alert.threshold,
      error: alert.error,
      metricId: alert.metric.id,
      userId: alert.metric.userId,
      sessionId: alert.metric.sessionId,
      metadata: alert.metric.metadata
    });

    // In a real implementation, you might want to:
    // - Send the alert to a monitoring service
    // - Trigger an automated response
    // - Log to a central logging system
  }

  /**
   * Generate a unique ID for metrics
   * @returns Unique ID string
   */
  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable or disable performance monitoring
   * @param enabled - Whether to enable monitoring
   */
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    console.log(`[PERFORMANCE] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update performance thresholds
   * @param thresholds - New threshold values
   */
  updateThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    console.log('[PERFORMANCE] Thresholds updated:', this.thresholds);
  }

  /**
   * Clear all stored metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('[PERFORMANCE] All metrics cleared');
  }

  /**
   * Get the current monitoring status
   * @returns Monitoring status information
   */
  getStatus(this: PerformanceMonitor): {
    enabled: boolean;
    totalMetrics: number;
    thresholds: typeof PerformanceMonitor.prototype.thresholds;
    storageLimit: number;
  } {
    return {
      enabled: this.monitoringEnabled,
      totalMetrics: this.metrics.length,
      thresholds: { ...this.thresholds },
      storageLimit: this.maxMetricsStored
    };
  }

  /**
   * Get performance insights
   * @returns Performance insights and recommendations
   */
  getInsights(): {
    slowestOperations: string[];
    highestErrorOperations: string[];
    recommendations: string[];
    summary: {
      totalOperations: number;
      successfulOperations: number;
      failedOperations: number;
      averageDuration: number;
      errorRate: number;
    };
  } {
    const summaries = this.getAllSummaries();

    // Get slowest operations
    const slowestOps = summaries
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 3)
      .map(s => `${s.operation} (${s.avgDuration.toFixed(2)}ms avg)`);

    // Get highest error operations
    const highestErrorOps = summaries
      .filter(s => s.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 3)
      .map(s => `${s.operation} (${(s.errorRate * 100).toFixed(2)}% error rate)`);

    // Calculate summary
    const totalOps = summaries.reduce((sum, s) => sum + s.count, 0);
    const successfulOps = summaries.reduce((sum, s) => sum + (s.count - s.errorCount), 0);
    const failedOps = summaries.reduce((sum, s) => sum + s.errorCount, 0);
    const avgDuration = totalOps > 0
      ? summaries.reduce((sum, s) => sum + (s.avgDuration * s.count), 0) / totalOps
      : 0;
    const errorRate = totalOps > 0 ? failedOps / totalOps : 0;

    // Generate recommendations
    const recommendations: string[] = [];

    if (avgDuration > this.thresholds.slowOperation) {
      recommendations.push(`Average operation duration (${avgDuration.toFixed(2)}ms) exceeds threshold (${this.thresholds.slowOperation}ms). Consider optimizing.`);
    }

    if (errorRate > this.thresholds.errorRate) {
      recommendations.push(`Overall error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(this.thresholds.errorRate * 100).toFixed(2)}%). Investigate.`);
    }

    if (slowestOps.length > 0) {
      recommendations.push(`Operations taking too long: ${slowestOps.join(', ')}`);
    }

    if (highestErrorOps.length > 0) {
      recommendations.push(`Problematic operations: ${highestErrorOps.join(', ')}`);
    }

    return {
      slowestOperations: slowestOps,
      highestErrorOperations: highestErrorOps,
      recommendations,
      summary: {
        totalOperations: totalOps,
        successfulOperations: successfulOps,
        failedOperations: failedOps,
        averageDuration: avgDuration,
        errorRate
      }
    };
  }

  /**
   * Export metrics for analysis
   * @returns JSON string of all metrics
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Import metrics from JSON
   * @param json - JSON string of metrics
   */
  importMetrics(json: string): void {
    try {
      const importedMetrics: PerformanceMetric[] = JSON.parse(json);

      // Validate imported metrics
      const validMetrics = importedMetrics.filter(metric =>
        metric.id &&
        metric.operation &&
        metric.startTime !== undefined &&
        metric.status
      );

      this.metrics = [...this.metrics, ...validMetrics];

      // Maintain maximum metrics limit
      if (this.metrics.length > this.maxMetricsStored) {
        this.metrics = this.metrics.slice(-this.maxMetricsStored);
      }

      console.log(`[PERFORMANCE] Imported ${validMetrics.length} metrics`);
    } catch (error) {
      console.error('[PERFORMANCE] Failed to import metrics:', error);
    }
  }

  /**
   * Get metrics by user ID
   * @param userId - The user ID
   * @returns Array of metrics for the user
   */
  getMetricsByUser(userId: number): PerformanceMetric[] {
    return this.metrics.filter(m => m.userId === userId);
  }

  /**
   * Get metrics by session ID
   * @param sessionId - The session ID
   * @returns Array of metrics for the session
   */
  getMetricsBySession(sessionId: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.sessionId === sessionId);
  }

  /**
   * Get metrics within a time range
   * @param startTime - Start time
   * @param endTime - End time
   * @returns Array of metrics within the time range
   */
  getMetricsByTimeRange(startTime: Date, endTime: Date): PerformanceMetric[] {
    return this.metrics.filter(m => {
      if (m.endTime) {
        return m.endTime >= startTime.getTime() && m.endTime <= endTime.getTime();
      } else if (m.startTime) {
        return m.startTime >= startTime.getTime() && m.startTime <= endTime.getTime();
      }
      return false;
    });
  }

  /**
   * Cleanup method to dispose of resources
   */
  dispose(): void {
    this.metrics = [];
    console.log('[PERFORMANCE] Service disposed');
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor, PerformanceMonitor, type PerformanceMetric, type PerformanceSummary };