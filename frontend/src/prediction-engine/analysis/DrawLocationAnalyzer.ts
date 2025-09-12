import type { Draw } from '../../utils/scoringSystem';
import type { DrawLocationAnalysis } from '../types';

/**
 * Draw Location Analysis System
 * Analyzes draw index patterns, jumps, and predicts next draw zones
 */
export class DrawLocationAnalyzer {
  private draws: Draw[] = [];
  private analysisCache: DrawLocationAnalysis | null = null;

  constructor(draws: Draw[] = []) {
    this.draws = draws;
    this.precomputeAnalysis();
  }

  /**
   * Update draws and refresh analysis
   */
  updateDraws(draws: Draw[]): void {
    this.draws = draws;
    this.analysisCache = null;
    this.precomputeAnalysis();
  }

  /**
   * Precompute location analysis
   */
  private precomputeAnalysis(): void {
    if (this.draws.length < 3) return;

    const currentDrawIndex = this.draws.length - 1;
    const recentJumps = this.calculateRecentJumps();
    const averageJump = this.calculateAverageJump();
    const trend = this.calculateTrend(recentJumps);
    const predictedNextJump = this.predictNextJump(recentJumps, averageJump, trend);
    const confidence = this.calculateConfidence(recentJumps, averageJump);
    const sumRange = this.predictSumRange(predictedNextJump);
    const patternStrength = this.calculatePatternStrength(recentJumps);

    this.analysisCache = {
      currentDrawIndex,
      averageJump,
      recentJumps,
      trend,
      predictedNextJump,
      confidence,
      sumRange,
      patternStrength
    };
  }

  /**
   * Calculate recent jumps between draws
   */
  private calculateRecentJumps(): number[] {
    const jumps: number[] = [];
    const recentDraws = this.draws.slice(-10); // Last 10 draws

    for (let i = 1; i < recentDraws.length; i++) {
      const currentSum = this.calculateDrawSum(recentDraws[i]);
      const previousSum = this.calculateDrawSum(recentDraws[i - 1]);
      jumps.push(Math.abs(currentSum - previousSum));
    }

    return jumps;
  }

  /**
   * Calculate average jump between draws
   */
  private calculateAverageJump(): number {
    if (this.draws.length < 2) return 0;

    let totalJump = 0;
    let jumpCount = 0;

    for (let i = 1; i < this.draws.length; i++) {
      const currentSum = this.calculateDrawSum(this.draws[i]);
      const previousSum = this.calculateDrawSum(this.draws[i - 1]);
      totalJump += Math.abs(currentSum - previousSum);
      jumpCount++;
    }

    return Math.round(totalJump / jumpCount);
  }

  /**
   * Calculate draw sum (white balls only, excluding Powerball)
   */
  private calculateDrawSum(draw: Draw): number {
    return draw.white_balls.reduce((sum, num) => sum + num, 0);
  }

  /**
   * Calculate trend in jumps
   */
  private calculateTrend(recentJumps: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (recentJumps.length < 3) return 'stable';

    const firstHalf = recentJumps.slice(0, Math.floor(recentJumps.length / 2));
    const secondHalf = recentJumps.slice(Math.floor(recentJumps.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = Math.abs(secondAvg - firstAvg) / firstAvg;

    if (changePercent > 0.15) {
      return secondAvg > firstAvg ? 'increasing' : 'decreasing';
    }

    return 'stable';
  }

  /**
   * Predict next jump based on patterns
   */
  private predictNextJump(recentJumps: number[], averageJump: number, trend: string): number {
    if (recentJumps.length === 0) return averageJump;

    const lastJump = recentJumps[recentJumps.length - 1];
    let prediction = lastJump;

    // Apply trend adjustment
    switch (trend) {
      case 'increasing':
        prediction = Math.round(lastJump * 1.2);
        break;
      case 'decreasing':
        prediction = Math.round(lastJump * 0.8);
        break;
      case 'stable':
      default:
        // Revert towards average
        const deviation = lastJump - averageJump;
        prediction = Math.round(lastJump - deviation * 0.3);
        break;
    }

    // Ensure reasonable bounds
    return Math.max(10, Math.min(150, prediction));
  }

  /**
   * Calculate confidence in prediction
   */
  private calculateConfidence(recentJumps: number[], averageJump: number): number {
    if (recentJumps.length < 3) return 0.5;

    // Calculate standard deviation of recent jumps
    const mean = recentJumps.reduce((a, b) => a + b, 0) / recentJumps.length;
    const variance = recentJumps.reduce((acc, jump) => acc + Math.pow(jump - mean, 2), 0) / recentJumps.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher confidence
    const confidence = Math.max(0.1, Math.min(0.9, 1 - (stdDev / averageJump)));

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Predict sum range for next draw
   */
  private predictSumRange(predictedJump: number): [number, number] {
    if (this.draws.length === 0) return [100, 200];

    const lastDraw = this.draws[this.draws.length - 1];
    const lastSum = this.calculateDrawSum(lastDraw);

    // Predict range based on jump
    const minSum = Math.max(15, lastSum - predictedJump);
    const maxSum = Math.min(335, lastSum + predictedJump);

    return [Math.round(minSum), Math.round(maxSum)];
  }

  /**
   * Calculate pattern strength
   */
  private calculatePatternStrength(recentJumps: number[]): number {
    if (recentJumps.length < 3) return 0.5;

    // Calculate autocorrelation (simplified)
    let strength = 0;
    for (let lag = 1; lag < Math.min(3, recentJumps.length); lag++) {
      let correlation = 0;
      let count = 0;

      for (let i = lag; i < recentJumps.length; i++) {
        const diff = Math.abs(recentJumps[i] - recentJumps[i - lag]);
        const avg = (recentJumps[i] + recentJumps[i - lag]) / 2;
        correlation += 1 - (diff / avg);
        count++;
      }

      if (count > 0) {
        strength += correlation / count;
      }
    }

    return Math.max(0.1, Math.min(0.9, strength / 3));
  }

  /**
   * Get current analysis
   */
  getAnalysis(): DrawLocationAnalysis | null {
    return this.analysisCache;
  }

  /**
   * Get draw index range analysis
   */
  getDrawIndexRange(): { start: number; end: number; total: number } {
    if (this.draws.length === 0) return { start: 0, end: 0, total: 0 };

    // Assuming draws are ordered by date, assign indices
    return {
      start: 1,
      end: this.draws.length,
      total: this.draws.length
    };
  }

  /**
   * Get over/under analysis for recent draws
   */
  getOverUnderAnalysis(): {
    overCount: number;
    underCount: number;
    averageDeviation: number;
    recentTrend: 'over' | 'under' | 'balanced';
  } {
    if (this.draws.length < 2) {
      return { overCount: 0, underCount: 0, averageDeviation: 0, recentTrend: 'balanced' };
    }

    const averageJump = this.calculateAverageJump();
    let overCount = 0;
    let underCount = 0;
    let totalDeviation = 0;

    // Analyze last 10 jumps
    const recentJumps = this.calculateRecentJumps();
    recentJumps.forEach(jump => {
      if (jump > averageJump) overCount++;
      else if (jump < averageJump) underCount++;

      totalDeviation += Math.abs(jump - averageJump);
    });

    const averageDeviation = totalDeviation / recentJumps.length;
    let recentTrend: 'over' | 'under' | 'balanced' = 'balanced';

    if (overCount > underCount * 1.5) recentTrend = 'over';
    else if (underCount > overCount * 1.5) recentTrend = 'under';

    return {
      overCount,
      underCount,
      averageDeviation: Math.round(averageDeviation),
      recentTrend
    };
  }

  /**
   * Predict next draw characteristics
   */
  predictNextDraw(): {
    predictedSumRange: [number, number];
    confidence: number;
    expectedJump: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const analysis = this.getAnalysis();
    if (!analysis) {
      return {
        predictedSumRange: [100, 200],
        confidence: 0.5,
        expectedJump: 50,
        riskLevel: 'high'
      };
    }

    const riskLevel = analysis.confidence > 0.7 ? 'low' :
                     analysis.confidence > 0.4 ? 'medium' : 'high';

    return {
      predictedSumRange: analysis.sumRange,
      confidence: analysis.confidence,
      expectedJump: analysis.predictedNextJump,
      riskLevel
    };
  }
}
