import type { Draw } from '../utils/scoringSystem';

// ============================================================================
// PREDICTION ENGINE INTERFACES
// ============================================================================

export interface PredictionFilter<T extends FilterConfig = FilterConfig> {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'experimental';
  apply: (combinations: number[][], draws: Draw[]) => number[][];
  getConfig: () => T;
  setConfig: (config: T) => void;
  validateConfig: (config: T) => boolean;
}

export interface FilterConfig {
  enabled: boolean;
  [key: string]: unknown;
}

export interface SumFilterConfig extends FilterConfig {
  minSum: number;
  maxSum: number;
  targetSum?: number;
}

export interface ParityFilterConfig extends FilterConfig {
  minOdd: number;
  maxOdd: number;
  targetRatio?: number; // 0.0 to 1.0 (odd/total)
}

export interface SkipFilterConfig extends FilterConfig {
  maxSkipCount: number;
  minSkipCount: number;
  hotThreshold: number; // draws since last appearance
  coldThreshold: number;
}

export interface HighLowFilterConfig extends FilterConfig {
  minHigh: number;
  maxHigh: number;
  highThreshold: number; // Numbers above this are "high"
}

export interface DigitFilterConfig extends FilterConfig {
  firstDigit: number[]; // Allowed first digits (0-9)
  excludeDigits: number[]; // Digits to exclude from combinations
}

export interface Combination {
  numbers: number[];
  sum: number;
  oddCount: number;
  evenCount: number;
  highCount: number; // numbers > 35
  lowCount: number;  // numbers <= 35
  firstDigit: number;
  skipScore: number;
  recurrenceScore: number;
  pairScore: number;
  tripleScore: number;
  compositeScore: number;
  confidence: number;
  reasoning: string[];
}

export interface PredictionResult {
  combinations: Combination[];
  totalGenerated: number;
  totalFiltered: number;
  filtersApplied: string[];
  generationTime: number;
  scoringTime: number;
  metadata: {
    averageSum: number;
    averageOddCount: number;
    hotNumbers: number[];
    coldNumbers: number[];
    predictedSumRange: [number, number];
    confidence: number;
  };
}

export interface PredictionStats {
  scoreDistribution: { range: string; count: number }[];
  topNumbers: { number: number; frequency: number }[];
  sumDistribution: { range: string; count: number }[];
  averageMetrics: {
    sum: number;
    oddCount: number;
    highCount: number;
    score: number;
    confidence: number;
  };
}

export interface BacktestResult {
  drawId: number;
  drawDate: string;
  actualNumbers: number[];
  predictedCombinations: Combination[];
  hits: {
    '1-match': number;
    '2-match': number;
    '3-match': number;
    '4-match': number;
    '5-match': number;
  };
  accuracy: number;
  topScore: number;
  averageScore: number;
  processingTime: number;
}

export interface HotColdAnalysis {
  number: number;
  frequency: number;
  skipCount: number;
  lastAppearance: string;
  heatScore: number; // 0-100, higher = hotter
  status: 'hot' | 'warm' | 'cold' | 'frozen';
  trend: 'rising' | 'falling' | 'stable';
  predictedNextAppearance: number; // estimated draws until next appearance
}

export interface DrawLocationAnalysis {
  currentDrawIndex: number;
  averageJump: number;
  recentJumps: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  predictedNextJump: number;
  confidence: number;
  sumRange: [number, number];
  patternStrength: number;
}

// ============================================================================
// DRAW LOCATION ANALYSIS INTERFACES
// ============================================================================

export interface OverUnderAnalysis {
  overCount: number;
  underCount: number;
  averageDeviation: number;
  recentTrend: 'over' | 'under' | 'balanced';
}

export interface DrawIndexRange {
  start: number;
  end: number;
  total: number;
}

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

export interface ScoringWeights {
  recurrence: number;      // How much weight to give number recurrence
  skipAlignment: number;   // How much weight to give skip count alignment
  pairRecurrence: number;  // How much weight to give pair patterns
  tripleRecurrence: number; // How much weight to give triple patterns
  sumProximity: number;    // How much weight to give sum closeness to target
  hotColdStatus: number;   // How much weight to give hot/cold status
  locationFit: number;     // How much weight to give draw location analysis
  parityBalance: number;   // How much weight to give odd/even balance
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  recurrence: 0.25,
  skipAlignment: 0.20,
  pairRecurrence: 0.15,
  tripleRecurrence: 0.10,
  sumProximity: 0.15,
  hotColdStatus: 0.10,
  locationFit: 0.03,
  parityBalance: 0.02
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export class PredictionUtils {
  /**
   * Generate all possible 5-number combinations from 1-69
   * Note: This generates ~11 million combinations, use with caution
   */
  static generateAllCombinations(): number[][] {
    const combinations: number[][] = [];
    const numbers = Array.from({ length: 69 }, (_, i) => i + 1);

    // Generate combinations using nested loops (optimized for memory)
    for (let i = 0; i < numbers.length - 4; i++) {
      for (let j = i + 1; j < numbers.length - 3; j++) {
        for (let k = j + 1; k < numbers.length - 2; k++) {
          for (let l = k + 1; l < numbers.length - 1; l++) {
            for (let m = l + 1; m < numbers.length; m++) {
              combinations.push([numbers[i], numbers[j], numbers[k], numbers[l], numbers[m]]);
            }
          }
        }
      }
    }

    return combinations;
  }

  /**
   * Calculate sum of a combination
   */
  static calculateSum(combination: number[]): number {
    return combination.reduce((sum, num) => sum + num, 0);
  }

  /**
   * Count odd numbers in combination
   */
  static countOdd(combination: number[]): number {
    return combination.filter(num => num % 2 === 1).length;
  }

  /**
   * Count high numbers (> 35) in combination
   */
  static countHigh(combination: number[]): number {
    return combination.filter(num => num > 35).length;
  }

  /**
   * Get first digit of the smallest number
   */
  static getFirstDigit(combination: number[]): number {
    const sorted = [...combination].sort((a, b) => a - b);
    return Math.floor(sorted[0] / 10);
  }

  /**
   * Calculate skip score for a combination
   */
  static calculateSkipScore(combination: number[], skipCounts: Map<number, number>): number {
    let totalSkip = 0;
    for (const num of combination) {
      totalSkip += skipCounts.get(num) || 100; // Default high skip for unknown
    }
    return totalSkip / combination.length;
  }

  /**
   * Check if combination contains specific pairs
   */
  static hasPairs(combination: number[], commonPairs: number[][]): number {
    let pairCount = 0;
    for (const pair of commonPairs) {
      if (pair.every(num => combination.includes(num))) {
        pairCount++;
      }
    }
    return pairCount;
  }

  /**
   * Check if combination contains specific triples
   */
  static hasTriples(combination: number[], commonTriples: number[][]): number {
    let tripleCount = 0;
    for (const triple of commonTriples) {
      if (triple.every(num => combination.includes(num))) {
        tripleCount++;
      }
    }
    return tripleCount;
  }
}

// ============================================================================
// BACKTESTING INTERFACES
// ============================================================================

export interface BacktestStatistics {
  totalDraws: number;
  averageAccuracy: number;
  averageScore: number;
  totalHits: BacktestResult['hits'];
  hitRates: { [key: string]: number };
  averageProcessingTime: number;
  bestDraw: { index: number; accuracy: number; date: string };
  worstDraw: { index: number; accuracy: number; date: string };
  scoreCorrelation: number;
}

export interface ValidationResults {
  accuracySignificance: {
    pValue: number;
    isSignificant: boolean;
    confidence: number;
    effectSize: number;
  };
  hitRateSignificance: {
    [key: string]: {
      pValue: number;
      isSignificant: boolean;
      expectedRate: number;
      observedRate: number;
    };
  };
  temporalStability: {
    autocorrelation: number;
    trendSignificance: number;
    volatility: number;
  };
}

// ============================================================================
// CACHING INTERFACES
// ============================================================================

export interface CacheEntry<T = unknown> {
  result: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface CacheStatistics {
  size: number;
  maxSize: number;
  memoryUsage: number;
  maxMemory: number;
  memoryUsagePercent: number;
  hitRate: number;
  totalAccesses: number;
  totalHits: number;
  averageAge: number;
  typeDistribution: { [type: string]: number };
}

export interface CombinationScoresCache {
  combinations: number[][];
  scores: Combination[];
}

export interface FilterResultsCache {
  combinations: number[][];
  filters: string[];
  filtered: number[][];
}

export interface StatisticsCache {
  data: number[];
  stats: unknown;
}

export interface DebugEntry {
  key: string;
  type: string;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  age: number;
}

export interface DebugData {
  stats: CacheStatistics;
  entries: DebugEntry[];
}
