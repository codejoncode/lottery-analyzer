import type {
  Combination,
  CacheEntry,
  CacheStatistics,
  CombinationScoresCache,
  FilterResultsCache,
  StatisticsCache,
  DebugData
} from '../prediction-engine/types';

/**
 * Result Cache
 * Caches computed results for expensive operations
 */
export class ResultCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  private readonly maxSize: number;
  private readonly maxMemory: number; // Max memory usage in bytes
  private currentMemory: number = 0;
  private readonly ttl: number;

  constructor(maxSize: number = 500, maxMemory: number = 50 * 1024 * 1024, ttl: number = 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.maxMemory = maxMemory;
    this.ttl = ttl;
  }

  /**
   * Generate cache key for different types of results
   */
  private generateKey(type: string, params: unknown): string {
    const paramStr = typeof params === 'object' ? JSON.stringify(params) : String(params);
    return `${type}:${paramStr}`;
  }

  /**
   * Estimate size of cached item in bytes
   */
  private estimateSize(item: unknown): number {
    const str = JSON.stringify(item);
    return str.length * 2; // Rough estimate: 2 bytes per character
  }

  /**
   * Store result in cache
   */
  set<T>(type: string, params: unknown, result: T): void {
    const key = this.generateKey(type, params);
    const now = Date.now();
    const size = this.estimateSize(result);

    // Check memory limits
    if (this.currentMemory + size > this.maxMemory) {
      this.evictByMemory(size);
    }

    // Check size limits
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Remove existing entry if it exists
    const existing = this.cache.get(key);
    if (existing) {
      this.currentMemory -= existing.size;
    }

    this.cache.set(key, {
      result,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
      size
    });

    this.currentMemory += size;
  }

  /**
   * Retrieve result from cache
   */
  get<T>(type: string, params: unknown): T | null {
    const key = this.generateKey(type, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.currentMemory -= entry.size;
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.result as T;
  }

  /**
   * Check if result exists in cache
   */
  has(type: string, params: unknown): boolean {
    const key = this.generateKey(type, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.currentMemory -= entry.size;
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Evict entries to free up memory for new item
   */
  private evictByMemory(requiredSize: number): void {
    const entries = Array.from(this.cache.entries());

    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let freedMemory = 0;
    const keysToRemove: string[] = [];

    for (const [key, entry] of entries) {
      if (freedMemory >= requiredSize) break;

      keysToRemove.push(key);
      freedMemory += entry.size;
    }

    keysToRemove.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.currentMemory -= entry.size;
        this.cache.delete(key);
      }
    });
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      const entry = this.cache.get(lruKey);
      if (entry) {
        this.currentMemory -= entry.size;
        this.cache.delete(lruKey);
      }
    }
  }

  /**
   * Specialized methods for different result types
   */

  // Cache combination scoring results
  setCombinationScores(combinations: number[][], scores: Combination[]): void {
    const key = `combo-scores:${JSON.stringify(combinations).slice(0, 100)}`;
    this.set('combination-scores', key, { combinations, scores });
  }

  getCombinationScores(combinations: number[][]): Combination[] | null {
    const key = `combo-scores:${JSON.stringify(combinations).slice(0, 100)}`;
    const cached = this.get<CombinationScoresCache>('combination-scores', key);
    return cached ? cached.scores : null;
  }

  // Cache filter application results
  setFilterResults(combinations: number[][], filters: string[], filtered: number[][]): void {
    const key = `filter-results:${filters.join(',')}:${combinations.length}`;
    this.set('filter-results', key, { combinations, filters, filtered });
  }

  getFilterResults(combinations: number[][], filters: string[]): number[][] | null {
    const key = `filter-results:${filters.join(',')}:${combinations.length}`;
    const cached = this.get<FilterResultsCache>('filter-results', key);
    return cached ? cached.filtered : null;
  }

  // Cache analysis results
  setAnalysisResult(analysisType: string, params: unknown, result: unknown): void {
    this.set(`analysis-${analysisType}`, params, result);
  }

  getAnalysisResult(analysisType: string, params: unknown): unknown | null {
    return this.get(`analysis-${analysisType}`, params);
  }

  // Cache statistical computations
  setStatistics(key: string, data: number[], stats: unknown): void {
    this.set('statistics', { key, dataLength: data.length }, { data, stats });
  }

  getStatistics(key: string, data: number[]): unknown | null {
    const cached = this.get<StatisticsCache>('statistics', { key, dataLength: data.length });
    return cached ? cached.stats : null;
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear();
    this.currentMemory = 0;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key);
        this.currentMemory -= entry.size;
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStatistics {
    const now = Date.now();
    let totalAccesses = 0;
    let totalHits = 0;
    let totalAge = 0;
    const typeDistribution: { [type: string]: number } = {};

    for (const [key, entry] of this.cache.entries()) {
      totalAccesses += entry.accessCount;
      totalHits += entry.accessCount > 0 ? 1 : 0;
      totalAge += now - entry.timestamp;

      // Count by type
      const type = key.split(':')[0];
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    }

    const hitRate = totalAccesses > 0 ? totalHits / this.cache.size : 0;
    const averageAge = this.cache.size > 0 ? totalAge / this.cache.size : 0;
    const memoryUsagePercent = (this.currentMemory / this.maxMemory) * 100;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: this.currentMemory,
      maxMemory: this.maxMemory,
      memoryUsagePercent,
      hitRate,
      totalAccesses,
      totalHits,
      averageAge,
      typeDistribution
    };
  }

  /**
   * Optimize cache by removing low-value entries
   */
  optimize(): { removed: number; kept: number; memoryFreed: number } {
    const entries = Array.from(this.cache.entries());

    // Remove entries that haven't been accessed recently
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    let removed = 0;
    let memoryFreed = 0;
    const keysToRemove: string[] = [];

    for (const [key, entry] of entries) {
      let shouldRemove = false;

      // Remove if not accessed in 24 hours and accessed only once
      if (entry.lastAccessed < oneDayAgo && entry.accessCount <= 1) {
        shouldRemove = true;
      }
      // Remove if not accessed in 1 hour and size is large
      else if (entry.lastAccessed < oneHourAgo && entry.size > 10000) {
        shouldRemove = true;
      }

      if (shouldRemove) {
        keysToRemove.push(key);
        removed++;
        memoryFreed += entry.size;
      }
    }

    keysToRemove.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.currentMemory -= entry.size;
        this.cache.delete(key);
      }
    });

    return { removed, kept: this.cache.size, memoryFreed };
  }

  /**
   * Export cache data for debugging
   */
  exportDebugData(): DebugData {
    const debugData: DebugData = {
      stats: this.getStats(),
      entries: []
    };

    for (const [key, entry] of this.cache.entries()) {
      debugData.entries.push({
        key,
        type: key.split(':')[0],
        timestamp: entry.timestamp,
        lastAccessed: entry.lastAccessed,
        accessCount: entry.accessCount,
        size: entry.size,
        age: Date.now() - entry.timestamp
      });
    }

    return debugData;
  }
}
