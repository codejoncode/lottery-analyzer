import type { BacktestResult } from '../prediction-engine/types';

/**
 * Accuracy Tracker
 * Tracks and analyzes prediction accuracy over time
 */
export class AccuracyTracker {
  private results: BacktestResult[] = [];
  private rollingWindows: Map<number, BacktestResult[]> = new Map();

  /**
   * Add backtest result to tracking
   */
  addResult(result: BacktestResult): void {
    this.results.push(result);
    this.updateRollingWindows(result);
  }

  /**
   * Add multiple results
   */
  addResults(results: BacktestResult[]): void {
    results.forEach(result => this.addResult(result));
  }

  /**
   * Update rolling windows with new result
   */
  private updateRollingWindows(result: BacktestResult): void {
    const windowSizes = [10, 25, 50, 100];

    windowSizes.forEach(size => {
      if (!this.rollingWindows.has(size)) {
        this.rollingWindows.set(size, []);
      }

      const window = this.rollingWindows.get(size)!;
      window.push(result);

      // Keep only the most recent results
      if (window.length > size) {
        window.shift();
      }
    });
  }

  /**
   * Get accuracy trends over time
   */
  getAccuracyTrends(): {
    overall: number;
    recent: { window: number; accuracy: number; trend: 'improving' | 'declining' | 'stable' }[];
    byMatchType: { [key: string]: number[] };
  } {
    if (this.results.length === 0) {
      return {
        overall: 0,
        recent: [],
        byMatchType: {}
      };
    }

    const overall = this.results.reduce((sum, r) => sum + r.accuracy, 0) / this.results.length;

    const recent = Array.from(this.rollingWindows.entries()).map(([window, results]) => {
      const accuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;

      // Calculate trend (simplified)
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (results.length >= 5) {
        const firstHalf = results.slice(0, Math.floor(results.length / 2));
        const secondHalf = results.slice(Math.floor(results.length / 2));

        const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.accuracy, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.accuracy, 0) / secondHalf.length;

        const diff = secondHalfAvg - firstHalfAvg;
        if (diff > 0.02) trend = 'improving';
        else if (diff < -0.02) trend = 'declining';
      }

      return { window, accuracy, trend };
    });

    // Group accuracies by match type
    const byMatchType: { [key: string]: number[] } = {
      '1-match': [],
      '2-match': [],
      '3-match': [],
      '4-match': [],
      '5-match': []
    };

    this.results.forEach(result => {
      const totalPredictions = result.predictedCombinations.length;
      if (totalPredictions > 0) {
        byMatchType['1-match'].push(result.hits['1-match'] / totalPredictions);
        byMatchType['2-match'].push(result.hits['2-match'] / totalPredictions);
        byMatchType['3-match'].push(result.hits['3-match'] / totalPredictions);
        byMatchType['4-match'].push(result.hits['4-match'] / totalPredictions);
        byMatchType['5-match'].push(result.hits['5-match'] / totalPredictions);
      }
    });

    return { overall, recent, byMatchType };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    totalDraws: number;
    averageAccuracy: number;
    bestAccuracy: number;
    worstAccuracy: number;
    accuracyStdDev: number;
    hitRateDistribution: { [key: string]: { mean: number; stdDev: number; best: number; worst: number } };
    processingTimeStats: { mean: number; median: number; p95: number };
  } {
    if (this.results.length === 0) {
      return {
        totalDraws: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        worstAccuracy: 0,
        accuracyStdDev: 0,
        hitRateDistribution: {},
        processingTimeStats: { mean: 0, median: 0, p95: 0 }
      };
    }

    const accuracies = this.results.map(r => r.accuracy);
    const averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const bestAccuracy = Math.max(...accuracies);
    const worstAccuracy = Math.min(...accuracies);

    // Calculate standard deviation
    const accuracyVariance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - averageAccuracy, 2), 0) / accuracies.length;
    const accuracyStdDev = Math.sqrt(accuracyVariance);

    // Hit rate distribution
    const hitRateDistribution: { [key: string]: { mean: number; stdDev: number; best: number; worst: number } } = {};

    ['1-match', '2-match', '3-match', '4-match', '5-match'].forEach(matchType => {
      const rates = this.results.map(r => {
        const totalPredictions = r.predictedCombinations.length;
        return totalPredictions > 0 ? r.hits[matchType as keyof typeof r.hits] / totalPredictions : 0;
      });

      const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
      const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
      const stdDev = Math.sqrt(variance);

      hitRateDistribution[matchType] = {
        mean,
        stdDev,
        best: Math.max(...rates),
        worst: Math.min(...rates)
      };
    });

    // Processing time statistics
    const processingTimes = this.results.map(r => r.processingTime).sort((a, b) => a - b);
    const mean = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
    const median = processingTimes[Math.floor(processingTimes.length / 2)];
    const p95Index = Math.floor(processingTimes.length * 0.95);
    const p95 = processingTimes[p95Index];

    return {
      totalDraws: this.results.length,
      averageAccuracy,
      bestAccuracy,
      worstAccuracy,
      accuracyStdDev,
      hitRateDistribution,
      processingTimeStats: { mean, median, p95 }
    };
  }

  /**
   * Get prediction quality analysis
   */
  getPredictionQualityAnalysis(): {
    scoreVsAccuracyCorrelation: number;
    topPredictionsPerformance: { topN: number; averageHits: number; averageAccuracy: number }[];
    filterEffectiveness: Map<string, number>;
  } {
    // Calculate correlation between prediction scores and actual hits
    const scoreHitPairs: Array<{ score: number; hits: number }> = [];

    this.results.forEach(result => {
      result.predictedCombinations.forEach(combo => {
        const actualNumbers = new Set(result.actualNumbers);
        const hits = combo.numbers.filter(num => actualNumbers.has(num)).length;
        scoreHitPairs.push({ score: combo.compositeScore, hits });
      });
    });

    let scoreVsAccuracyCorrelation = 0;
    if (scoreHitPairs.length > 1) {
      const scores = scoreHitPairs.map(p => p.score);
      const hits = scoreHitPairs.map(p => p.hits);
      scoreVsAccuracyCorrelation = this.calculateCorrelation(scores, hits);
    }

    // Analyze top N predictions performance
    const topPredictionsPerformance = [5, 10, 20, 50].map(topN => {
      const performances: number[] = [];
      const accuracies: number[] = [];

      this.results.forEach(result => {
        const topCombos = result.predictedCombinations
          .sort((a, b) => b.compositeScore - a.compositeScore)
          .slice(0, topN);

        const totalHits = topCombos.reduce((sum, combo) => {
          const actualNumbers = new Set(result.actualNumbers);
          return sum + combo.numbers.filter(num => actualNumbers.has(num)).length;
        }, 0);

        const averageHits = totalHits / topCombos.length;
        const averageAccuracy = topCombos.length > 0 ?
          topCombos.reduce((sum, combo) => sum + combo.confidence, 0) / topCombos.length : 0;

        performances.push(averageHits);
        accuracies.push(averageAccuracy);
      });

      return {
        topN,
        averageHits: performances.reduce((a, b) => a + b, 0) / performances.length,
        averageAccuracy: accuracies.reduce((a, b) => a + b, 0) / accuracies.length
      };
    });

    // Analyze filter effectiveness (placeholder - would need filter metadata)
    const filterEffectiveness = new Map<string, number>();

    return {
      scoreVsAccuracyCorrelation,
      topPredictionsPerformance,
      filterEffectiveness
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n < 2) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Clear all tracked data
   */
  clear(): void {
    this.results = [];
    this.rollingWindows.clear();
  }

  /**
   * Get all results
   */
  getResults(): BacktestResult[] {
    return [...this.results];
  }

  /**
   * Export analysis to JSON
   */
  exportAnalysis(): string {
    const analysis = {
      trends: this.getAccuracyTrends(),
      metrics: this.getPerformanceMetrics(),
      quality: this.getPredictionQualityAnalysis(),
      exportDate: new Date().toISOString(),
      totalResults: this.results.length
    };

    return JSON.stringify(analysis, null, 2);
  }
}
