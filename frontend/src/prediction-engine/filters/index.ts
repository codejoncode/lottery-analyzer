import type { Draw } from '../../utils/scoringSystem';
import type {
  PredictionFilter,
  SumFilterConfig,
  ParityFilterConfig,
  SkipFilterConfig,
  DigitFilterConfig,
  HighLowFilterConfig,
  FilterConfig
} from '../types';

/**
 * Sum Filter - Filters combinations based on sum range
 */
export class SumFilter implements PredictionFilter<SumFilterConfig> {
  id = 'sum-filter';
  name = 'Sum Range Filter';
  description = 'Filter combinations based on total sum range';
  category = 'basic' as const;

  private config: SumFilterConfig = {
    enabled: true,
    minSum: 100,
    maxSum: 250,
    targetSum: 175
  };

  apply(combinations: number[][], draws: Draw[]): number[][] {
    if (!this.config.enabled) return combinations;

    return combinations.filter(combo => {
      const sum = combo.reduce((acc, num) => acc + num, 0);
      return sum >= this.config.minSum && sum <= this.config.maxSum;
    });
  }

  getConfig(): SumFilterConfig {
    return { ...this.config };
  }

  setConfig(config: SumFilterConfig): void {
    this.config = { ...config };
  }

  validateConfig(config: SumFilterConfig): boolean {
    return config.minSum >= 15 && // 1+2+3+4+5 minimum
           config.maxSum <= 335 && // 65+66+67+68+69 maximum
           config.minSum < config.maxSum;
  }
}

/**
 * Parity Filter - Filters based on odd/even balance
 */
export class ParityFilter implements PredictionFilter<ParityFilterConfig> {
  id = 'parity-filter';
  name = 'Odd/Even Balance Filter';
  description = 'Filter combinations based on odd/even number balance';
  category = 'basic' as const;

  private config: ParityFilterConfig = {
    enabled: true,
    minOdd: 1,
    maxOdd: 4,
    targetRatio: 0.4 // 40% odd numbers
  };

  apply(combinations: number[][], draws: Draw[]): number[][] {
    if (!this.config.enabled) return combinations;

    return combinations.filter(combo => {
      const oddCount = combo.filter(num => num % 2 === 1).length;
      return oddCount >= this.config.minOdd && oddCount <= this.config.maxOdd;
    });
  }

  getConfig(): ParityFilterConfig {
    return { ...this.config };
  }

  setConfig(config: ParityFilterConfig): void {
    this.config = { ...config };
  }

  validateConfig(config: ParityFilterConfig): boolean {
    return config.minOdd >= 0 && config.maxOdd <= 5 && config.minOdd <= config.maxOdd;
  }
}

/**
 * Skip Count Filter - Filters based on how long numbers have been out
 */
export class SkipFilter implements PredictionFilter<SkipFilterConfig> {
  id = 'skip-filter';
  name = 'Skip Count Filter';
  description = 'Filter combinations based on number skip counts';
  category = 'advanced' as const;

  private config: SkipFilterConfig = {
    enabled: true,
    maxSkipCount: 50,
    minSkipCount: 0,
    hotThreshold: 5,
    coldThreshold: 30
  };

  apply(combinations: number[][], draws: Draw[]): number[][] {
    if (!this.config.enabled) return combinations;

    // Calculate current skip counts
    const skipCounts = this.calculateSkipCounts(draws);

    return combinations.filter(combo => {
      return combo.every(num => {
        const skipCount = skipCounts.get(num) || 0;
        return skipCount >= this.config.minSkipCount && skipCount <= this.config.maxSkipCount;
      });
    });
  }

  private calculateSkipCounts(draws: Draw[]): Map<number, number> {
    const skipCounts = new Map<number, number>();
    const lastSeen = new Map<number, number>();

    // Initialize all numbers as not seen
    for (let i = 1; i <= 69; i++) {
      skipCounts.set(i, draws.length);
    }

    // Track when numbers were last seen
    draws.forEach((draw, index) => {
      draw.white_balls.forEach(num => {
        lastSeen.set(num, index);
      });
      lastSeen.set(draw.red_ball, index);
    });

    // Calculate skip counts from most recent draw
    const mostRecentIndex = draws.length - 1;
    for (let i = 1; i <= 69; i++) {
      const lastSeenIndex = lastSeen.get(i);
      if (lastSeenIndex !== undefined) {
        skipCounts.set(i, mostRecentIndex - lastSeenIndex);
      }
    }

    return skipCounts;
  }

  getConfig(): SkipFilterConfig {
    return { ...this.config };
  }

  setConfig(config: SkipFilterConfig): void {
    this.config = { ...config };
  }

  validateConfig(config: SkipFilterConfig): boolean {
    return config.minSkipCount >= 0 && config.maxSkipCount > config.minSkipCount;
  }
}

/**
 * First Digit Filter - Filters based on first digit of numbers
 */
export class DigitFilter implements PredictionFilter<DigitFilterConfig> {
  id = 'digit-filter';
  name = 'First Digit Filter';
  description = 'Filter combinations based on first digit patterns';
  category = 'advanced' as const;

  private config: DigitFilterConfig = {
    enabled: true,
    firstDigit: [1, 2, 3, 4, 5, 6], // Allow 1-6 as first digits
    excludeDigits: []
  };

  apply(combinations: number[][], draws: Draw[]): number[][] {
    if (!this.config.enabled) return combinations;

    return combinations.filter(combo => {
      const sortedCombo = [...combo].sort((a, b) => a - b);
      const firstDigit = Math.floor(sortedCombo[0] / 10);

      // Check if first digit is allowed
      if (!this.config.firstDigit.includes(firstDigit)) {
        return false;
      }

      // Check if any excluded digits are present
      return !sortedCombo.some(num => {
        const digit = Math.floor(num / 10);
        return this.config.excludeDigits.includes(digit);
      });
    });
  }

  getConfig(): DigitFilterConfig {
    return { ...this.config };
  }

  setConfig(config: DigitFilterConfig): void {
    this.config = { ...config };
  }

  validateConfig(config: DigitFilterConfig): boolean {
    return config.firstDigit.length > 0 &&
           config.firstDigit.every((d: number) => d >= 0 && d <= 6) &&
           !config.firstDigit.some((d: number) => config.excludeDigits.includes(d));
  }
}

/**
 * High/Low Filter - Filters based on high/low number distribution
 */
export class HighLowFilter implements PredictionFilter<HighLowFilterConfig> {
  id = 'highlow-filter';
  name = 'High/Low Split Filter';
  description = 'Filter combinations based on high/low number distribution';
  category = 'basic' as const;

  private config: HighLowFilterConfig = {
    enabled: true,
    minHigh: 1,
    maxHigh: 4,
    highThreshold: 35
  };

  apply(combinations: number[][], draws: Draw[]): number[][] {
    if (!this.config.enabled) return combinations;

    return combinations.filter(combo => {
      const highCount = combo.filter(num => num > this.config.highThreshold).length;
      return highCount >= this.config.minHigh && highCount <= this.config.maxHigh;
    });
  }

  getConfig() {
    return { ...this.config };
  }

  setConfig(config: typeof this.config): void {
    this.config = { ...config };
  }

  validateConfig(config: typeof this.config): boolean {
    return config.minHigh >= 0 && config.maxHigh <= 5 && config.minHigh <= config.maxHigh;
  }
}

/**
 * Filter Manager - Manages all prediction filters
 */
export class FilterManager {
  private filters: Map<string, PredictionFilter<any>> = new Map();

  constructor() {
    this.initializeFilters();
  }

  private initializeFilters(): void {
    this.registerFilter(new SumFilter());
    this.registerFilter(new ParityFilter());
    this.registerFilter(new SkipFilter());
    this.registerFilter(new DigitFilter());
    this.registerFilter(new HighLowFilter());
  }

  registerFilter<T extends FilterConfig>(filter: PredictionFilter<T>): void {
    this.filters.set(filter.id, filter);
  }

  getFilter(id: string): PredictionFilter<any> | undefined {
    return this.filters.get(id);
  }

  getAllFilters(): PredictionFilter<any>[] {
    return Array.from(this.filters.values());
  }

  getFiltersByCategory(category: string): PredictionFilter<any>[] {
    return this.getAllFilters().filter(filter => filter.category === category);
  }

  applyFilters(combinations: number[][], draws: Draw[], enabledFilterIds: string[] = []): number[][] {
    let filtered = [...combinations];

    for (const filterId of enabledFilterIds) {
      const filter = this.filters.get(filterId);
      if (filter) {
        filtered = filter.apply(filtered, draws);
      }
    }

    return filtered;
  }

  getFilterConfigs(): Record<string, any> {
    const configs: Record<string, any> = {};
    for (const [id, filter] of this.filters) {
      configs[id] = filter.getConfig();
    }
    return configs;
  }

  setFilterConfig(id: string, config: any): boolean {
    const filter = this.filters.get(id);
    if (filter && filter.validateConfig(config)) {
      filter.setConfig(config);
      return true;
    }
    return false;
  }
}
