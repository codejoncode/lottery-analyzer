import { performanceOptimizer, withPerformanceMonitoring, createLazyLoader } from './performanceOptimizer';

export interface ComboGenerationOptions {
  totalNumbers: number;
  pickCount: number;
  excludeNumbers?: number[];
  includeNumbers?: number[];
  maxCombinations?: number;
  useCache?: boolean;
  batchSize?: number;
}

export interface ComboResult {
  combinations: number[][];
  totalGenerated: number;
  performance: {
    duration: number;
    memoryUsage: number;
    efficiency: number;
  };
}

export class OptimizedComboGenerator {
  private cache = new Map<string, ComboResult>();
  private lazyGenerators = new Map<string, unknown>();

  /**
   * Generate optimized lottery combinations with performance monitoring
   */
  async generateCombinations(options: ComboGenerationOptions): Promise<ComboResult> {
    const {
      totalNumbers,
      pickCount,
      excludeNumbers = [],
      includeNumbers = [],
      maxCombinations = 1000000,
      useCache = true,
      batchSize = 1000
    } = options;

    // Create cache key
    const cacheKey = this.createCacheKey(options);

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log(`📋 Using cached combinations: ${cached.totalGenerated.toLocaleString()}`);
      return cached;
    }

    return withPerformanceMonitoring('ComboGeneration', async () => {
      const combinations: number[][] = [];
      let generated = 0;

      // Calculate theoretical maximum
      const theoreticalMax = this.calculateCombinations(totalNumbers, pickCount);
      const actualMax = Math.min(theoreticalMax, maxCombinations);

      console.log(`🎯 Generating up to ${actualMax.toLocaleString()} combinations from ${totalNumbers} numbers (pick ${pickCount})`);

      // Use optimized recursive generation with constraints
      const generate = (start: number, current: number[], remaining: number): void => {
        // Stop if we've reached the limit
        if (generated >= actualMax) return;

        // Base case: combination complete
        if (remaining === 0) {
          // Check include constraints
          if (includeNumbers.length > 0 && !includeNumbers.every(num => current.includes(num))) {
            return;
          }

          combinations.push([...current]);
          generated++;
          return;
        }

        // Generate next numbers
        for (let i = start; i <= totalNumbers; i++) {
          // Skip excluded numbers
          if (excludeNumbers.includes(i)) continue;

          // Check include constraints early
          if (includeNumbers.length > 0 && remaining === pickCount) {
            const hasRequired = includeNumbers.some(num => current.includes(num) || num >= i);
            if (!hasRequired) continue;
          }

          current.push(i);
          generate(i + 1, current, remaining - 1);
          current.pop();

          // Memory check
          if (generated % batchSize === 0 && performanceOptimizer.getPerformanceSummary().memoryEfficiency < 0.8) {
            console.log(`🔄 Generated ${generated.toLocaleString()} combinations...`);
          }
        }
      };

      // Start generation
      generate(1, [], pickCount);

      const result: ComboResult = {
        combinations,
        totalGenerated: generated,
        performance: {
          duration: 0, // Will be filled by performance monitoring
          memoryUsage: 0,
          efficiency: generated / theoreticalMax
        }
      };

      // Cache result if enabled
      if (useCache && generated > 0) {
        this.cache.set(cacheKey, result);
      }

      console.log(`✅ Generated ${generated.toLocaleString()} combinations (${(result.performance.efficiency * 100).toFixed(2)}% of theoretical maximum)`);

      return result;
    }, {
      totalNumbers,
      pickCount,
      excludeCount: excludeNumbers.length,
      includeCount: includeNumbers.length,
      maxCombinations
    });
  }

  /**
   * Generate combinations with lazy loading for large datasets
   */
  createLazyComboGenerator(options: ComboGenerationOptions) {
    const cacheKey = this.createCacheKey(options);

    if (!this.lazyGenerators.has(cacheKey)) {
      const lazyLoader = createLazyLoader(
        `combo-${cacheKey}`,
        () => this.generateCombinations(options),
        600000 // 10 minutes TTL
      );

      this.lazyGenerators.set(cacheKey, lazyLoader);
    }

    return this.lazyGenerators.get(cacheKey);
  }

  /**
   * Generate combinations in batches for memory efficiency
   */
  async *generateCombinationsBatched(
    options: ComboGenerationOptions,
    batchSize: number = 10000
  ): AsyncGenerator<ComboResult, void, unknown> {
    const {
      totalNumbers,
      pickCount,
      excludeNumbers = [],
      includeNumbers = [],
      maxCombinations = 1000000
    } = options;

    const theoreticalMax = this.calculateCombinations(totalNumbers, pickCount);
    const actualMax = Math.min(theoreticalMax, maxCombinations);

    let generated = 0;
    let batch: number[][] = [];

    console.log(`🔄 Starting batched generation: ${actualMax.toLocaleString()} combinations in batches of ${batchSize}`);

    const generateBatch = (start: number, current: number[], remaining: number): boolean => {
      if (generated >= actualMax) return false;

      if (remaining === 0) {
        if (includeNumbers.length === 0 || includeNumbers.every(num => current.includes(num))) {
          batch.push([...current]);
          generated++;
        }
        return batch.length >= batchSize;
      }

      for (let i = start; i <= totalNumbers; i++) {
        if (excludeNumbers.includes(i)) continue;

        current.push(i);
        if (generateBatch(i + 1, current, remaining - 1)) {
          current.pop();
          return true;
        }
        current.pop();
      }

      return false;
    };

    let startNum = 1;
    let current: number[] = [];

    while (generated < actualMax) {
      batch = [];
      const shouldYield = generateBatch(startNum, current, pickCount);

      if (batch.length > 0) {
        const batchResult: ComboResult = {
          combinations: batch,
          totalGenerated: batch.length,
          performance: {
            duration: 0,
            memoryUsage: 0,
            efficiency: batch.length / batchSize
          }
        };

        yield batchResult;

        console.log(`📦 Yielded batch: ${batch.length} combinations (${generated.toLocaleString()} total)`);
      }

      if (!shouldYield) break;

      // Move to next starting point (this is a simplified approach)
      startNum++;
      if (startNum > totalNumbers - pickCount + 1) break;
    }
  }

  /**
   * Generate combinations using parallel processing for large datasets
   */
  async generateCombinationsParallel(
    options: ComboGenerationOptions,
    workerCount: number = 4
  ): Promise<ComboResult> {
    const {
      totalNumbers,
      pickCount,
      excludeNumbers = [],
      includeNumbers = [],
      maxCombinations = 1000000
    } = options;

    const theoreticalMax = this.calculateCombinations(totalNumbers, pickCount);
    if (theoreticalMax < 10000) {
      // For small datasets, use regular generation
      return this.generateCombinations(options);
    }

    return withPerformanceMonitoring('ParallelComboGeneration', async () => {
      // Divide the number range into chunks for parallel processing
      const chunkSize = Math.ceil(totalNumbers / workerCount);
      const chunks: Array<{ start: number; end: number }> = [];

      for (let i = 0; i < workerCount; i++) {
        const start = i * chunkSize + 1;
        const end = Math.min((i + 1) * chunkSize, totalNumbers);
        chunks.push({ start, end });
      }

      // Generate combinations for each chunk in parallel
      const chunkPromises = chunks.map(async (chunk, index) => {
        const chunkOptions: ComboGenerationOptions = {
          ...options,
          totalNumbers: chunk.end,
          // Adjust constraints for this chunk
          excludeNumbers: excludeNumbers.filter(n => n < chunk.start || n > chunk.end),
          includeNumbers: includeNumbers.filter(n => n >= chunk.start && n <= chunk.end)
        };

        // For chunks after the first, we need to ensure combinations include numbers from previous chunks
        if (index > 0) {
          chunkOptions.includeNumbers = includeNumbers;
        }

        return this.generateCombinations({
          ...chunkOptions,
          maxCombinations: Math.ceil(maxCombinations / workerCount)
        });
      });

      const chunkResults = await Promise.all(chunkPromises);

      // Combine results
      const allCombinations: number[][] = [];

      for (const result of chunkResults) {
        // Filter combinations to ensure they meet global constraints
        const validCombos = result.combinations.filter(combo => {
          // Must include all required numbers
          if (includeNumbers.length > 0 && !includeNumbers.every(num => combo.includes(num))) {
            return false;
          }
          // Must not include excluded numbers
          if (excludeNumbers.length > 0 && excludeNumbers.some(num => combo.includes(num))) {
            return false;
          }
          return true;
        });

        allCombinations.push(...validCombos);
      }

      // Remove duplicates (can happen with overlapping chunks)
      const uniqueCombinations = this.removeDuplicateCombinations(allCombinations);

      const result: ComboResult = {
        combinations: uniqueCombinations.slice(0, maxCombinations),
        totalGenerated: Math.min(uniqueCombinations.length, maxCombinations),
        performance: {
          duration: 0,
          memoryUsage: 0,
          efficiency: uniqueCombinations.length / theoreticalMax
        }
      };

      console.log(`🔄 Parallel generation complete: ${result.totalGenerated.toLocaleString()} unique combinations`);

      return result;
    }, {
      workerCount,
      totalNumbers,
      pickCount
    });
  }

  /**
   * Remove duplicate combinations from array
   */
  private removeDuplicateCombinations(combinations: number[][]): number[][] {
    const seen = new Set<string>();
    const unique: number[][] = [];

    for (const combo of combinations) {
      const key = combo.sort((a, b) => a - b).join(',');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(combo);
      }
    }

    return unique;
  }

  /**
   * Create cache key from options
   */
  private createCacheKey(options: ComboGenerationOptions): string {
    const {
      totalNumbers,
      pickCount,
      excludeNumbers = [],
      includeNumbers = [],
      maxCombinations = 1000000
    } = options;

    return `${totalNumbers}-${pickCount}-${excludeNumbers.sort().join(',')}-${includeNumbers.sort().join(',')}-${maxCombinations}`;
  }

  /**
   * Calculate number of combinations (n choose k)
   */
  private calculateCombinations(n: number, k: number): number {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;

    // Use multiplicative formula to avoid large intermediate results
    let result = 1;
    for (let i = 1; i <= k; i++) {
      result = result * (n - k + i) / i;
    }

    return Math.round(result);
  }

  /**
   * Clear cache and lazy loaders
   */
  clearCache(): void {
    this.cache.clear();
    this.lazyGenerators.clear();
    console.log('🗑️ Combo generator cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cachedResults: number;
    lazyGenerators: number;
    totalMemoryUsage: number;
  } {
    return {
      cachedResults: this.cache.size,
      lazyGenerators: this.lazyGenerators.size,
      totalMemoryUsage: this.cache.size * 1000 // Rough estimate
    };
  }
}

// Singleton instance
export const comboGenerator = new OptimizedComboGenerator();

// Utility functions
export const generatePowerballCombos = async (
  options: Partial<ComboGenerationOptions> = {}
): Promise<ComboResult> => {
  return comboGenerator.generateCombinations({
    totalNumbers: 69,
    pickCount: 5,
    ...options
  });
};

export const generateMegaMillionsCombos = async (
  options: Partial<ComboGenerationOptions> = {}
): Promise<ComboResult> => {
  return comboGenerator.generateCombinations({
    totalNumbers: 70,
    pickCount: 5,
    ...options
  });
};
