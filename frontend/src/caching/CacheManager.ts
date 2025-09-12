import { PredictionCache } from './PredictionCache';
import { ResultCache } from './ResultCache';

/**
 * Cache Manager
 * Orchestrates all caching operations in the system
 */
export class CacheManager {
  private predictionCache: PredictionCache;
  private resultCache: ResultCache;
  private isEnabled: boolean = true;
  private autoSave: boolean = true;
  private lastSave: number = 0;
  private readonly saveInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor(options: {
    predictionCacheSize?: number;
    predictionCacheTTL?: number;
    resultCacheSize?: number;
    resultCacheMemory?: number;
    resultCacheTTL?: number;
    autoSave?: boolean;
  } = {}) {
    const {
      predictionCacheSize = 1000,
      predictionCacheTTL = 30 * 60 * 1000, // 30 minutes
      resultCacheSize = 500,
      resultCacheMemory = 50 * 1024 * 1024, // 50MB
      resultCacheTTL = 60 * 60 * 1000, // 1 hour
      autoSave = true
    } = options;

    this.predictionCache = new PredictionCache(predictionCacheSize, predictionCacheTTL);
    this.resultCache = new ResultCache(resultCacheSize, resultCacheMemory, resultCacheTTL);
    this.autoSave = autoSave;

    // Load cached data on initialization
    this.loadFromStorage();

    // Set up periodic cleanup
    this.setupPeriodicCleanup();

    // Set up auto-save if enabled
    if (this.autoSave) {
      this.setupAutoSave();
    }
  }

  /**
   * Prediction cache operations
   */
  getPrediction(options: any): any {
    if (!this.isEnabled) return null;
    return this.predictionCache.get(options);
  }

  setPrediction(options: any, result: any): void {
    if (!this.isEnabled) return;
    this.predictionCache.set(options, result);
    this.checkAutoSave();
  }

  hasPrediction(options: any): boolean {
    if (!this.isEnabled) return false;
    return this.predictionCache.has(options);
  }

  /**
   * Result cache operations
   */
  getResult(type: string, params: any): any {
    if (!this.isEnabled) return null;
    return this.resultCache.get(type, params);
  }

  setResult(type: string, params: any, result: any): void {
    if (!this.isEnabled) return;
    this.resultCache.set(type, params, result);
    this.checkAutoSave();
  }

  hasResult(type: string, params: any): boolean {
    if (!this.isEnabled) return false;
    return this.resultCache.has(type, params);
  }

  /**
   * Specialized result cache methods
   */
  setCombinationScores(combinations: number[][], scores: any): void {
    if (!this.isEnabled) return;
    this.resultCache.setCombinationScores(combinations, scores);
    this.checkAutoSave();
  }

  getCombinationScores(combinations: number[][]): any {
    if (!this.isEnabled) return null;
    return this.resultCache.getCombinationScores(combinations);
  }

  setFilterResults(combinations: number[][], filters: string[], filtered: number[][]): void {
    if (!this.isEnabled) return;
    this.resultCache.setFilterResults(combinations, filters, filtered);
    this.checkAutoSave();
  }

  getFilterResults(combinations: number[][], filters: string[]): number[][] | null {
    if (!this.isEnabled) return null;
    return this.resultCache.getFilterResults(combinations, filters);
  }

  setAnalysisResult(analysisType: string, params: any, result: any): void {
    if (!this.isEnabled) return;
    this.resultCache.setAnalysisResult(analysisType, params, result);
    this.checkAutoSave();
  }

  getAnalysisResult(analysisType: string, params: any): any {
    if (!this.isEnabled) return null;
    return this.resultCache.getAnalysisResult(analysisType, params);
  }

  setStatistics(key: string, data: number[], stats: any): void {
    if (!this.isEnabled) return;
    this.resultCache.setStatistics(key, data, stats);
    this.checkAutoSave();
  }

  getStatistics(key: string, data: number[]): any {
    if (!this.isEnabled) return null;
    return this.resultCache.getStatistics(key, data);
  }

  /**
   * Cache management operations
   */
  clearAll(): void {
    this.predictionCache.clear();
    this.resultCache.clear();
    this.saveToStorage();
  }

  clearExpired(): void {
    this.predictionCache.clear();
    this.resultCache.clearExpired();
  }

  optimize(): {
    predictionCache: { removed: number; kept: number };
    resultCache: { removed: number; kept: number; memoryFreed: number };
  } {
    const predictionResult = this.predictionCache.optimize();
    const resultResult = this.resultCache.optimize();

    this.saveToStorage();

    return {
      predictionCache: predictionResult,
      resultCache: resultResult
    };
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): {
    isEnabled: boolean;
    predictionCache: any;
    resultCache: any;
    overall: {
      totalEntries: number;
      totalMemory: number;
      hitRate: number;
      lastOptimized: number;
    };
  } {
    const predictionStats = this.predictionCache.getStats();
    const resultStats = this.resultCache.getStats();

    const totalEntries = predictionStats.size + resultStats.size;
    const totalMemory = resultStats.memoryUsage; // Prediction cache doesn't track memory
    const totalAccesses = predictionStats.totalAccesses + resultStats.totalAccesses;
    const totalHits = predictionStats.totalHits + resultStats.totalHits;
    const hitRate = totalAccesses > 0 ? totalHits / totalEntries : 0;

    return {
      isEnabled: this.isEnabled,
      predictionCache: predictionStats,
      resultCache: resultStats,
      overall: {
        totalEntries,
        totalMemory,
        hitRate,
        lastOptimized: this.lastSave
      }
    };
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      console.log('Cache disabled - all operations will bypass cache');
    } else {
      console.log('Cache enabled');
    }
  }

  /**
   * Storage operations
   */
  saveToStorage(): void {
    try {
      const cacheData = {
        predictionCache: this.predictionCache.exportData(),
        resultCache: this.resultCache.exportDebugData(),
        metadata: {
          savedAt: Date.now(),
          version: '1.0',
          isEnabled: this.isEnabled
        }
      };

      const serialized = JSON.stringify(cacheData);
      localStorage.setItem('apexScoop_cache', serialized);
      this.lastSave = Date.now();

      console.log(`Cache saved to storage (${serialized.length} bytes)`);
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  loadFromStorage(): void {
    try {
      const serialized = localStorage.getItem('apexScoop_cache');
      if (!serialized) {
        console.log('No cached data found in storage');
        return;
      }

      const cacheData = JSON.parse(serialized);

      if (cacheData.predictionCache) {
        const result = this.predictionCache.importData(cacheData.predictionCache);
        console.log(`Loaded ${result.imported} prediction cache entries`);
      }

      // Note: ResultCache doesn't have import functionality in this implementation
      // You could add it if needed

      if (cacheData.metadata) {
        this.isEnabled = cacheData.metadata.isEnabled !== false;
        this.lastSave = cacheData.metadata.savedAt || 0;
      }

      console.log('Cache loaded from storage');
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  /**
   * Check if auto-save should be triggered
   */
  private checkAutoSave(): void {
    if (this.autoSave && Date.now() - this.lastSave > this.saveInterval) {
      this.saveToStorage();
    }
  }

  /**
   * Set up periodic cleanup of expired entries
   */
  private setupPeriodicCleanup(): void {
    // Clean up expired entries every 10 minutes
    setInterval(() => {
      if (this.isEnabled) {
        this.clearExpired();
      }
    }, 10 * 60 * 1000);
  }

  /**
   * Set up auto-save functionality
   */
  private setupAutoSave(): void {
    // Auto-save every 5 minutes
    setInterval(() => {
      if (this.isEnabled) {
        this.saveToStorage();
      }
    }, this.saveInterval);
  }

  /**
   * Export cache data for backup/debugging
   */
  exportData(): string {
    const exportData = {
      predictionCache: this.predictionCache.exportData(),
      resultCache: this.resultCache.exportDebugData(),
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get cache keys for debugging
   */
  getDebugInfo(): {
    predictionKeys: string[];
    resultCacheStats: any;
    memoryUsage: string;
    lastSave: string;
  } {
    const stats = this.getStats();
    const memoryUsage = `${(stats.resultCache.memoryUsage / 1024 / 1024).toFixed(2)} MB`;

    return {
      predictionKeys: this.predictionCache.getKeys(),
      resultCacheStats: stats.resultCache,
      memoryUsage,
      lastSave: this.lastSave > 0 ? new Date(this.lastSave).toISOString() : 'Never'
    };
  }

  /**
   * Reset cache to factory defaults
   */
  reset(): void {
    this.predictionCache.clear();
    this.resultCache.clear();
    this.lastSave = 0;

    // Clear storage
    try {
      localStorage.removeItem('apexScoop_cache');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }

    console.log('Cache reset to factory defaults');
  }
}
