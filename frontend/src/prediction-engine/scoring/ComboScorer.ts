import type { Draw } from '../../utils/scoringSystem';
import type {
  Combination,
  ScoringWeights,
  HotColdAnalysis,
  DrawLocationAnalysis
} from '../types';
import { DEFAULT_SCORING_WEIGHTS } from '../types';
import { HotColdAnalyzer } from '../analysis/HotColdAnalyzer';
import { DrawLocationAnalyzer } from '../analysis/DrawLocationAnalyzer';

/**
 * Individual score components for reasoning generation
 */
interface ScoreComponents {
  recurrenceScore: number;
  skipScore: number;
  pairScore: number;
  tripleScore: number;
  sumScore: number;
  hotColdScore: number;
  locationScore: number;
  compositeScore: number;
}

/**
 * Combo Scoring Engine
 * Scores combinations based on multiple factors and weights
 */
export class ComboScorer {
  private hotColdAnalyzer: HotColdAnalyzer;
  private drawLocationAnalyzer: DrawLocationAnalyzer;
  private draws: Draw[] = [];
  private scoringWeights: ScoringWeights = { ...DEFAULT_SCORING_WEIGHTS };

  // Cached data for performance
  private skipCounts: Map<number, number> = new Map();
  private commonPairs: number[][] = [];
  private commonTriples: number[][] = [];

  constructor(draws: Draw[] = []) {
    this.draws = draws;
    this.hotColdAnalyzer = new HotColdAnalyzer(draws);
    this.drawLocationAnalyzer = new DrawLocationAnalyzer(draws);
    this.precomputeData();
  }

  /**
   * Update draws and refresh all analyses
   */
  updateDraws(draws: Draw[]): void {
    this.draws = draws;
    this.hotColdAnalyzer.updateDraws(draws);
    this.drawLocationAnalyzer.updateDraws(draws);
    this.precomputeData();
  }

  /**
   * Precompute expensive data for performance
   */
  private precomputeData(): void {
    this.skipCounts = this.calculateSkipCounts();
    this.commonPairs = this.findCommonPairs();
    this.commonTriples = this.findCommonTriples();
  }

  /**
   * Calculate current skip counts for all numbers
   */
  private calculateSkipCounts(): Map<number, number> {
    const skipCounts = new Map<number, number>();

    // Initialize all numbers
    for (let i = 1; i <= 69; i++) {
      skipCounts.set(i, this.draws.length);
    }

    if (this.draws.length === 0) return skipCounts;

    // Track last appearance of each number
    const lastSeen = new Map<number, number>();

    this.draws.forEach((draw, index) => {
      draw.white_balls.forEach(num => {
        lastSeen.set(num, index);
      });
      lastSeen.set(draw.red_ball, index);
    });

    // Calculate skip counts
    const mostRecentIndex = this.draws.length - 1;
    for (let i = 1; i <= 69; i++) {
      const lastSeenIndex = lastSeen.get(i);
      if (lastSeenIndex !== undefined) {
        skipCounts.set(i, mostRecentIndex - lastSeenIndex);
      }
    }

    return skipCounts;
  }

  /**
   * Find commonly appearing pairs
   */
  private findCommonPairs(): number[][] {
    const pairCounts = new Map<string, number>();

    // Count pair occurrences
    this.draws.forEach(draw => {
      const numbers = [...draw.white_balls].sort((a, b) => a - b);
      for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pair = [numbers[i], numbers[j]];
          const key = pair.join('-');
          pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
        }
      }
    });

    // Return top 20 most common pairs
    return Array.from(pairCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key]) => key.split('-').map(n => parseInt(n)));
  }

  /**
   * Find commonly appearing triples
   */
  private findCommonTriples(): number[][] {
    const tripleCounts = new Map<string, number>();

    // Count triple occurrences
    this.draws.forEach(draw => {
      const numbers = [...draw.white_balls].sort((a, b) => a - b);
      for (let i = 0; i < numbers.length - 2; i++) {
        for (let j = i + 1; j < numbers.length - 1; j++) {
          for (let k = j + 1; k < numbers.length; k++) {
            const triple = [numbers[i], numbers[j], numbers[k]];
            const key = triple.join('-');
            tripleCounts.set(key, (tripleCounts.get(key) || 0) + 1);
          }
        }
      }
    });

    // Return top 10 most common triples
    return Array.from(tripleCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => key.split('-').map(n => parseInt(n)));
  }

  /**
   * Score a single combination
   */
  scoreCombination(combination: number[]): Combination {
    const sum = combination.reduce((acc, num) => acc + num, 0);
    const oddCount = combination.filter(num => num % 2 === 1).length;
    const evenCount = 5 - oddCount;
    const highCount = combination.filter(num => num > 35).length;
    const lowCount = 5 - highCount;
    const sorted = [...combination].sort((a, b) => a - b);
    const firstDigit = Math.floor(sorted[0] / 10);

    // Calculate individual scores
    const recurrenceScore = this.calculateRecurrenceScore(combination);
    const skipScore = this.calculateSkipScore(combination);
    const pairScore = this.calculatePairScore(combination);
    const tripleScore = this.calculateTripleScore(combination);
    const sumScore = this.calculateSumScore(sum);
    const hotColdScore = this.calculateHotColdScore(combination);
    const locationScore = this.calculateLocationScore(sum);

    // Calculate composite score
    const compositeScore =
      recurrenceScore * this.scoringWeights.recurrence +
      skipScore * this.scoringWeights.skipAlignment +
      pairScore * this.scoringWeights.pairRecurrence +
      tripleScore * this.scoringWeights.tripleRecurrence +
      sumScore * this.scoringWeights.sumProximity +
      hotColdScore * this.scoringWeights.hotColdStatus +
      locationScore * this.scoringWeights.locationFit;

    // Generate reasoning
    const reasoning = this.generateReasoning({
      recurrenceScore,
      skipScore,
      pairScore,
      tripleScore,
      sumScore,
      hotColdScore,
      locationScore,
      compositeScore
    });

    // Calculate confidence based on score consistency
    const confidence = this.calculateConfidence([
      recurrenceScore,
      skipScore,
      pairScore,
      tripleScore,
      sumScore,
      hotColdScore,
      locationScore
    ]);

    return {
      numbers: combination,
      sum,
      oddCount,
      evenCount,
      highCount,
      lowCount,
      firstDigit,
      skipScore,
      recurrenceScore,
      pairScore,
      tripleScore,
      compositeScore,
      confidence,
      reasoning
    };
  }

  /**
   * Calculate recurrence score (how often numbers appear together)
   */
  private calculateRecurrenceScore(combination: number[]): number {
    let totalScore = 0;

    combination.forEach(num => {
      const analysis = this.hotColdAnalyzer.getNumberAnalysis(num);
      if (analysis) {
        // Higher frequency = higher score
        totalScore += analysis.frequency * 100;
        // Recent appearance bonus
        if (analysis.skipCount <= 5) totalScore += 20;
      }
    });

    return totalScore / combination.length;
  }

  /**
   * Calculate skip alignment score
   */
  private calculateSkipScore(combination: number[]): number {
    let totalScore = 0;

    combination.forEach(num => {
      const skipCount = this.skipCounts.get(num) || 100;
      // Lower skip count = higher score (but not too low)
      if (skipCount <= 10) totalScore += 80;
      else if (skipCount <= 20) totalScore += 60;
      else if (skipCount <= 30) totalScore += 40;
      else totalScore += 20;
    });

    return totalScore / combination.length;
  }

  /**
   * Calculate pair recurrence score
   */
  private calculatePairScore(combination: number[]): number {
    const sorted = [...combination].sort((a, b) => a - b);
    let pairCount = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const pair = [sorted[i], sorted[j]];
        if (this.commonPairs.some(commonPair =>
          commonPair[0] === pair[0] && commonPair[1] === pair[1]
        )) {
          pairCount++;
        }
      }
    }

    return (pairCount / 10) * 100; // Max 10 pairs possible
  }

  /**
   * Calculate triple recurrence score
   */
  private calculateTripleScore(combination: number[]): number {
    const sorted = [...combination].sort((a, b) => a - b);
    let tripleCount = 0;

    for (let i = 0; i < sorted.length - 2; i++) {
      for (let j = i + 1; j < sorted.length - 1; j++) {
        for (let k = j + 1; k < sorted.length; k++) {
          const triple = [sorted[i], sorted[j], sorted[k]];
          if (this.commonTriples.some(commonTriple =>
            commonTriple.every(num => triple.includes(num))
          )) {
            tripleCount++;
          }
        }
      }
    }

    return (tripleCount / 10) * 100; // Max 10 triples possible
  }

  /**
   * Calculate sum proximity score
   */
  private calculateSumScore(sum: number): number {
    const locationAnalysis = this.drawLocationAnalyzer.getAnalysis();
    if (!locationAnalysis) return 50;

    const [minSum, maxSum] = locationAnalysis.sumRange;
    const targetSum = (minSum + maxSum) / 2;

    if (sum >= minSum && sum <= maxSum) {
      // Within predicted range
      const distance = Math.abs(sum - targetSum);
      const maxDistance = (maxSum - minSum) / 2;
      return 100 * (1 - distance / maxDistance);
    } else {
      // Outside range
      return Math.max(0, 50 - Math.abs(sum - targetSum));
    }
  }

  /**
   * Calculate hot/cold status score
   */
  private calculateHotColdScore(combination: number[]): number {
    let totalScore = 0;

    combination.forEach(num => {
      const analysis = this.hotColdAnalyzer.getNumberAnalysis(num);
      if (analysis) {
        // Hot numbers get higher scores
        switch (analysis.status) {
          case 'hot': totalScore += 80; break;
          case 'warm': totalScore += 60; break;
          case 'cold': totalScore += 40; break;
          case 'frozen': totalScore += 20; break;
        }
      }
    });

    return totalScore / combination.length;
  }

  /**
   * Calculate location fit score
   */
  private calculateLocationScore(_sum: number): number {
    const locationAnalysis = this.drawLocationAnalyzer.getAnalysis();
    if (!locationAnalysis) return 50;

    // Score based on pattern strength and confidence
    return (locationAnalysis.patternStrength + locationAnalysis.confidence) * 50;
  }

  /**
   * Generate reasoning for the score
   */
  private generateReasoning(scores: ScoreComponents): string[] {
    const reasoning: string[] = [];

    if (scores.recurrenceScore > 70) {
      reasoning.push('High number recurrence frequency');
    }
    if (scores.skipScore > 60) {
      reasoning.push('Good skip count alignment');
    }
    if (scores.pairScore > 30) {
      reasoning.push('Contains common number pairs');
    }
    if (scores.tripleScore > 20) {
      reasoning.push('Contains common number triples');
    }
    if (scores.sumScore > 70) {
      reasoning.push('Sum within predicted range');
    }
    if (scores.hotColdScore > 60) {
      reasoning.push('Contains hot/warm numbers');
    }
    if (scores.locationScore > 60) {
      reasoning.push('Good draw location pattern fit');
    }

    return reasoning.length > 0 ? reasoning : ['Average combination characteristics'];
  }

  /**
   * Calculate confidence based on score consistency
   */
  private calculateConfidence(scores: number[]): number {
    if (scores.length === 0) return 0.5;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher confidence
    const confidence = Math.max(0.1, Math.min(0.9, 1 - (stdDev / mean)));

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Update scoring weights
   */
  setScoringWeights(weights: Partial<ScoringWeights>): void {
    this.scoringWeights = { ...this.scoringWeights, ...weights };
  }

  /**
   * Get current scoring weights
   */
  getScoringWeights(): ScoringWeights {
    return { ...this.scoringWeights };
  }

  /**
   * Get analysis components for debugging
   */
  getAnalysisComponents(): {
    skipCounts: Map<number, number>;
    commonPairs: number[][];
    commonTriples: number[][];
    hotNumbers: HotColdAnalysis[];
    coldNumbers: HotColdAnalysis[];
    locationAnalysis: DrawLocationAnalysis | null;
  } {
    return {
      skipCounts: new Map(this.skipCounts),
      commonPairs: [...this.commonPairs],
      commonTriples: [...this.commonTriples],
      hotNumbers: this.hotColdAnalyzer.getHotNumbers(10),
      coldNumbers: this.hotColdAnalyzer.getColdNumbers(10),
      locationAnalysis: this.drawLocationAnalyzer.getAnalysis()
    };
  }
}
