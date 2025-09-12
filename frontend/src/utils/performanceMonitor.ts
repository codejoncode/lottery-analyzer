import React from 'react';
import type { Draw } from '../utils/scoringSystem';
import { performanceOptimizer } from './performanceOptimizer';
import { computationTimeMonitor } from './computationTimeMonitor';
import { memoryOptimizer } from './memoryOptimizer';

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  metadata?: Record<string, any>;
}

export interface SystemPerformance {
  totalOperations: number;
  averageResponseTime: number;
  peakMemoryUsage: number;
  totalMemoryUsage: number;
  slowestOperation: string;
  fastestOperation: string;
  operationsByType: Record<string, number>;
}

/**
 * Performance Monitoring System
 * Tracks system performance, memory usage, and operation timing
 * Now integrated with performance optimization components
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isEnabled: boolean = true;
  private maxMetrics: number = 1000;
  private optimizationEnabled: boolean = true;

  /**
   * Start timing an operation
   */
  startOperation(operationName: string, metadata?: Record<string, any>): () => void {
    if (!this.isEnabled) {
      return () => {}; // No-op function
    }

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    // Start computation monitoring if optimization is enabled
    const computationId = this.optimizationEnabled ?
      computationTimeMonitor.startComputation(
        `perf-${Date.now()}-${Math.random()}`,
        operationName,
        metadata?.inputSize || 0,
        metadata
      ) : '';

    return () => {
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metric: PerformanceMetrics = {
        operationName,
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        metadata
      };

      this.addMetric(metric);

      // End computation monitoring
      if (this.optimizationEnabled && computationId) {
        computationTimeMonitor.endComputation(computationId, metadata?.outputSize || 0);
      }

      // Check memory usage and optimize if needed
      if (this.optimizationEnabled && endMemory > 100 * 1024 * 1024) { // 100MB
        memoryOptimizer.optimizeMemory();
      }
    };
  }

  /**
   * Add a completed metric
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get system performance statistics
   */
  getSystemPerformance(): SystemPerformance {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        peakMemoryUsage: 0,
        totalMemoryUsage: 0,
        slowestOperation: '',
        fastestOperation: '',
        operationsByType: {}
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const memoryUsages = this.metrics.map(m => m.memoryUsage || 0).filter(m => m > 0);

    const operationsByType = this.metrics.reduce((acc, metric) => {
      acc[metric.operationName] = (acc[metric.operationName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedByDuration = [...this.metrics].sort((a, b) => b.duration - a.duration);

    const systemPerf: SystemPerformance = {
      totalOperations: this.metrics.length,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      peakMemoryUsage: Math.max(...memoryUsages, 0),
      totalMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0),
      slowestOperation: sortedByDuration[0]?.operationName || '',
      fastestOperation: sortedByDuration[sortedByDuration.length - 1]?.operationName || '',
      operationsByType
    };

    // Add optimization metrics if enabled
    if (this.optimizationEnabled) {
      const optimizerSummary = performanceOptimizer.getPerformanceSummary();
      const computationSummary = computationTimeMonitor.getComputationSummary();
      const memoryStats = memoryOptimizer.getMemoryStats();

      // Enhance system performance with optimization data
      (systemPerf as any).optimizationMetrics = {
        cacheEfficiency: optimizerSummary.memoryEfficiency,
        computationEfficiency: computationSummary.successRate,
        memoryEfficiency: memoryStats.efficiency,
        activeOperations: computationSummary.activeOperations,
        totalAlerts: computationSummary.totalAlerts
      };
    }

    return systemPerf;
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 50): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get metrics for a specific operation type
   */
  getMetricsByOperation(operationName: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.operationName === operationName);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Enable or disable performance optimization features
   */
  setOptimizationEnabled(enabled: boolean): void {
    this.optimizationEnabled = enabled;
    console.log(`⚡ Performance optimization ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus(): {
    optimizationEnabled: boolean;
    performanceOptimizer: any;
    computationMonitor: any;
    memoryOptimizer: any;
  } {
    return {
      optimizationEnabled: this.optimizationEnabled,
      performanceOptimizer: this.optimizationEnabled ? performanceOptimizer.getPerformanceSummary() : null,
      computationMonitor: this.optimizationEnabled ? computationTimeMonitor.getComputationSummary() : null,
      memoryOptimizer: this.optimizationEnabled ? memoryOptimizer.getMemoryStats() : null
    };
  }

  /**
   * Run performance optimization
   */
  optimizePerformance(): void {
    if (!this.optimizationEnabled) return;

    console.log('🚀 Running performance optimization...');

    // Optimize memory
    memoryOptimizer.optimizeMemory();

    // Clear old metrics
    this.cleanupOldMetrics();

    // Reset computation monitor if too many metrics
    const computationSummary = computationTimeMonitor.getComputationSummary();
    if (computationSummary.totalOperations > 10000) {
      computationTimeMonitor.reset();
    }

    console.log('✅ Performance optimization completed');
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - 3600000; // 1 hour ago

    // Keep only recent metrics
    this.metrics = this.metrics.filter(m => m.startTime > oneHourAgo);

    console.log(`🧹 Cleaned up ${this.maxMetrics - this.metrics.length} old metrics`);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    const exportData: any = {
      metrics: this.metrics,
      systemPerformance: this.getSystemPerformance(),
      exportTime: new Date().toISOString()
    };

    // Add optimization data if enabled
    if (this.optimizationEnabled) {
      exportData.optimizationData = {
        performanceOptimizer: performanceOptimizer.exportMetrics(),
        computationMonitor: computationTimeMonitor.exportMetrics(),
        memoryOptimizer: memoryOptimizer.exportMemoryStats()
      };
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get performance summary for UI display
   */
  getPerformanceSummary(): {
    totalOperations: number;
    avgResponseTime: string;
    memoryUsage: string;
    topOperations: Array<{ name: string; count: number; avgTime: string }>;
  } {
    const systemPerf = this.getSystemPerformance();

    const topOperations = Object.entries(systemPerf.operationsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => {
        const operationMetrics = this.getMetricsByOperation(name);
        const avgTime = operationMetrics.reduce((sum, m) => sum + m.duration, 0) / operationMetrics.length;
        return {
          name,
          count,
          avgTime: `${avgTime.toFixed(2)}ms`
        };
      });

    return {
      totalOperations: systemPerf.totalOperations,
      avgResponseTime: `${systemPerf.averageResponseTime.toFixed(2)}ms`,
      memoryUsage: this.formatBytes(systemPerf.peakMemoryUsage),
      topOperations
    };
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const [monitor] = React.useState(() => new PerformanceMonitor());

  const startTiming = React.useCallback((operationName: string, metadata?: Record<string, any>) => {
    return monitor.startOperation(operationName, metadata);
  }, [monitor]);

  const getSummary = React.useCallback(() => {
    return monitor.getPerformanceSummary();
  }, [monitor]);

  const clearMetrics = React.useCallback(() => {
    monitor.clearMetrics();
  }, [monitor]);

  const setOptimizationEnabled = React.useCallback((enabled: boolean) => {
    monitor.setOptimizationEnabled(enabled);
  }, [monitor]);

  const getOptimizationStatus = React.useCallback(() => {
    return monitor.getOptimizationStatus();
  }, [monitor]);

  const optimizePerformance = React.useCallback(() => {
    monitor.optimizePerformance();
  }, [monitor]);

  return {
    startTiming,
    getSummary,
    clearMetrics,
    exportMetrics: () => monitor.exportMetrics(),
    setOptimizationEnabled,
    getOptimizationStatus,
    optimizePerformance
  };
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();
