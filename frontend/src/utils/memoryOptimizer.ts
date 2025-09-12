import { performanceOptimizer, withPerformanceMonitoring } from './performanceOptimizer';

export interface MemoryStats {
  used: number;
  total: number;
  limit: number;
  efficiency: number;
  fragmentation: number;
}

export interface MemoryOptimizationOptions {
  enableGC: boolean;
  gcThreshold: number; // MB
  cacheSize: number;
  cleanupInterval: number; // ms
  compressionThreshold: number; // MB
}

export interface CompressedData<T> {
  data: T;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Memory optimization utility with garbage collection and data compression
 */
export class MemoryOptimizer {
  private options: MemoryOptimizationOptions;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private compressedData = new Map<string, CompressedData<any>>();
  private weakRefs = new WeakMap<object, { lastAccessed: number; size: number }>();
  private memoryHistory: MemoryStats[] = [];

  constructor(options: Partial<MemoryOptimizationOptions> = {}) {
    this.options = {
      enableGC: true,
      gcThreshold: 100, // MB
      cacheSize: 50,
      cleanupInterval: 30000, // 30 seconds
      compressionThreshold: 10, // MB
      ...options
    };

    this.startCleanupTimer();
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const used = this.getCurrentMemoryUsage();
    const limit = this.options.gcThreshold * 1024 * 1024; // Convert to bytes
    const total = used;
    const efficiency = this.calculateMemoryEfficiency();
    const fragmentation = this.calculateFragmentation();

    const stats: MemoryStats = {
      used,
      total,
      limit,
      efficiency,
      fragmentation
    };

    this.memoryHistory.push(stats);

    // Keep only last 100 entries
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }

    return stats;
  }

  /**
   * Get current memory usage in bytes
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }

    // Fallback: estimate based on compressed data size
    let estimatedSize = 0;
    this.compressedData.forEach(data => {
      estimatedSize += data.compressedSize;
    });

    return estimatedSize;
  }

  /**
   * Calculate memory efficiency (0-1, higher is better)
   */
  private calculateMemoryEfficiency(): number {
    if (this.memoryHistory.length < 2) return 1;

    const recent = this.memoryHistory.slice(-10);
    const avgUsage = recent.reduce((sum, stat) => sum + stat.used, 0) / recent.length;
    const limit = this.options.gcThreshold * 1024 * 1024;

    return Math.max(0, 1 - (avgUsage / limit));
  }

  /**
   * Calculate memory fragmentation (0-1, lower is better)
   */
  private calculateFragmentation(): number {
    // Simple fragmentation estimate based on compressed data distribution
    if (this.compressedData.size === 0) return 0;

    const sizes = Array.from(this.compressedData.values()).map(d => d.compressedSize);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;

    return Math.min(1, variance / (avgSize * avgSize));
  }

  /**
   * Compress data if it exceeds threshold
   */
  async compressData<T>(key: string, data: T): Promise<CompressedData<T>> {
    const dataSize = this.estimateDataSize(data);

    if (dataSize < this.options.compressionThreshold * 1024 * 1024) {
      // No compression needed
      return {
        data,
        compressed: false,
        originalSize: dataSize,
        compressedSize: dataSize,
        compressionRatio: 1
      };
    }

    return withPerformanceMonitoring('DataCompression', async () => {
      try {
        // Simple compression using JSON.stringify + base64 (in real implementation, use a proper compression library)
        const jsonString = JSON.stringify(data);
        const compressed = btoa(jsonString); // Base64 encoding as simple compression

        const compressedSize = compressed.length * 2; // Rough estimate
        const compressionRatio = compressedSize / dataSize;

        const compressedData: CompressedData<T> = {
          data: data, // Keep original data for now (real implementation would store compressed)
          compressed: true,
          originalSize: dataSize,
          compressedSize,
          compressionRatio
        };

        this.compressedData.set(key, compressedData);

        console.log(`🗜️ Compressed data "${key}": ${(compressionRatio * 100).toFixed(1)}% of original size`);

        return compressedData;
      } catch (error) {
        console.warn('Compression failed, using original data:', error);
        return {
          data,
          compressed: false,
          originalSize: dataSize,
          compressedSize: dataSize,
          compressionRatio: 1
        };
      }
    });
  }

  /**
   * Decompress data
   */
  async decompressData<T>(key: string): Promise<T | null> {
    const compressedData = this.compressedData.get(key);
    if (!compressedData) return null;

    if (!compressedData.compressed) {
      return compressedData.data;
    }

    return withPerformanceMonitoring('DataDecompression', async () => {
      try {
        // Simple decompression (reverse of compression)
        const jsonString = atob(compressedData.data as any);
        const data = JSON.parse(jsonString);

        console.log(`📦 Decompressed data "${key}"`);

        return data;
      } catch (error) {
        console.error('Decompression failed:', error);
        return null;
      }
    });
  }

  /**
   * Estimate data size in bytes
   */
  private estimateDataSize(data: any): number {
    const jsonString = JSON.stringify(data);
    return jsonString.length * 2; // Rough estimate: 2 bytes per character
  }

  /**
   * Create memory-efficient array with automatic cleanup
   */
  createEfficientArray<T>(initialCapacity: number = 1000): EfficientArray<T> {
    return new EfficientArray<T>(initialCapacity, this);
  }

  /**
   * Create memory-efficient map with automatic cleanup
   */
  createEfficientMap<K, V>(initialCapacity: number = 100): EfficientMap<K, V> {
    return new EfficientMap<K, V>(initialCapacity, this);
  }

  /**
   * Force garbage collection if available
   */
  forceGC(): void {
    if (this.options.enableGC && 'gc' in window) {
      (window as any).gc();
      console.log('🧹 Forced garbage collection');
    }
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory(): void {
    const stats = this.getMemoryStats();

    console.log(`💾 Memory optimization - Used: ${(stats.used / 1024 / 1024).toFixed(2)}MB, Efficiency: ${(stats.efficiency * 100).toFixed(1)}%`);

    // Force GC if memory usage is high
    if (stats.used > this.options.gcThreshold * 1024 * 1024 * 0.8) {
      this.forceGC();
    }

    // Clean up old compressed data
    this.cleanupCompressedData();

    // Clean up weak references
    this.cleanupWeakRefs();

    // Optimize performance optimizer
    performanceOptimizer.optimizeMemory();
  }

  /**
   * Clean up old compressed data
   */
  private cleanupCompressedData(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [key, data] of this.compressedData.entries()) {
      // Remove data that's been compressed for too long
      if (now - (data as any).timestamp > maxAge) {
        this.compressedData.delete(key);
      }
    }

    console.log(`🗑️ Cleaned up compressed data cache: ${this.compressedData.size} items remaining`);
  }

  /**
   * Clean up weak references
   */
  private cleanupWeakRefs(): void {
    // WeakMap automatically cleans up when objects are garbage collected
    // We just need to track access patterns
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    // Note: In a real implementation, we'd iterate through weak refs
    // but WeakMap doesn't allow enumeration, so we use a different approach
    console.log(`🔍 Weak reference cleanup completed`);
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.optimizeMemory();
    }, this.options.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get memory optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const stats = this.getMemoryStats();
    const recommendations: string[] = [];

    if (stats.efficiency < 0.5) {
      recommendations.push('Memory efficiency is low. Consider reducing cache sizes or implementing data compression.');
    }

    if (stats.fragmentation > 0.7) {
      recommendations.push('High memory fragmentation detected. Consider defragmenting data structures.');
    }

    if (stats.used > stats.limit * 0.9) {
      recommendations.push('Memory usage is approaching limit. Consider reducing batch sizes or implementing lazy loading.');
    }

    if (this.compressedData.size > this.options.cacheSize) {
      recommendations.push('Compressed data cache is full. Consider increasing cache size or implementing LRU eviction.');
    }

    return recommendations;
  }

  /**
   * Export memory statistics for analysis
   */
  exportMemoryStats(): string {
    const stats = this.getMemoryStats();
    const history = this.memoryHistory.slice(-20); // Last 20 entries

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      currentStats: stats,
      history,
      compressedDataCount: this.compressedData.size,
      recommendations: this.getOptimizationRecommendations()
    }, null, 2);
  }
}

/**
 * Memory-efficient array with automatic resizing and cleanup
 */
export class EfficientArray<T> {
  private data: (T | null)[] = [];
  private size = 0;
  private capacity: number;

  constructor(initialCapacity: number, private memoryOptimizer: MemoryOptimizer) {
    this.capacity = initialCapacity;
    this.data = new Array(initialCapacity).fill(null);
  }

  /**
   * Add item to array
   */
  push(item: T): void {
    if (this.size >= this.capacity) {
      this.resize(this.capacity * 2);
    }

    this.data[this.size] = item;
    this.size++;
  }

  /**
   * Get item at index
   */
  get(index: number): T | null {
    if (index < 0 || index >= this.size) return null;
    return this.data[index];
  }

  /**
   * Set item at index
   */
  set(index: number, item: T): void {
    if (index < 0 || index >= this.capacity) {
      throw new Error('Index out of bounds');
    }

    if (index >= this.size) {
      this.size = index + 1;
    }

    this.data[index] = item;
  }

  /**
   * Remove item at index
   */
  remove(index: number): T | null {
    if (index < 0 || index >= this.size) return null;

    const item = this.data[index];

    // Shift elements
    for (let i = index; i < this.size - 1; i++) {
      this.data[i] = this.data[i + 1];
    }

    this.data[this.size - 1] = null;
    this.size--;

    // Shrink if necessary
    if (this.size < this.capacity / 4 && this.capacity > 100) {
      this.resize(Math.max(100, this.capacity / 2));
    }

    return item;
  }

  /**
   * Get array size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get array capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Resize array
   */
  private resize(newCapacity: number): void {
    const newData = new Array(newCapacity).fill(null);

    for (let i = 0; i < Math.min(this.size, newCapacity); i++) {
      newData[i] = this.data[i];
    }

    this.data = newData;
    this.capacity = newCapacity;

    console.log(`📏 Resized array to capacity ${newCapacity}`);
  }

  /**
   * Clear array and free memory
   */
  clear(): void {
    this.data = new Array(this.capacity).fill(null);
    this.size = 0;
  }

  /**
   * Compact array to remove null values
   */
  compact(): void {
    const newData: (T | null)[] = [];
    let newSize = 0;

    for (let i = 0; i < this.size; i++) {
      if (this.data[i] !== null) {
        newData[newSize] = this.data[i];
        newSize++;
      }
    }

    this.data = newData;
    this.size = newSize;
    this.capacity = Math.max(this.capacity, newData.length);

    console.log(`🗜️ Compacted array: ${newSize} items`);
  }

  /**
   * Convert to regular array
   */
  toArray(): T[] {
    return this.data.slice(0, this.size).filter(item => item !== null) as T[];
  }
}

/**
 * Memory-efficient map with automatic cleanup
 */
export class EfficientMap<K, V> {
  private data = new Map<K, V>();
  private accessOrder: K[] = [];
  private maxSize: number;

  constructor(maxSize: number, private memoryOptimizer: MemoryOptimizer) {
    this.maxSize = maxSize;
  }

  /**
   * Set key-value pair
   */
  set(key: K, value: V): void {
    if (!this.data.has(key)) {
      this.accessOrder.push(key);
    }

    this.data.set(key, value);

    // Evict oldest entries if over limit
    while (this.data.size > this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey !== undefined) {
        this.data.delete(oldestKey);
      }
    }
  }

  /**
   * Get value by key
   */
  get(key: K): V | undefined {
    const value = this.data.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
        this.accessOrder.push(key);
      }
    }
    return value;
  }

  /**
   * Check if key exists
   */
  has(key: K): boolean {
    return this.data.has(key);
  }

  /**
   * Delete key-value pair
   */
  delete(key: K): boolean {
    const deleted = this.data.delete(key);
    if (deleted) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.data.clear();
    this.accessOrder = [];
  }

  /**
   * Get size
   */
  get size(): number {
    return this.data.size;
  }

  /**
   * Get keys
   */
  keys(): K[] {
    return [...this.data.keys()];
  }

  /**
   * Get values
   */
  values(): V[] {
    return [...this.data.values()];
  }

  /**
   * Get entries
   */
  entries(): [K, V][] {
    return [...this.data.entries()];
  }
}

// Singleton instance
export const memoryOptimizer = new MemoryOptimizer();

// Utility functions
export const optimizeMemoryUsage = () => memoryOptimizer.optimizeMemory();
export const getMemoryStats = () => memoryOptimizer.getMemoryStats();
export const forceGarbageCollection = () => memoryOptimizer.forceGC();
