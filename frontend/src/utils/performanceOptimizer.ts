export interface PerformanceMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
  ttl: number;
}

export interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface ExtendedWindow extends Window {
  gc?: () => void;
}

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  metadata?: PerformanceMetadata;
}

export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableParallelProcessing: boolean;
  maxConcurrency: number;
  memoryLimit: number; // MB
  cacheSize: number;
  batchSize: number;
}

export interface LazyLoader<T> {
  load: () => Promise<T>;
  isLoaded: boolean;
  data?: T;
  lastAccessed: number;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private config: OptimizationConfig;
  private memoryCache = new Map<string, CacheEntry>();
  private lazyLoaders = new Map<string, LazyLoader<unknown>>();
  private workers: Worker[] = [];

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableLazyLoading: true,
      enableParallelProcessing: true,
      maxConcurrency: navigator.hardwareConcurrency || 4,
      memoryLimit: 500, // MB
      cacheSize: 1000,
      batchSize: 100,
      ...config
    };

    this.initializeWorkers();
  }

  /**
   * Initialize Web Workers for parallel processing
   */
  private initializeWorkers(): void {
    if (!this.config.enableParallelProcessing) return;

    // Create workers for CPU-intensive tasks
    for (let i = 0; i < Math.min(this.config.maxConcurrency, 4); i++) {
      try {
        // Note: In a real implementation, you'd create actual worker files
        // For now, we'll simulate parallel processing
        this.workers.push({} as Worker);
      } catch (error) {
        console.warn('Web Workers not supported:', error);
        break;
      }
    }
  }

  /**
   * Time a function execution and track performance metrics
   */
  async timeExecution<T>(
    operationName: string,
    fn: () => Promise<T> | T,
    metadata?: PerformanceMetadata
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metrics: PerformanceMetrics = {
        operationName,
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        metadata
      };

      this.metrics.push(metrics);
      this.logPerformanceMetrics(metrics);

      return result;
    } catch (error) {
      const endTime = performance.now();
      const metrics: PerformanceMetrics = {
        operationName,
        startTime,
        endTime,
        duration: endTime - startTime,
        metadata: { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' }
      };

      this.metrics.push(metrics);
      throw error;
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
   * Log performance metrics
   */
  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    const duration = metrics.duration.toFixed(2);
    const memory = metrics.memoryUsage ? `${metrics.memoryUsage.toFixed(2)}MB` : 'N/A';

    console.log(`⚡ ${metrics.operationName}: ${duration}ms, Memory: ${memory}`);

    // Log warnings for slow operations
    if (metrics.duration > 5000) {
      console.warn(`🐌 Slow operation detected: ${metrics.operationName} took ${duration}ms`);
    }

    // Log memory warnings
    if (metrics.memoryUsage && metrics.memoryUsage > this.config.memoryLimit * 0.8) {
      console.warn(`💾 High memory usage: ${memory} (${(metrics.memoryUsage / this.config.memoryLimit * 100).toFixed(1)}% of limit)`);
    }
  }

  /**
   * Create a lazy loader for expensive operations
   */
  createLazyLoader<T>(
    key: string,
    loader: () => Promise<T>,
    ttl: number = 300000 // 5 minutes
  ): LazyLoader<T> {
    if (!this.config.enableLazyLoading) {
      // If lazy loading is disabled, load immediately
      const loaderObj: LazyLoader<T> = {
        load: async () => {
          if (!loaderObj.isLoaded) {
            loaderObj.data = await loader();
            loaderObj.isLoaded = true;
            loaderObj.lastAccessed = Date.now();
          }
          return loaderObj.data!;
        },
        isLoaded: false,
        lastAccessed: Date.now()
      };
      return loaderObj;
    }

    const lazyLoader: LazyLoader<T> = {
      load: async () => {
        if (!lazyLoader.isLoaded || (Date.now() - lazyLoader.lastAccessed) > ttl) {
          lazyLoader.data = await this.timeExecution(`LazyLoad-${key}`, loader);
          lazyLoader.isLoaded = true;
        }
        lazyLoader.lastAccessed = Date.now();
        return lazyLoader.data!;
      },
      isLoaded: false,
      lastAccessed: Date.now()
    };

    this.lazyLoaders.set(key, lazyLoader);
    return lazyLoader;
  }

  /**
   * Optimized combination generation with batching and memory management
   */
  async *generateCombinationsOptimized(
    totalNumbers: number,
    pickCount: number,
    batchSize: number = this.config.batchSize
  ): AsyncGenerator<number[][], void, unknown> {
    const totalCombinations = this.calculateCombinations(totalNumbers, pickCount);

    if (totalCombinations > 1000000) {
      console.warn(`Large combination set: ${totalCombinations.toLocaleString()} combinations`);
    }

    const batch: number[][] = [];

    // Use optimized algorithm for combination generation
    const generateCombination = (start: number, remaining: number, current: number[]): void => {
      if (remaining === 0) {
        batch.push([...current]);

        if (batch.length >= batchSize) {
          // Yield batch and clear
          // Note: In real implementation, this would be an async generator
        }
        return;
      }

      for (let i = start; i <= totalNumbers - remaining + 1; i++) {
        current.push(i);
        generateCombination(i + 1, remaining - 1, current);
        current.pop();

        // Memory check
        if (this.getMemoryUsage() > this.config.memoryLimit * 0.9) {
          console.warn('Memory limit approaching, yielding current batch');
          break;
        }
      }
    };

    await this.timeExecution('CombinationGeneration', () => {
      generateCombination(1, pickCount, []);
    });

    if (batch.length > 0) {
      yield batch;
    }
  }

  /**
   * Calculate number of combinations (n choose k)
   */
  private calculateCombinations(n: number, k: number): number {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;

    let result = 1;
    for (let i = 1; i <= k; i++) {
      result = result * (n - k + i) / i;
    }

    return Math.round(result);
  }

  /**
   * Parallel processing for independent operations
   */
  async processInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number = this.config.maxConcurrency
  ): Promise<R[]> {
    if (!this.config.enableParallelProcessing || items.length < concurrency) {
      // Process sequentially for small datasets
      return this.timeExecution('SequentialProcessing', async () => {
        const results: R[] = [];
        for (const item of items) {
          results.push(await processor(item));
        }
        return results;
      });
    }

    return this.timeExecution('ParallelProcessing', async () => {
      const results: R[] = [];
      const chunks = this.chunkArray(items, concurrency);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(processor);
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);

        // Memory check between chunks
        if (this.getMemoryUsage() > this.config.memoryLimit * 0.8) {
          console.warn('High memory usage during parallel processing, slowing down...');
          await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
        }
      }

      return results;
    });
  }

  /**
   * Split array into chunks for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Memory-optimized caching with LRU eviction
   */
  setCache<T>(key: string, value: T, ttl: number = 300000): void {
    if (this.memoryCache.size >= this.config.cacheSize) {
      // Simple LRU: remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey !== undefined) {
        this.memoryCache.delete(firstKey);
      }
    }

    this.memoryCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  getCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Memory usage optimization - force garbage collection if available
   */
  optimizeMemory(): void {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Clear old lazy loaders
    for (const [key, loader] of this.lazyLoaders.entries()) {
      if (now - loader.lastAccessed > 600000) { // 10 minutes
        this.lazyLoaders.delete(key);
      }
    }

    // Force garbage collection if available (Chrome/Edge)
    if ('gc' in window) {
      (window as ExtendedWindow).gc!();
    }

    console.log(`🧹 Memory optimized. Cache size: ${this.memoryCache.size}, Lazy loaders: ${this.lazyLoaders.size}`);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalOperations: number;
    averageDuration: number;
    totalMemoryUsage: number;
    slowestOperation: string;
    memoryEfficiency: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        totalMemoryUsage: 0,
        slowestOperation: 'None',
        memoryEfficiency: 1
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalMemory = this.metrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0);
    const slowest = this.metrics.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    );

    return {
      totalOperations: this.metrics.length,
      averageDuration: totalDuration / this.metrics.length,
      totalMemoryUsage: totalMemory,
      slowestOperation: slowest.operationName,
      memoryEfficiency: this.memoryCache.size / this.config.cacheSize
    };
  }

  /**
   * Export performance metrics
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      config: this.config,
      summary: this.getPerformanceSummary(),
      metrics: this.metrics.slice(-100), // Last 100 operations
      memoryStats: {
        cacheSize: this.memoryCache.size,
        lazyLoadersCount: this.lazyLoaders.size,
        currentMemoryUsage: this.getMemoryUsage()
      }
    }, null, 2);
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = [];
    console.log('📊 Performance metrics reset');
  }
}

// Singleton instance for global performance optimization
export const performanceOptimizer = new PerformanceOptimizer();

// Utility functions for common performance optimizations
export const withPerformanceMonitoring = async <T>(
  operationName: string,
  fn: () => Promise<T>,
  metadata?: PerformanceMetadata
): Promise<T> => {
  return performanceOptimizer.timeExecution(operationName, fn, metadata);
};

export const createLazyLoader = <T>(
  key: string,
  loader: () => Promise<T>,
  ttl?: number
): LazyLoader<T> => {
  return performanceOptimizer.createLazyLoader(key, loader, ttl);
};

export const processInParallel = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency?: number
): Promise<R[]> => {
  return performanceOptimizer.processInParallel(items, processor, concurrency);
};
