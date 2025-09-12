import type { BacktestResult } from '../prediction-engine/types';

/**
 * Validation Metrics
 * Provides statistical validation and significance testing for prediction results
 */
export class ValidationMetrics {
  private results: BacktestResult[] = [];

  /**
   * Set backtest results for analysis
   */
  setResults(results: BacktestResult[]): void {
    this.results = [...results];
  }

  /**
   * Perform statistical significance tests
   */
  performSignificanceTests(): {
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
  } {
    if (this.results.length < 10) {
      return {
        accuracySignificance: { pValue: 1, isSignificant: false, confidence: 0, effectSize: 0 },
        hitRateSignificance: {},
        temporalStability: { autocorrelation: 0, trendSignificance: 1, volatility: 0 }
      };
    }

    const accuracies = this.results.map(r => r.accuracy);
    const accuracySignificance = this.testAccuracySignificance(accuracies);
    const hitRateSignificance = this.testHitRateSignificance();
    const temporalStability = this.analyzeTemporalStability(accuracies);

    return {
      accuracySignificance,
      hitRateSignificance,
      temporalStability
    };
  }

  /**
   * Test if prediction accuracy is significantly better than random
   */
  private testAccuracySignificance(accuracies: number[]): {
    pValue: number;
    isSignificant: boolean;
    confidence: number;
    effectSize: number;
  } {
    const n = accuracies.length;
    const mean = accuracies.reduce((a, b) => a + b, 0) / n;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    // Expected accuracy for random predictions (very low)
    const expectedMean = 0.001; // 0.1% for random guessing
    const tStatistic = (mean - expectedMean) / (stdDev / Math.sqrt(n));

    // Calculate p-value using t-distribution approximation
    const pValue = this.calculatePValue(tStatistic, n - 1);

    // Cohen's d effect size
    const effectSize = (mean - expectedMean) / stdDev;

    return {
      pValue,
      isSignificant: pValue < 0.05,
      confidence: Math.max(0, Math.min(1, 1 - pValue)),
      effectSize
    };
  }

  /**
   * Test significance of hit rates for different match levels
   */
  private testHitRateSignificance(): {
    [key: string]: {
      pValue: number;
      isSignificant: boolean;
      expectedRate: number;
      observedRate: number;
    };
  } {
    const matchTypes = ['1-match', '2-match', '3-match', '4-match', '5-match'];
    const results: { [key: string]: any } = {};

    matchTypes.forEach(matchType => {
      const totalPredictions = this.results.reduce((sum, r) => sum + r.predictedCombinations.length, 0);
      const totalHits = this.results.reduce((sum, r) => sum + r.hits[matchType as keyof typeof r.hits], 0);
      const observedRate = totalHits / totalPredictions;

      // Expected rate for random predictions
      let expectedRate: number;
      switch (matchType) {
        case '1-match': expectedRate = 5/69 * 5; break; // Probability of matching 1 number
        case '2-match': expectedRate = (5/69) * (4/68) * 10; break; // Binomial probability
        case '3-match': expectedRate = (5/69) * (4/68) * (3/67) * 10; break;
        case '4-match': expectedRate = (5/69) * (4/68) * (3/67) * (2/66) * 5; break;
        case '5-match': expectedRate = (5/69) * (4/68) * (3/67) * (2/66) * (1/65); break;
        default: expectedRate = 0.001;
      }

      // Chi-square test for proportions
      const expectedHits = expectedRate * totalPredictions;
      const chiSquare = Math.pow(totalHits - expectedHits, 2) / expectedHits;
      const pValue = this.calculateChiSquarePValue(chiSquare, 1);

      results[matchType] = {
        pValue,
        isSignificant: pValue < 0.05,
        expectedRate,
        observedRate
      };
    });

    return results;
  }

  /**
   * Analyze temporal stability of predictions
   */
  private analyzeTemporalStability(accuracies: number[]): {
    autocorrelation: number;
    trendSignificance: number;
    volatility: number;
  } {
    if (accuracies.length < 5) {
      return { autocorrelation: 0, trendSignificance: 1, volatility: 0 };
    }

    // Calculate autocorrelation (lag-1)
    const mean = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;

    let autocorrelation = 0;
    for (let i = 1; i < accuracies.length; i++) {
      autocorrelation += (accuracies[i] - mean) * (accuracies[i - 1] - mean);
    }
    autocorrelation /= (accuracies.length - 1) * variance;

    // Test for significant trend using Mann-Kendall test approximation
    const trendSignificance = this.calculateTrendSignificance(accuracies);

    // Calculate volatility (standard deviation of differences)
    const differences = [];
    for (let i = 1; i < accuracies.length; i++) {
      differences.push(accuracies[i] - accuracies[i - 1]);
    }
    const volatility = differences.length > 0 ?
      Math.sqrt(differences.reduce((sum, diff) => sum + diff * diff, 0) / differences.length) : 0;

    return { autocorrelation, trendSignificance, volatility };
  }

  /**
   * Calculate p-value for t-distribution (simplified approximation)
   */
  private calculatePValue(tStatistic: number, degreesOfFreedom: number): number {
    // Simplified approximation using normal distribution for large df
    if (degreesOfFreedom > 30) {
      const z = Math.abs(tStatistic);
      return 2 * (1 - this.normalCDF(z));
    }

    // For smaller df, use approximation
    const z = Math.abs(tStatistic) / Math.sqrt(1 + tStatistic * tStatistic / degreesOfFreedom);
    return 2 * (1 - this.normalCDF(z));
  }

  /**
   * Calculate p-value for chi-square distribution (simplified)
   */
  private calculateChiSquarePValue(chiSquare: number, degreesOfFreedom: number): number {
    // Simplified approximation using normal distribution
    const z = Math.sqrt(2 * chiSquare) - Math.sqrt(2 * degreesOfFreedom - 1);
    return 1 - this.normalCDF(z);
  }

  /**
   * Calculate trend significance using simplified Mann-Kendall test
   */
  private calculateTrendSignificance(values: number[]): number {
    const n = values.length;
    let s = 0;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        if (values[j] > values[i]) s++;
        else if (values[j] < values[i]) s--;
      }
    }

    // Normalize S statistic
    const varS = (n * (n - 1) * (2 * n + 5)) / 18;
    const z = s / Math.sqrt(varS);

    // Two-tailed p-value
    return 2 * (1 - this.normalCDF(Math.abs(z)));
  }

  /**
   * Normal cumulative distribution function approximation
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

  /**
   * Generate confidence intervals for key metrics
   */
  calculateConfidenceIntervals(confidenceLevel: number = 0.95): {
    accuracy: { mean: number; lower: number; upper: number };
    hitRates: { [key: string]: { mean: number; lower: number; upper: number } };
  } {
    if (this.results.length < 3) {
      return {
        accuracy: { mean: 0, lower: 0, upper: 0 },
        hitRates: {}
      };
    }

    const accuracies = this.results.map(r => r.accuracy);
    const accuracyCI = this.calculateMeanCI(accuracies, confidenceLevel);

    const hitRates: { [key: string]: { mean: number; lower: number; upper: number } } = {};
    ['1-match', '2-match', '3-match', '4-match', '5-match'].forEach(matchType => {
      const rates = this.results.map(r => {
        const totalPredictions = r.predictedCombinations.length;
        return totalPredictions > 0 ? r.hits[matchType as keyof typeof r.hits] / totalPredictions : 0;
      });
      hitRates[matchType] = this.calculateMeanCI(rates, confidenceLevel);
    });

    return { accuracy: accuracyCI, hitRates };
  }

  /**
   * Calculate confidence interval for mean
   */
  private calculateMeanCI(values: number[], confidenceLevel: number): { mean: number; lower: number; upper: number } {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const standardError = stdDev / Math.sqrt(n);

    // t-value for confidence level (approximated)
    const tValue = confidenceLevel === 0.95 ? 1.96 : 2.576; // 95% or 99%

    const marginOfError = tValue * standardError;

    return {
      mean,
      lower: Math.max(0, mean - marginOfError),
      upper: Math.min(1, mean + marginOfError)
    };
  }

  /**
   * Generate validation report
   */
  generateValidationReport(): string {
    const significance = this.performSignificanceTests();
    const confidenceIntervals = this.calculateConfidenceIntervals();

    const report = {
      summary: {
        totalDraws: this.results.length,
        dateRange: this.results.length > 0 ? {
          start: this.results[0].drawDate,
          end: this.results[this.results.length - 1].drawDate
        } : null
      },
      statisticalSignificance: significance,
      confidenceIntervals,
      recommendations: this.generateRecommendations(significance),
      generatedAt: new Date().toISOString()
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate recommendations based on statistical analysis
   */
  private generateRecommendations(significance: any): string[] {
    const recommendations: string[] = [];

    if (!significance.accuracySignificance.isSignificant) {
      recommendations.push("Prediction accuracy is not statistically significant. Consider refining the prediction algorithm.");
    } else if (significance.accuracySignificance.effectSize < 0.5) {
      recommendations.push("Prediction accuracy shows small effect size. Look for ways to improve prediction quality.");
    } else {
      recommendations.push("Prediction accuracy is statistically significant with good effect size. Continue with current approach.");
    }

    if (Math.abs(significance.temporalStability.autocorrelation) > 0.3) {
      recommendations.push("High autocorrelation detected. Predictions may be influenced by recent trends.");
    }

    if (significance.temporalStability.volatility > 0.1) {
      recommendations.push("High prediction volatility detected. Consider stabilizing the prediction algorithm.");
    }

    const significantHitRates = Object.entries(significance.hitRateSignificance)
      .filter(([_, stats]: [string, any]) => stats.isSignificant)
      .map(([matchType, _]) => matchType);

    if (significantHitRates.length > 0) {
      recommendations.push(`Significant hit rates detected for: ${significantHitRates.join(', ')}`);
    }

    return recommendations;
  }
}
