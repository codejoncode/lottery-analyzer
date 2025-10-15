import { z } from 'zod';

// Data validation schemas using Zod for runtime type safety
const DrawResultSchema = z.object({
  drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  numbers: z.array(z.number().int().min(0).max(100)),
  powerball: z.number().int().min(1).max(26).optional(),
  megaBall: z.number().int().min(1).max(25).optional(),
});

const LotteryConfigSchema = z.object({
  baseURL: z.string().url(),
  timeout: z.number().positive().optional().default(10000),
  apiKey: z.string().optional(),
  retryAttempts: z.number().int().min(0).max(5).default(3),
});

export type DrawResult = z.infer<typeof DrawResultSchema>;
export type LotteryConfig = z.infer<typeof LotteryConfigSchema>;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class LotteryAPIService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private config: LotteryConfig;

  constructor(config: LotteryConfig) {
    this.config = LotteryConfigSchema.parse(config);
  }

  async fetchRecentDraws(
    game: 'powerball' | 'megamillions' | 'pick3',
    limit: number = 100
  ): Promise<DrawResult[]> {
    const cacheKey = `${game}-recent-${limit}`;
    const cached = this.getFromCache<DrawResult[]>(cacheKey);
    
    if (cached) return cached;

    const data = await this.makeRequest<DrawResult[]>(
      `/draws/${game}`,
      { params: { limit } }
    );

    const validatedData = z.array(DrawResultSchema).parse(data);
    this.setCache(cacheKey, validatedData);
    
    return validatedData;
  }

  async fetchHistoricalData(
    game: string,
    startDate: string,
    endDate: string
  ): Promise<DrawResult[]> {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const cacheKey = `${game}-${startDate}-${endDate}`;
    const cached = this.getFromCache<DrawResult[]>(cacheKey);
    
    if (cached) return cached;

    const data = await this.makeRequest<DrawResult[]>(
      `/draws/${game}/historical`,
      { params: { startDate, endDate } }
    );

    const validatedData = z.array(DrawResultSchema).parse(data);
    this.setCache(cacheKey, validatedData);
    
    return validatedData;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: { params?: Record<string, string | number> } = {}
  ): Promise<T> {
    const url = new URL(endpoint, this.config.baseURL);
    
    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url.toString(), {
          headers: this.config.apiKey ? { 'X-API-Key': this.config.apiKey } : {},
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() > entry.expiresAt;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    // Implement LRU cache eviction
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        expiresIn: entry.expiresAt - Date.now(),
      })),
    };
  }
}
