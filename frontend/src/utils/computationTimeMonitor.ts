// Type declaration for Node.js Timer
type NodeJSTimer = ReturnType<typeof setTimeout>;

export interface ComputationMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface ComputationMetrics {
  operationId: string;
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  inputSize: number;
  outputSize: number;
  complexity: number; // O(1), O(n), O(n^2), etc.
  efficiency: number; // operations per second
  memoryPeak: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  metadata?: ComputationMetadata;
}

export interface ComputationMonitorOptions {
  enableDetailedTracking: boolean;
  alertThreshold: number; // ms - alert if operation takes longer
  sampleRate: number; // 0-1, percentage of operations to track
  retentionPeriod: number; // ms - how long to keep metrics
  enableProfiling: boolean;
}

export interface ComputationAlert {
  operationId: string;
  operationName: string;
  duration: number;
  threshold: number;
  timestamp: number;
  severity: 'warning' | 'critical';
  recommendation?: string;
}

export interface PerformanceProfile {
  operationName: string;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  minDuration: number;
  maxDuration: number;
  totalExecutions: number;
  successRate: number;
  efficiency: number;
  memoryUsage: number;
  trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Computation time monitor for tracking and analyzing operation performance
 */
export class ComputationTimeMonitor {
  private metrics: ComputationMetrics[] = [];
  private activeOperations = new Map<string, ComputationMetrics>();
  private alerts: ComputationAlert[] = [];
  private options: ComputationMonitorOptions;
  private cleanupTimer: NodeJSTimer | null = null;

  constructor(options: Partial<ComputationMonitorOptions> = {}) {
    this.options = {
      enableDetailedTracking: true,
      alertThreshold: 5000, // 5 seconds
      sampleRate: 1.0, // Track all operations
      retentionPeriod: 3600000, // 1 hour
      enableProfiling: true,
      ...options
    };

    this.startCleanupTimer();
  }

  /**
   * Start monitoring a computation
   */
  startComputation(
    operationId: string,
    operationName: string,
    inputSize: number = 0,
    metadata?: ComputationMetadata
  ): string {
    // Sample based on sample rate
    if (Math.random() > this.options.sampleRate) {
      return operationId; // Return ID but don't track
    }

    const startTime = performance.now();
    const initialMemory = this.getMemoryUsage();

    const metrics: ComputationMetrics = {
      operationId,
      operationName,
      startTime,
      endTime: 0,
      duration: 0,
      inputSize,
      outputSize: 0,
      complexity: 0,
      efficiency: 0,
      memoryPeak: initialMemory,
      status: 'running',
      metadata
    };

    this.activeOperations.set(operationId, metrics);

    console.log(`⏱️ Started monitoring: ${operationName} (${operationId})`);

    return operationId;
  }

  /**
   * End monitoring a computation
   */
  endComputation(
    operationId: string,
    outputSize: number = 0,
    error?: Error
  ): ComputationMetrics | null {
    const metrics = this.activeOperations.get(operationId);
    if (!metrics) return null;

    const endTime = performance.now();
    const finalMemory = this.getMemoryUsage();

    metrics.endTime = endTime;
    metrics.duration = endTime - metrics.startTime;
    metrics.outputSize = outputSize;
    metrics.memoryPeak = Math.max(metrics.memoryPeak, finalMemory);
    metrics.status = error ? 'failed' : 'completed';
    metrics.error = error?.message;

    // Calculate efficiency (operations per second)
    if (metrics.duration > 0) {
      metrics.efficiency = (outputSize / metrics.duration) * 1000;
    }

    // Estimate complexity based on input/output ratio and duration
    metrics.complexity = this.estimateComplexity(metrics);

    // Move to completed metrics
    this.metrics.push(metrics);
    this.activeOperations.delete(operationId);

    // Check for alerts
    this.checkForAlerts(metrics);

    console.log(`✅ Completed monitoring: ${metrics.operationName} - ${metrics.duration.toFixed(2)}ms`);

    return metrics;
  }

  /**
   * Monitor a computation with automatic start/end
   */
  async monitorComputation<T>(
    operationId: string,
    operationName: string,
    computation: () => Promise<T>,
    inputSize: number = 0,
    metadata?: ComputationMetadata
  ): Promise<T> {
    this.startComputation(operationId, operationName, inputSize, metadata);

    try {
      const result = await computation();
      const outputSize = this.estimateOutputSize(result);
      this.endComputation(operationId, outputSize);
      return result;
    } catch (error) {
      this.endComputation(operationId, 0, error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Cancel a computation
   */
  cancelComputation(operationId: string): void {
    const metrics = this.activeOperations.get(operationId);
    if (metrics) {
      metrics.status = 'cancelled';
      metrics.endTime = performance.now();
      metrics.duration = metrics.endTime - metrics.startTime;

      this.metrics.push(metrics);
      this.activeOperations.delete(operationId);

      console.log(`❌ Cancelled monitoring: ${metrics.operationName}`);
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as ExtendedPerformance).memory!.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Estimate output size
   */
  private estimateOutputSize(result: unknown): number {
    if (Array.isArray(result)) {
      return result.length;
    }

    if (typeof result === 'object' && result !== null) {
      return Object.keys(result).length;
    }

    if (typeof result === 'string') {
      return result.length;
    }

    return 1; // Default
  }

  /**
   * Estimate computational complexity
   */
  private estimateComplexity(metrics: ComputationMetrics): number {
    const { inputSize, duration } = metrics;

    if (inputSize === 0) return 0;

    // Simple heuristic: complexity increases with input size and duration
    const timePerItem = duration / inputSize;

    // Classify complexity
    if (timePerItem < 0.1) return 1; // O(1) - constant time
    if (timePerItem < 1) return 2; // O(log n) - logarithmic
    if (timePerItem < 10) return 3; // O(n) - linear
    if (timePerItem < 100) return 4; // O(n log n)
    if (timePerItem < 1000) return 5; // O(n^2) - quadratic
    return 6; // O(n^3) or worse - cubic or exponential
  }

  /**
   * Check for performance alerts
   */
  private checkForAlerts(metrics: ComputationMetrics): void {
    if (metrics.duration > this.options.alertThreshold) {
      const severity = metrics.duration > this.options.alertThreshold * 2 ? 'critical' : 'warning';

      const alert: ComputationAlert = {
        operationId: metrics.operationId,
        operationName: metrics.operationName,
        duration: metrics.duration,
        threshold: this.options.alertThreshold,
        timestamp: Date.now(),
        severity,
        recommendation: this.getPerformanceRecommendation(metrics)
      };

      this.alerts.push(alert);

      console.warn(`🚨 Performance alert: ${metrics.operationName} took ${metrics.duration.toFixed(2)}ms (${severity})`);
    }
  }

  /**
   * Get performance recommendation
   */
  private getPerformanceRecommendation(metrics: ComputationMetrics): string {
    if (metrics.complexity >= 5) {
      return 'Consider optimizing algorithm complexity - current operation appears to be O(n²) or worse';
    }

    if (metrics.memoryPeak > 100) {
      return 'High memory usage detected - consider implementing memory optimization or lazy loading';
    }

    if (metrics.efficiency < 100) {
      return 'Low efficiency detected - consider parallel processing or caching';
    }

    return 'Monitor operation for further optimization opportunities';
  }

  /**
   * Get performance profile for an operation
   */
  getPerformanceProfile(operationName: string): PerformanceProfile | null {
    const operationMetrics = this.metrics.filter(m => m.operationName === operationName);
    if (operationMetrics.length === 0) return null;

    const durations = operationMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successful = operationMetrics.filter(m => m.status === 'completed').length;

    const profile: PerformanceProfile = {
      operationName,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: durations[Math.floor(durations.length / 2)],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)],
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalExecutions: operationMetrics.length,
      successRate: successful / operationMetrics.length,
      efficiency: operationMetrics.reduce((sum, m) => sum + m.efficiency, 0) / operationMetrics.length,
      memoryUsage: operationMetrics.reduce((sum, m) => sum + m.memoryPeak, 0) / operationMetrics.length,
      trend: this.calculateTrend(operationMetrics)
    };

    return profile;
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(metrics: ComputationMetrics[]): 'improving' | 'stable' | 'degrading' {
    if (metrics.length < 10) return 'stable';

    const recent = metrics.slice(-10);
    const older = metrics.slice(-20, -10);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.duration, 0) / older.length;

    const improvement = (olderAvg - recentAvg) / olderAvg;

    if (improvement > 0.1) return 'improving';
    if (improvement < -0.1) return 'degrading';
    return 'stable';
  }

  /**
   * Get active operations
   */
  getActiveOperations(): ComputationMetrics[] {
    return Array.from(this.activeOperations.values());
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): ComputationAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get computation summary
   */
  getComputationSummary(): {
    totalOperations: number;
    activeOperations: number;
    averageDuration: number;
    totalAlerts: number;
    successRate: number;
    topSlowOperations: Array<{ name: string; averageDuration: number; count: number }>;
  } {
    const completedMetrics = this.metrics.filter(m => m.status === 'completed');
    const totalDuration = completedMetrics.reduce((sum, m) => sum + m.duration, 0);

    // Group by operation name
    const operationGroups = new Map<string, ComputationMetrics[]>();
    completedMetrics.forEach(m => {
      if (!operationGroups.has(m.operationName)) {
        operationGroups.set(m.operationName, []);
      }
      operationGroups.get(m.operationName)!.push(m);
    });

    // Get top slow operations
    const topSlowOperations = Array.from(operationGroups.entries())
      .map(([name, metrics]) => ({
        name,
        averageDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
        count: metrics.length
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);

    return {
      totalOperations: this.metrics.length,
      activeOperations: this.activeOperations.size,
      averageDuration: completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0,
      totalAlerts: this.alerts.length,
      successRate: completedMetrics.length / Math.max(1, this.metrics.length),
      topSlowOperations
    };
  }

  /**
   * Export computation metrics
   */
  exportMetrics(): string {
    const summary = this.getComputationSummary();
    const profiles = Array.from(new Set(this.metrics.map(m => m.operationName)))
      .map(name => this.getPerformanceProfile(name))
      .filter(p => p !== null) as PerformanceProfile[];

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      summary,
      profiles,
      recentAlerts: this.getRecentAlerts(20),
      activeOperations: this.getActiveOperations(),
      options: this.options
    }, null, 2);
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  /**
   * Clean up old metrics
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.options.retentionPeriod;

    // Clean up old metrics
    this.metrics = this.metrics.filter(m => m.startTime > cutoff);

    // Clean up old alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);

    console.log(`🧹 Cleaned up computation metrics: ${this.metrics.length} metrics, ${this.alerts.length} alerts remaining`);
  }

  /**
   * Reset monitor
   */
  reset(): void {
    this.metrics = [];
    this.activeOperations.clear();
    this.alerts = [];
    console.log('📊 Computation time monitor reset');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton instance
export const computationTimeMonitor = new ComputationTimeMonitor();

// Utility functions
export const monitorComputation = async <T>(
  operationId: string,
  operationName: string,
  computation: () => Promise<T>,
  inputSize?: number,
  metadata?: ComputationMetadata
): Promise<T> => {
  return computationTimeMonitor.monitorComputation(operationId, operationName, computation, inputSize, metadata);
};

export const startComputationMonitoring = (
  operationId: string,
  operationName: string,
  inputSize?: number,
  metadata?: ComputationMetadata
): string => {
  return computationTimeMonitor.startComputation(operationId, operationName, inputSize, metadata);
};

export const endComputationMonitoring = (
  operationId: string,
  outputSize?: number,
  error?: Error
): ComputationMetrics | null => {
  return computationTimeMonitor.endComputation(operationId, outputSize, error);
};
