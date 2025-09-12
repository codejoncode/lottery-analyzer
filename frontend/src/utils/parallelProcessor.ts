import { processInParallel, withPerformanceMonitoring } from '../utils/performanceOptimizer';

export interface ParallelProcessingOptions {
  concurrency?: number;
  batchSize?: number;
  timeout?: number;
  retryCount?: number;
  enableProgress?: boolean;
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: Error, item: any) => void;
}

export interface ParallelResult<T, R> {
  results: R[];
  errors: Array<{ item: T; error: Error }>;
  successful: number;
  failed: number;
  duration: number;
  throughput: number; // items per second
}

/**
 * Parallel processor for heavy computations with performance monitoring
 */
export class ParallelProcessor {
  private activeTasks = new Set<Promise<any>>();
  private abortController = new AbortController();

  /**
   * Process items in parallel with comprehensive error handling and monitoring
   */
  async processItems<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: ParallelProcessingOptions = {}
  ): Promise<ParallelResult<T, R>> {
    const {
      concurrency = navigator.hardwareConcurrency || 4,
      batchSize = 10,
      timeout = 30000,
      retryCount = 2,
      enableProgress = false,
      onProgress,
      onError
    } = options;

    const startTime = Date.now();
    const results: R[] = [];
    const errors: Array<{ item: T; error: Error }> = [];
    let completed = 0;

    console.log(`🔄 Starting parallel processing: ${items.length} items with concurrency ${concurrency}`);

    return withPerformanceMonitoring('ParallelProcessing', async () => {
      // Process in batches to avoid overwhelming the system
      const batches = this.createBatches(items, batchSize);

      for (const batch of batches) {
        if (this.abortController.signal.aborted) {
          console.warn('Parallel processing aborted');
          break;
        }

        const batchPromises = batch.map(async (item, batchIndex) => {
          const globalIndex = completed + batchIndex;

          try {
            const result = await this.processWithTimeoutAndRetry(
              item,
              () => processor(item, globalIndex),
              timeout,
              retryCount
            );

            results.push(result);
            completed++;

            if (enableProgress && onProgress) {
              onProgress(completed, items.length);
            }

            return result;
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            errors.push({ item, error: err });

            if (onError) {
              onError(err, item);
            }

            completed++;
            return null;
          }
        });

        // Wait for batch to complete
        await Promise.allSettled(batchPromises);

        // Brief pause between batches to prevent overwhelming
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const duration = Date.now() - startTime;
      const throughput = items.length / (duration / 1000);

      const finalResult: ParallelResult<T, R> = {
        results: results.filter(r => r !== null) as R[],
        errors,
        successful: results.length,
        failed: errors.length,
        duration,
        throughput
      };

      console.log(`✅ Parallel processing complete: ${finalResult.successful} successful, ${finalResult.failed} failed`);
      console.log(`⚡ Throughput: ${throughput.toFixed(2)} items/second`);

      return finalResult;
    }, {
      itemCount: items.length,
      concurrency,
      batchSize
    });
  }

  /**
   * Process with timeout and retry logic
   */
  private async processWithTimeoutAndRetry<T, R>(
    item: T,
    processor: () => Promise<R>,
    timeout: number,
    retryCount: number
  ): Promise<R> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await this.withTimeout(processor(), timeout);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < retryCount) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Add timeout to a promise
   */
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  /**
   * Create batches from items array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process items with priority queue (high priority items processed first)
   */
  async processWithPriority<T, R>(
    items: Array<{ item: T; priority: number }>,
    processor: (item: T, index: number) => Promise<R>,
    options: ParallelProcessingOptions = {}
  ): Promise<ParallelResult<T, R>> {
    // Sort by priority (higher priority first)
    const sortedItems = items.sort((a, b) => b.priority - a.priority);
    const processedItems = sortedItems.map(({ item }) => item);

    return this.processItems(processedItems, processor, options);
  }

  /**
   * Process items with load balancing across virtual workers
   */
  async processWithLoadBalancing<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: ParallelProcessingOptions & {
      workerCount?: number;
      loadBalanceThreshold?: number;
    } = {}
  ): Promise<ParallelResult<T, R>> {
    const { workerCount = navigator.hardwareConcurrency || 4, loadBalanceThreshold = 0.8, ...baseOptions } = options;

    console.log(`⚖️ Load balancing across ${workerCount} virtual workers`);

    // Create virtual workers
    const workers: Array<{ id: number; queue: T[]; activeTasks: number }> = [];
    for (let i = 0; i < workerCount; i++) {
      workers.push({ id: i, queue: [], activeTasks: 0 });
    }

    // Distribute items to workers
    items.forEach((item, index) => {
      const workerIndex = index % workerCount;
      workers[workerIndex].queue.push(item);
    });

    // Process with each worker
    const workerPromises = workers.map(async (worker) => {
      const workerResults: R[] = [];
      const workerErrors: Array<{ item: T; error: Error }> = [];

      for (const item of worker.queue) {
        try {
          const result = await processor(item, 0); // Index not meaningful in parallel
          workerResults.push(result);
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error');
          workerErrors.push({ item, error: err });
        }
      }

      return { results: workerResults, errors: workerErrors };
    });

    const workerResults = await Promise.all(workerPromises);

    // Combine results
    const allResults: R[] = [];
    const allErrors: Array<{ item: T; error: Error }> = [];

    workerResults.forEach(({ results, errors }) => {
      allResults.push(...results);
      allErrors.push(...errors);
    });

    return {
      results: allResults,
      errors: allErrors,
      successful: allResults.length,
      failed: allErrors.length,
      duration: 0, // Would need to track this properly
      throughput: items.length / 1 // Placeholder
    };
  }

  /**
   * Abort all active processing
   */
  abort(): void {
    this.abortController.abort();
    console.log('🛑 Parallel processing aborted');
  }

  /**
   * Get current processing status
   */
  getStatus(): {
    activeTasks: number;
    isAborted: boolean;
  } {
    return {
      activeTasks: this.activeTasks.size,
      isAborted: this.abortController.signal.aborted
    };
  }

  /**
   * Reset processor state
   */
  reset(): void {
    this.abortController = new AbortController();
    this.activeTasks.clear();
  }
}

// Singleton instance
export const parallelProcessor = new ParallelProcessor();

// Utility functions for common parallel processing patterns

/**
 * Parallel processing for array mapping
 */
export async function parallelMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  options?: ParallelProcessingOptions
): Promise<R[]> {
  const result = await parallelProcessor.processItems(items, mapper, options);
  return result.results;
}

/**
 * Parallel processing for array filtering
 */
export async function parallelFilter<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  options?: ParallelProcessingOptions
): Promise<T[]> {
  const results = await parallelMap(
    items,
    async (item, index) => ({ item, passes: await predicate(item, index) }),
    options
  );

  return results.filter(result => result.passes).map(result => result.item);
}

/**
 * Parallel processing for finding first match
 */
export async function parallelFind<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  options?: ParallelProcessingOptions
): Promise<T | undefined> {
  const result = await parallelProcessor.processItems(
    items,
    async (item, index) => ({ item, matches: await predicate(item, index) }),
    { ...options, concurrency: Math.min(items.length, options?.concurrency || 4) }
  );

  const match = result.results.find(r => r.matches);
  return match?.item;
}

/**
 * Parallel processing for reducing array
 */
export async function parallelReduce<T, R>(
  items: T[],
  reducer: (accumulator: R, item: T, index: number) => Promise<R>,
  initialValue: R,
  options?: ParallelProcessingOptions
): Promise<R> {
  // For reduction, we need to process sequentially to maintain order
  // But we can still use parallel processing for independent operations
  let accumulator = initialValue;

  for (const item of items) {
    accumulator = await reducer(accumulator, item, 0);
  }

  return accumulator;
}

/**
 * Parallel batch processing for large datasets
 */
export async function parallelBatchProcess<T, R>(
  items: T[],
  batchProcessor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100,
  options?: ParallelProcessingOptions
): Promise<R[]> {
  const batches = parallelProcessor['createBatches'](items, batchSize);
  const batchResults = await parallelMap(batches, batchProcessor, options);
  return batchResults.flat();
}
