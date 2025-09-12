import { ColumnAnalyzer, type Draw } from './scoringSystem';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage?: number;
  cacheHitRate?: number;
}

export class PerformanceBenchmark {
  private columnAnalyzer: ColumnAnalyzer;
  private metrics: PerformanceMetrics[] = [];

  constructor(draws: Draw[]) {
    this.columnAnalyzer = new ColumnAnalyzer(draws);
  }

  /**
   * Benchmark column analysis performance
   */
  async benchmarkColumnAnalysis(iterations: number = 10): Promise<PerformanceMetrics[]> {
    const results: PerformanceMetrics[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      // Analyze all columns
      for (let col = 1; col <= 6; col++) {
        this.columnAnalyzer.analyzeColumn(col);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      results.push({
        operation: `Column Analysis (Iteration ${i + 1})`,
        duration,
        memoryUsage: this.getMemoryUsage()
      });
    }

    this.metrics.push(...results);
    return results;
  }

  /**
   * Benchmark correlation analysis
   */
  benchmarkCorrelationAnalysis(): PerformanceMetrics {
    const startTime = performance.now();
    const correlations = this.columnAnalyzer.calculateAllColumnCorrelations();
    const endTime = performance.now();

    const metric: PerformanceMetrics = {
      operation: 'Correlation Analysis',
      duration: endTime - startTime,
      memoryUsage: this.getMemoryUsage()
    };

    this.metrics.push(metric);
    return metric;
  }

  /**
   * Benchmark trend detection
   */
  benchmarkTrendDetection(): PerformanceMetrics {
    const startTime = performance.now();

    for (let col = 1; col <= 6; col++) {
      this.columnAnalyzer.detectColumnTrend(col);
    }

    const endTime = performance.now();

    const metric: PerformanceMetrics = {
      operation: 'Trend Detection (All Columns)',
      duration: endTime - startTime,
      memoryUsage: this.getMemoryUsage()
    };

    this.metrics.push(metric);
    return metric;
  }

  /**
   * Benchmark prediction accuracy tracking
   */
  benchmarkPredictionAccuracy(): PerformanceMetrics {
    const startTime = performance.now();

    // Mock prediction data
    const predictions = [5, 15, 25, 35, 45];
    const actuals = [5, 17, 28, 39, 50];

    for (let col = 1; col <= 6; col++) {
      this.columnAnalyzer.trackPredictionAccuracy(col, predictions, actuals);
    }

    const endTime = performance.now();

    const metric: PerformanceMetrics = {
      operation: 'Prediction Accuracy Tracking',
      duration: endTime - startTime,
      memoryUsage: this.getMemoryUsage()
    };

    this.metrics.push(metric);
    return metric;
  }

  /**
   * Benchmark data export operations
   */
  benchmarkDataExport(): PerformanceMetrics {
    const startTime = performance.now();
    const jsonData = this.columnAnalyzer.exportColumnData();
    const csvData = this.columnAnalyzer.exportColumnDataCSV();
    const endTime = performance.now();

    const metric: PerformanceMetrics = {
      operation: 'Data Export (JSON + CSV)',
      duration: endTime - startTime,
      memoryUsage: this.getMemoryUsage()
    };

    this.metrics.push(metric);
    return metric;
  }

  /**
   * Run comprehensive performance benchmark
   */
  async runComprehensiveBenchmark(): Promise<{
    summary: PerformanceMetrics[];
    averages: { [key: string]: number };
    recommendations: string[];
  }> {
    console.log('🚀 Starting comprehensive performance benchmark...');

    // Run all benchmarks
    const columnAnalysisMetrics = await this.benchmarkColumnAnalysis(5);
    const correlationMetrics = this.benchmarkCorrelationAnalysis();
    const trendMetrics = this.benchmarkTrendDetection();
    const predictionMetrics = this.benchmarkPredictionAccuracy();
    const exportMetrics = this.benchmarkDataExport();

    const allMetrics = [
      ...columnAnalysisMetrics,
      correlationMetrics,
      trendMetrics,
      predictionMetrics,
      exportMetrics
    ];

    // Calculate averages
    const operationGroups = allMetrics.reduce((acc, metric) => {
      if (!acc[metric.operation]) {
        acc[metric.operation] = [];
      }
      acc[metric.operation].push(metric.duration);
      return acc;
    }, {} as { [key: string]: number[] });

    const averages = Object.keys(operationGroups).reduce((acc, operation) => {
      const durations = operationGroups[operation];
      acc[operation] = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      return acc;
    }, {} as { [key: string]: number });

    // Generate recommendations
    const recommendations: string[] = [];

    if (averages['Column Analysis (Iteration 1)'] > 1000) {
      recommendations.push('⚠️ Column analysis is slow (>1s). Consider optimizing calculations or implementing lazy loading.');
    }

    if (averages['Correlation Analysis'] > 500) {
      recommendations.push('⚠️ Correlation analysis is taking time. Consider caching results for repeated calculations.');
    }

    if (averages['Data Export (JSON + CSV)'] > 2000) {
      recommendations.push('⚠️ Data export is slow. Consider implementing streaming for large datasets.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All operations are performing well within acceptable time limits.');
    }

    return {
      summary: allMetrics,
      averages,
      recommendations
    };
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report = [
      '📊 Performance Benchmark Report',
      '=' .repeat(50),
      '',
      'Operations Summary:',
      ...this.metrics.map(m =>
        `${m.operation}: ${m.duration.toFixed(2)}ms${m.memoryUsage ? ` (${(m.memoryUsage / 1024 / 1024).toFixed(2)} MB)` : ''}`
      ),
      '',
      'Recommendations:',
      ...this.generateRecommendations(),
      '',
      '=' .repeat(50)
    ];

    return report.join('\n');
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const avgDurations = this.metrics.reduce((acc, m) => {
      acc[m.operation] = acc[m.operation] || [];
      acc[m.operation].push(m.duration);
      return acc;
    }, {} as { [key: string]: number[] });

    Object.keys(avgDurations).forEach(operation => {
      const avg = avgDurations[operation].reduce((sum, d) => sum + d, 0) / avgDurations[operation].length;

      if (operation.includes('Column Analysis') && avg > 500) {
        recommendations.push(`- ${operation} is slow (${avg.toFixed(2)}ms avg). Consider optimization.`);
      }

      if (operation.includes('Correlation') && avg > 200) {
        recommendations.push(`- ${operation} could benefit from caching (${avg.toFixed(2)}ms avg).`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('- All operations are performing well!');
    }

    return recommendations;
  }
}
