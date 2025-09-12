import type { Combination, PredictionResult } from '../prediction-engine/types';

/**
 * Prediction Cache
 * Caches prediction results to avoid recomputation
 */
export class PredictionCache {
  private cache: Map<string, {
    result: PredictionResult;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
  }> = new Map();

  private readonly maxSize: number;
  private readonly ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 1000, ttl: number = 30 * 60 * 1000) { // 30 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Generate cache key from prediction parameters
   */
  private generateKey(options: {
    enabledFilters?: string[];
    maxCombinations?: number;
    minScore?: number;
    scoringWeights?: any;
  }): string {
    const {
      enabledFilters = [],
      maxCombinations = 100,
      minScore = 0,
      scoringWeights
    } = options;

    // Create a deterministic key from parameters
    const keyParts = [
      enabledFilters.sort().join(','),
      maxCombinations.toString(),
      minScore.toString(),
      scoringWeights ? JSON.stringify(scoringWeights) : 'default'
    ];

    return keyParts.join('|');
  }

  /**
   * Store prediction result in cache
   */
  set(options: Parameters<PredictionCache['generateKey']>[0], result: PredictionResult): void {
    const key = this.generateKey(options);
    const now = Date.now();

    // Evict expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictExpired();
    }

    // If still at max size, evict least recently used
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      result,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now
    });
  }

  /**
   * Retrieve prediction result from cache
   */
  get(options: Parameters<PredictionCache['generateKey']>[0]): PredictionResult | null {
    const key = this.generateKey(options);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.result;
  }

  /**
   * Check if result exists in cache and is valid
   */
  has(options: Parameters<PredictionCache['generateKey']>[0]): boolean {
    const key = this.generateKey(options);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove expired entries
   */
  private evictExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
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
      this.cache.delete(lruKey);
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccesses: number;
    totalHits: number;
    averageAge: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const now = Date.now();
    let totalAccesses = 0;
    let totalHits = 0;
    let totalAge = 0;
    let oldestEntry = now;
    let newestEntry = 0;

    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      totalHits += entry.accessCount > 0 ? 1 : 0;
      totalAge += now - entry.timestamp;
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
    }

    const hitRate = totalAccesses > 0 ? totalHits / this.cache.size : 0;
    const averageAge = this.cache.size > 0 ? totalAge / this.cache.size : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      totalAccesses,
      totalHits,
      averageAge,
      oldestEntry: now - oldestEntry,
      newestEntry: now - newestEntry
    };
  }

  /**
   * Get cache keys for debugging
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Export cache data for persistence
   */
  exportData(): string {
    const exportData: Array<{
      key: string;
      result: PredictionResult;
      timestamp: number;
      accessCount: number;
      lastAccessed: number;
    }> = [];

    for (const [key, entry] of this.cache.entries()) {
      exportData.push({
        key,
        result: entry.result,
        timestamp: entry.timestamp,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      });
    }

    return JSON.stringify({
      exportData,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        ttl: this.ttl,
        maxSize: this.maxSize
      }
    });
  }

  /**
   * Import cache data from persistence
   */
  importData(jsonData: string): { imported: number; skipped: number; errors: number } {
    try {
      const data = JSON.parse(jsonData);
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      if (data.exportData && Array.isArray(data.exportData)) {
        const now = Date.now();

        for (const item of data.exportData) {
          try {
            // Check if entry has expired
            if (now - item.timestamp > this.ttl) {
              skipped++;
              continue;
            }

            // Validate entry structure
            if (!item.key || !item.result || typeof item.timestamp !== 'number') {
              errors++;
              continue;
            }

            this.cache.set(item.key, {
              result: item.result,
              timestamp: item.timestamp,
              accessCount: item.accessCount || 0,
              lastAccessed: item.lastAccessed || item.timestamp
            });

            imported++;
          } catch (error) {
            errors++;
            console.warn('Error importing cache entry:', error);
          }
        }
      }

      return { imported, skipped, errors };
    } catch (error) {
      console.error('Error importing cache data:', error);
      return { imported: 0, skipped: 0, errors: 1 };
    }
  }

  /**
   * Optimize cache by removing low-access entries
   */
  optimize(): { removed: number; kept: number } {
    const entries = Array.from(this.cache.entries());
    const accessCounts = entries.map(([_, entry]) => entry.accessCount);

    if (accessCounts.length === 0) {
      return { removed: 0, kept: 0 };
    }

    // Calculate median access count
    accessCounts.sort((a, b) => a - b);
    const medianAccess = accessCounts[Math.floor(accessCounts.length / 2)];

    // Remove entries with access count below median
    let removed = 0;
    const keysToRemove: string[] = [];

    for (const [key, entry] of entries) {
      if (entry.accessCount < medianAccess) {
        keysToRemove.push(key);
        removed++;
      }
    }

    keysToRemove.forEach(key => this.cache.delete(key));

    return { removed, kept: this.cache.size };
  }
}
