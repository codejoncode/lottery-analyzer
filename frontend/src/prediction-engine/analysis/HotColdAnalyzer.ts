import type { Draw } from '../../utils/scoringSystem';
import type { HotColdAnalysis } from '../types';

/**
 * Hot/Cold Analysis System
 * Tracks number frequency, skip counts, and heat scores
 */
export class HotColdAnalyzer {
  private draws: Draw[] = [];
  private analysisCache: Map<string, HotColdAnalysis> = new Map();

  constructor(draws: Draw[] = []) {
    this.draws = draws;
    this.precomputeAnalysis();
  }

  /**
   * Update draws and refresh analysis
   */
  updateDraws(draws: Draw[]): void {
    this.draws = draws;
    this.analysisCache.clear();
    this.precomputeAnalysis();
  }

  /**
   * Precompute analysis for all numbers
   */
  private precomputeAnalysis(): void {
    if (this.draws.length === 0) return;

    for (let num = 1; num <= 69; num++) {
      this.analysisCache.set(num.toString(), this.analyzeNumber(num));
    }
  }

  /**
   * Analyze a specific number's hot/cold status
   */
  private analyzeNumber(number: number): HotColdAnalysis {
    const appearances: number[] = [];
    const skipCounts: number[] = [];

    // Find all appearances of this number
    this.draws.forEach((draw, index) => {
      if (draw.white_balls.includes(number) || draw.red_ball === number) {
        appearances.push(index);
      }
    });

    // Calculate skip counts between appearances
    for (let i = 1; i < appearances.length; i++) {
      skipCounts.push(appearances[i] - appearances[i - 1] - 1);
    }

    // Calculate current skip count
    const lastAppearance = appearances.length > 0 ? appearances[appearances.length - 1] : -1;
    const currentSkipCount = lastAppearance >= 0 ? this.draws.length - 1 - lastAppearance : this.draws.length;

    // Calculate frequency and heat score
    const frequency = appearances.length / Math.max(this.draws.length, 1);
    const avgSkipCount = skipCounts.length > 0 ? skipCounts.reduce((a, b) => a + b, 0) / skipCounts.length : currentSkipCount;
    const heatScore = this.calculateHeatScore(frequency, currentSkipCount, avgSkipCount);

    // Determine status
    const status = this.determineStatus(heatScore, currentSkipCount);
    const trend = this.calculateTrend(number);

    // Estimate next appearance
    const predictedNextAppearance = this.predictNextAppearance(number, currentSkipCount, avgSkipCount);

    return {
      number,
      frequency,
      skipCount: currentSkipCount,
      lastAppearance: lastAppearance >= 0 ? this.draws[lastAppearance].date : 'Never',
      heatScore,
      status,
      trend,
      predictedNextAppearance
    };
  }

  /**
   * Calculate heat score (0-100, higher = hotter)
   */
  private calculateHeatScore(frequency: number, currentSkip: number, avgSkip: number): number {
    // Base score from frequency (0-50 points)
    const frequencyScore = Math.min(frequency * 100, 50);

    // Skip score (0-50 points, lower skip = higher score)
    let skipScore = 50;
    if (avgSkip > 0) {
      const skipRatio = Math.min(currentSkip / avgSkip, 2); // Cap at 2x average
      skipScore = Math.max(0, 50 * (1 - skipRatio / 2));
    }

    return Math.round(frequencyScore + skipScore);
  }

  /**
   * Determine hot/cold/warm status
   */
  private determineStatus(heatScore: number, currentSkip: number): 'hot' | 'warm' | 'cold' | 'frozen' {
    if (heatScore >= 70) return 'hot';
    if (heatScore >= 40) return 'warm';
    if (currentSkip > 20) return 'frozen';
    return 'cold';
  }

  /**
   * Calculate trend for a number
   */
  private calculateTrend(number: number): 'rising' | 'falling' | 'stable' {
    if (this.draws.length < 10) return 'stable';

    const recent = this.draws.slice(-10);
    const older = this.draws.slice(-20, -10);

    const recentCount = recent.filter(draw =>
      draw.white_balls.includes(number) || draw.red_ball === number
    ).length;

    const olderCount = older.filter(draw =>
      draw.white_balls.includes(number) || draw.red_ball === number
    ).length;

    if (recentCount > olderCount * 1.2) return 'rising';
    if (recentCount < olderCount * 0.8) return 'falling';
    return 'stable';
  }

  /**
   * Predict next appearance based on historical patterns
   */
  private predictNextAppearance(number: number, currentSkip: number, avgSkip: number): number {
    // Simple prediction based on average skip count
    if (avgSkip === 0) return Math.max(1, currentSkip);

    // If currently overdue, predict sooner
    if (currentSkip > avgSkip) {
      return Math.max(1, Math.round(avgSkip * 0.7));
    }

    // If recently appeared, predict later
    return Math.max(1, Math.round(avgSkip * 1.3));
  }

  /**
   * Get analysis for a specific number
   */
  getNumberAnalysis(number: number): HotColdAnalysis | undefined {
    return this.analysisCache.get(number.toString());
  }

  /**
   * Get all hot numbers (top 10 by heat score)
   */
  getHotNumbers(limit: number = 10): HotColdAnalysis[] {
    return Array.from(this.analysisCache.values())
      .filter(analysis => analysis.status === 'hot')
      .sort((a, b) => b.heatScore - a.heatScore)
      .slice(0, limit);
  }

  /**
   * Get all cold numbers (bottom 10 by heat score)
   */
  getColdNumbers(limit: number = 10): HotColdAnalysis[] {
    return Array.from(this.analysisCache.values())
      .filter(analysis => analysis.status === 'cold' || analysis.status === 'frozen')
      .sort((a, b) => a.heatScore - b.heatScore)
      .slice(0, limit);
  }

  /**
   * Get numbers by status
   */
  getNumbersByStatus(status: 'hot' | 'warm' | 'cold' | 'frozen'): HotColdAnalysis[] {
    return Array.from(this.analysisCache.values())
      .filter(analysis => analysis.status === status)
      .sort((a, b) => b.heatScore - a.heatScore);
  }

  /**
   * Get overall statistics
   */
  getStatistics(): {
    totalNumbers: number;
    hotCount: number;
    warmCount: number;
    coldCount: number;
    frozenCount: number;
    averageHeatScore: number;
    averageSkipCount: number;
  } {
    const analyses = Array.from(this.analysisCache.values());

    const statusCounts = analyses.reduce((acc, analysis) => {
      acc[analysis.status] = (acc[analysis.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalHeatScore = analyses.reduce((sum, analysis) => sum + analysis.heatScore, 0);
    const totalSkipCount = analyses.reduce((sum, analysis) => sum + analysis.skipCount, 0);

    return {
      totalNumbers: analyses.length,
      hotCount: statusCounts.hot || 0,
      warmCount: statusCounts.warm || 0,
      coldCount: statusCounts.cold || 0,
      frozenCount: statusCounts.frozen || 0,
      averageHeatScore: Math.round(totalHeatScore / analyses.length),
      averageSkipCount: Math.round(totalSkipCount / analyses.length)
    };
  }

  /**
   * Get heat score distribution
   */
  getHeatDistribution(): { range: string; count: number }[] {
    const analyses = Array.from(this.analysisCache.values());
    const distribution = analyses.reduce((acc, analysis) => {
      const range = this.getHeatRange(analysis.heatScore);
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const aStart = parseInt(a.range.split('-')[0]);
        const bStart = parseInt(b.range.split('-')[0]);
        return aStart - bStart;
      });
  }

  private getHeatRange(score: number): string {
    if (score >= 80) return '80-100';
    if (score >= 60) return '60-79';
    if (score >= 40) return '40-59';
    if (score >= 20) return '20-39';
    return '0-19';
  }
}
