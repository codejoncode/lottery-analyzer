import type { Draw } from '../utils/scoringSystem';
import type {
  PredictionResult,
  Combination,
  ScoringWeights
} from './types';
import { FilterManager } from './filters';
import { ComboScorer } from './scoring/ComboScorer';

/**
 * Main Prediction Engine
 * Orchestrates the entire prediction pipeline
 */
export class PredictionEngine {
  private draws: Draw[] = [];
  private filterManager: FilterManager;
  private comboScorer: ComboScorer;
  private generatedCombinations: number[][] = [];
  private scoredCombinations: Combination[] = [];

  constructor(draws: Draw[] = []) {
    this.draws = draws;
    this.filterManager = new FilterManager();
    this.comboScorer = new ComboScorer(draws);
    this.initializeCombinations();
  }

  /**
   * Update draws and refresh all components
   */
  updateDraws(draws: Draw[]): void {
    this.draws = draws;
    this.comboScorer.updateDraws(draws);
    this.initializeCombinations();
    this.scoredCombinations = []; // Clear cache
  }

  /**
   * Initialize the base set of combinations
   * Note: In production, you might want to generate these progressively
   */
  private initializeCombinations(): void {
    console.log('🔄 Initializing combinations...');

    // For demo purposes, generate a smaller subset
    // In production, you'd want to generate all combinations or use a smarter approach
    this.generatedCombinations = this.generateSmartCombinations(50000);

    console.log(`✅ Generated ${this.generatedCombinations.length} combinations`);
  }

  /**
   * Generate combinations using smart filtering to reduce the search space
   */
  private generateSmartCombinations(targetCount: number): number[][] {
    const combinations: number[][] = [];

    // Get hot and warm numbers for better combinations
    const hotNumbers = this.getHotNumbers();
    const warmNumbers = this.getWarmNumbers();

    // Prioritize combinations with hot/warm numbers
    const priorityNumbers = [...hotNumbers, ...warmNumbers];

    let attempts = 0;
    const maxAttempts = targetCount * 10; // Prevent infinite loops

    while (combinations.length < targetCount && attempts < maxAttempts) {
      attempts++;

      // Generate combination with bias toward hot/warm numbers
      const combination = this.generateBiasedCombination(priorityNumbers);

      // Basic validation
      if (this.isValidCombination(combination) &&
          !this.combinationExists(combination, combinations)) {
        combinations.push(combination);
      }
    }

    return combinations;
  }

  /**
   * Generate a combination with bias toward certain numbers
   */
  private generateBiasedCombination(priorityNumbers: number[]): number[] {
    const combination: number[] = [];
    const availableNumbers = Array.from({ length: 69 }, (_, i) => i + 1);

    // Try to include priority numbers first
    const shuffledPriority = [...priorityNumbers].sort(() => Math.random() - 0.5);

    for (const num of shuffledPriority) {
      if (combination.length >= 5) break;
      if (Math.random() < 0.7) { // 70% chance to include priority number
        combination.push(num);
        // Remove from available numbers
        const index = availableNumbers.indexOf(num);
        if (index > -1) availableNumbers.splice(index, 1);
      }
    }

    // Fill remaining spots with random numbers
    while (combination.length < 5) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const num = availableNumbers.splice(randomIndex, 1)[0];
      combination.push(num);
    }

    return combination.sort((a, b) => a - b);
  }

  /**
   * Get hot numbers from the analyzer
   */
  private getHotNumbers(): number[] {
    // This would come from the HotColdAnalyzer
    // For now, return some reasonable defaults
    return [3, 7, 12, 15, 18, 21, 24, 27, 32, 35, 42, 45, 48, 52, 56, 61, 64, 67];
  }

  /**
   * Get warm numbers from the analyzer
   */
  private getWarmNumbers(): number[] {
    // This would come from the HotColdAnalyzer
    return [1, 2, 4, 5, 6, 8, 9, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26, 28, 29, 30, 31, 33, 34, 36, 37, 38, 39, 40, 41, 43, 44, 46, 47, 49, 50, 51, 53, 54, 55, 57, 58, 59, 60, 62, 63, 65, 66, 68, 69];
  }

  /**
   * Check if combination is valid (no duplicates, within range)
   */
  private isValidCombination(combination: number[]): boolean {
    if (combination.length !== 5) return false;

    // Check for duplicates
    const unique = new Set(combination);
    if (unique.size !== 5) return false;

    // Check range
    return combination.every(num => num >= 1 && num <= 69);
  }

  /**
   * Check if combination already exists in the list
   */
  private combinationExists(combination: number[], existing: number[][]): boolean {
    const sorted = combination.slice().sort((a, b) => a - b);

    return existing.some(existingCombo => {
      const existingSorted = existingCombo.slice().sort((a, b) => a - b);
      return existingSorted.every((num: number, index: number) => num === sorted[index]);
    });
  }

  /**
   * Generate predictions with full pipeline
   */
  async generatePredictions(options: {
    enabledFilters?: string[];
    maxCombinations?: number;
    minScore?: number;
    scoringWeights?: Partial<ScoringWeights>;
  } = {}): Promise<PredictionResult> {
    const {
      enabledFilters = [],
      maxCombinations = 100,
      minScore = 0,
      scoringWeights
    } = options;

    console.log('🎯 Starting prediction generation...');

    const startTime = performance.now();

    // Update scoring weights if provided
    if (scoringWeights) {
      this.comboScorer.setScoringWeights(scoringWeights);
    }

    // Apply filters to reduce combination pool
    console.log('🔧 Applying filters...');
    const filteredCombinations = this.filterManager.applyFilters(
      this.generatedCombinations,
      this.draws,
      enabledFilters
    );

    console.log(`📊 Filtered to ${filteredCombinations.length} combinations`);

    // Score combinations
    console.log('🧮 Scoring combinations...');
    const scored = this.scoreCombinations(filteredCombinations);
    const generationTime = performance.now() - startTime;

    // Sort by score and apply limits
    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    const topCombinations = scored
      .filter(combo => combo.compositeScore >= minScore)
      .slice(0, maxCombinations);

    const scoringTime = performance.now() - startTime - generationTime;

    // Calculate metadata
    const metadata = this.calculateMetadata(topCombinations);

    const result: PredictionResult = {
      combinations: topCombinations,
      totalGenerated: this.generatedCombinations.length,
      totalFiltered: filteredCombinations.length,
      filtersApplied: enabledFilters,
      generationTime,
      scoringTime,
      metadata
    };

    console.log(`✅ Generated ${topCombinations.length} predictions in ${(generationTime + scoringTime).toFixed(2)}ms`);

    return result;
  }

  /**
   * Score combinations using the ComboScorer
   */
  private scoreCombinations(combinations: number[][]): Combination[] {
    return combinations.map(combo => this.comboScorer.scoreCombination(combo));
  }

  /**
   * Calculate prediction metadata
   */
  private calculateMetadata(combinations: Combination[]): PredictionResult['metadata'] {
    if (combinations.length === 0) {
      return {
        averageSum: 0,
        averageOddCount: 0,
        hotNumbers: [],
        coldNumbers: [],
        predictedSumRange: [100, 200],
        confidence: 0
      };
    }

    const sums = combinations.map(c => c.sum);
    const oddCounts = combinations.map(c => c.oddCount);

    const averageSum = sums.reduce((a, b) => a + b, 0) / sums.length;
    const averageOddCount = oddCounts.reduce((a, b) => a + b, 0) / oddCounts.length;

    // Get hot/cold numbers (simplified)
    const hotNumbers = this.getHotNumbers().slice(0, 5);
    const coldNumbers = this.getWarmNumbers().slice(0, 5);

    // Calculate sum range
    const minSum = Math.min(...sums);
    const maxSum = Math.max(...sums);
    const predictedSumRange: [number, number] = [minSum, maxSum];

    // Calculate average confidence
    const averageConfidence = combinations.reduce((sum, c) => sum + c.confidence, 0) / combinations.length;

    return {
      averageSum: Math.round(averageSum),
      averageOddCount: Math.round(averageOddCount * 10) / 10,
      hotNumbers,
      coldNumbers,
      predictedSumRange,
      confidence: Math.round(averageConfidence * 100) / 100
    };
  }

  /**
   * Get available filters
   */
  getAvailableFilters() {
    return this.filterManager.getAllFilters();
  }

  /**
   * Get filter configurations
   */
  getFilterConfigs() {
    return this.filterManager.getFilterConfigs();
  }

  /**
   * Update filter configuration
   */
  setFilterConfig(filterId: string, config: any): boolean {
    return this.filterManager.setFilterConfig(filterId, config);
  }

  /**
   * Get current scoring weights
   */
  getScoringWeights(): ScoringWeights {
    return this.comboScorer.getScoringWeights();
  }

  /**
   * Update scoring weights
   */
  setScoringWeights(weights: Partial<ScoringWeights>): void {
    this.comboScorer.setScoringWeights(weights);
  }

  /**
   * Get analysis components for debugging/transparency
   */
  getAnalysisComponents() {
    return this.comboScorer.getAnalysisComponents();
  }

  /**
   * Export prediction data for external analysis
   */
  exportPredictions(combinations: Combination[]): string {
    const headers = [
      'Numbers',
      'Sum',
      'Odd Count',
      'High Count',
      'First Digit',
      'Composite Score',
      'Confidence',
      'Reasoning'
    ];

    const rows = combinations.map(combo => [
      combo.numbers.join(' '),
      combo.sum.toString(),
      combo.oddCount.toString(),
      combo.highCount.toString(),
      combo.firstDigit.toString(),
      combo.compositeScore.toFixed(2),
      combo.confidence.toFixed(2),
      combo.reasoning.join('; ')
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Get prediction statistics
   */
  getPredictionStats(combinations: Combination[]): {
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
  } {
    if (combinations.length === 0) {
      return {
        scoreDistribution: [],
        topNumbers: [],
        sumDistribution: [],
        averageMetrics: { sum: 0, oddCount: 0, highCount: 0, score: 0, confidence: 0 }
      };
    }

    // Score distribution
    const scoreDistribution = this.calculateDistribution(
      combinations.map(c => c.compositeScore),
      [0, 20, 40, 60, 80, 100]
    );

    // Top numbers
    const numberCounts = new Map<number, number>();
    combinations.forEach(combo => {
      combo.numbers.forEach((num: number) => {
        numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
      });
    });

    const topNumbers = Array.from(numberCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([number, frequency]) => ({ number, frequency }));

    // Sum distribution
    const sumDistribution = this.calculateDistribution(
      combinations.map(c => c.sum),
      [100, 125, 150, 175, 200, 225, 250]
    );

    // Average metrics
    const averageMetrics = {
      sum: combinations.reduce((sum, c) => sum + c.sum, 0) / combinations.length,
      oddCount: combinations.reduce((sum, c) => sum + c.oddCount, 0) / combinations.length,
      highCount: combinations.reduce((sum, c) => sum + c.highCount, 0) / combinations.length,
      score: combinations.reduce((sum, c) => sum + c.compositeScore, 0) / combinations.length,
      confidence: combinations.reduce((sum, c) => sum + c.confidence, 0) / combinations.length
    };

    return {
      scoreDistribution,
      topNumbers,
      sumDistribution,
      averageMetrics
    };
  }

  /**
   * Calculate distribution for a numeric array
   */
  private calculateDistribution(values: number[], thresholds: number[]): { range: string; count: number }[] {
    const distribution: { range: string; count: number }[] = [];

    for (let i = 0; i < thresholds.length - 1; i++) {
      const min = thresholds[i];
      const max = thresholds[i + 1];
      const count = values.filter(v => v >= min && v < max).length;
      distribution.push({ range: `${min}-${max - 1}`, count });
    }

    // Add the last range
    const lastMin = thresholds[thresholds.length - 1];
    const lastCount = values.filter(v => v >= lastMin).length;
    distribution.push({ range: `${lastMin}+`, count: lastCount });

    return distribution;
  }
}
