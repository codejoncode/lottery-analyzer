import type { Draw } from './scoringSystem';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  accuracy: number;
  error: string | null;
  details: {
    totalPredictions: number;
    correctPredictions: number;
    hitRates: {
      '1+': number;
      '2+': number;
      '3+': number;
      '4+': number;
      '5+': number;
      jackpot: number;
    };
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    statisticalSignificance: {
      pValue: number;
      isSignificant: boolean;
    };
  };
}

export interface CrossValidationResult {
  foldResults: ValidationResult[];
  averageAccuracy: number;
  standardDeviation: number;
  overallConfidence: number;
  bestFold: number;
  worstFold: number;
}

export interface PredictionTest {
  id: string;
  name: string;
  predictions: Array<{
    combination: number[];
    confidence: number;
    expectedHits: number;
  }>;
  actualDraw: Draw;
  timestamp: Date;
}

export class PredictionValidator {
  private historicalDraws: Draw[];

  constructor(historicalDraws: Draw[]) {
    this.historicalDraws = [...historicalDraws].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  /**
   * Perform k-fold cross-validation on prediction algorithms
   */
  async performCrossValidation(
    predictionFunction: (trainData: Draw[], testSize: number) => Promise<Array<{
      combination: number[];
      confidence: number;
      expectedHits: number;
    }>>,
    k: number = 5
  ): Promise<CrossValidationResult> {
    if (this.historicalDraws.length < k * 2) {
      throw new Error(`Insufficient data for ${k}-fold cross-validation. Need at least ${k * 2} draws.`);
    }

    const foldSize = Math.floor(this.historicalDraws.length / k);
    const foldResults: ValidationResult[] = [];

    for (let i = 0; i < k; i++) {
      const testStart = i * foldSize;
      const testEnd = (i === k - 1) ? this.historicalDraws.length : (i + 1) * foldSize;

      const testData = this.historicalDraws.slice(testStart, testEnd);
      const trainData = [
        ...this.historicalDraws.slice(0, testStart),
        ...this.historicalDraws.slice(testEnd)
      ];

      try {
        const predictions = await predictionFunction(trainData, testData.length);
        const result = this.validatePredictions(predictions, testData);
        foldResults.push(result);
      } catch (error) {
        console.error(`Fold ${i + 1} failed:`, error);
        foldResults.push({
          isValid: false,
          confidence: 0,
          accuracy: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: {
            totalPredictions: 0,
            correctPredictions: 0,
            hitRates: { '1+': 0, '2+': 0, '3+': 0, '4+': 0, '5+': 0, jackpot: 0 },
            confidenceInterval: { lower: 0, upper: 0 },
            statisticalSignificance: { pValue: 1, isSignificant: false }
          }
        });
      }
    }

    const accuracies = foldResults.map(r => r.accuracy);
    const averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const standardDeviation = Math.sqrt(
      accuracies.reduce((sum, acc) => sum + Math.pow(acc - averageAccuracy, 2), 0) / accuracies.length
    );

    const validResults = foldResults.filter(r => r.isValid);
    const overallConfidence = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length
      : 0;

    return {
      foldResults,
      averageAccuracy,
      standardDeviation,
      overallConfidence,
      bestFold: accuracies.indexOf(Math.max(...accuracies)),
      worstFold: accuracies.indexOf(Math.min(...accuracies))
    };
  }

  /**
   * Validate predictions against actual draw results
   */
  validatePredictions(
    predictions: Array<{
      combination: number[];
      confidence: number;
      expectedHits: number;
    }>,
    actualDraws: Draw[]
  ): ValidationResult {
    if (predictions.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        accuracy: 0,
        error: 'No predictions provided',
        details: {
          totalPredictions: 0,
          correctPredictions: 0,
          hitRates: { '1+': 0, '2+': 0, '3+': 0, '4+': 0, '5+': 0, jackpot: 0 },
          confidenceInterval: { lower: 0, upper: 0 },
          statisticalSignificance: { pValue: 1, isSignificant: false }
        }
      };
    }

    let totalPredictions = 0;
    let correctPredictions = 0;
    const hitCounts = { '1+': 0, '2+': 0, '3+': 0, '4+': 0, '5+': 0, jackpot: 0 };

    // Validate each prediction against each actual draw
    predictions.forEach(prediction => {
      actualDraws.forEach(actualDraw => {
        totalPredictions++;

        const whiteBallMatches = prediction.combination.filter(ball =>
          actualDraw.white_balls.includes(ball)
        ).length;

        const powerballMatch = prediction.combination[5] === actualDraw.red_ball ? 1 : 0;
        const totalMatches = whiteBallMatches + powerballMatch;

        // Count hits by category
        if (totalMatches >= 1) hitCounts['1+']++;
        if (totalMatches >= 2) hitCounts['2+']++;
        if (totalMatches >= 3) hitCounts['3+']++;
        if (totalMatches >= 4) hitCounts['4+']++;
        if (totalMatches >= 5) hitCounts['5+']++;
        if (totalMatches >= 6) hitCounts.jackpot++;

        // Consider prediction "correct" if it matches expected hits or better
        if (totalMatches >= prediction.expectedHits) {
          correctPredictions++;
        }
      });
    });

    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    // Calculate confidence interval using Wilson score interval
    const confidenceInterval = this.calculateConfidenceInterval(correctPredictions, totalPredictions);

    // Calculate statistical significance (p-value for binomial test)
    const expectedAccuracy = 1 / 292201338; // 1 in ~292M for 6/69 + 1/26 Powerball
    const statisticalSignificance = this.calculateStatisticalSignificance(
      correctPredictions,
      totalPredictions,
      expectedAccuracy
    );

    // Overall confidence based on multiple factors
    const confidenceFactors = [
      accuracy,
      Math.min(totalPredictions / 1000, 1), // More predictions = higher confidence
      statisticalSignificance.isSignificant ? 1 : 0.5,
      Math.max(0.1, Math.min(1, totalPredictions / 100)) // Scale confidence with sample size
    ];

    const overallConfidence = confidenceFactors.reduce((a, b) => a * b, 1);

    return {
      isValid: true,
      confidence: Math.max(0, Math.min(1, overallConfidence)),
      accuracy,
      error: null,
      details: {
        totalPredictions,
        correctPredictions,
        hitRates: {
          '1+': totalPredictions > 0 ? hitCounts['1+'] / totalPredictions : 0,
          '2+': totalPredictions > 0 ? hitCounts['2+'] / totalPredictions : 0,
          '3+': totalPredictions > 0 ? hitCounts['3+'] / totalPredictions : 0,
          '4+': totalPredictions > 0 ? hitCounts['4+'] / totalPredictions : 0,
          '5+': totalPredictions > 0 ? hitCounts['5+'] / totalPredictions : 0,
          jackpot: totalPredictions > 0 ? hitCounts.jackpot / totalPredictions : 0
        },
        confidenceInterval,
        statisticalSignificance
      }
    };
  }

  /**
   * Calculate confidence interval using Wilson score interval
   */
  private calculateConfidenceInterval(successes: number, trials: number, _confidence: number = 0.95): { lower: number; upper: number } {
    if (trials === 0) return { lower: 0, upper: 0 };

    const p = successes / trials;
    const z = 1.96; // 95% confidence level
    const denominator = 1 + z * z / trials;
    const center = (p + z * z / (2 * trials)) / denominator;
    const spread = z * Math.sqrt(p * (1 - p) / trials + z * z / (4 * trials * trials)) / denominator;

    return {
      lower: Math.max(0, center - spread),
      upper: Math.min(1, center + spread)
    };
  }

  /**
   * Calculate statistical significance using binomial test
   */
  private calculateStatisticalSignificance(
    successes: number,
    trials: number,
    expectedProbability: number
  ): { pValue: number; isSignificant: boolean } {
    if (trials === 0) return { pValue: 1, isSignificant: false };

    // Use normal approximation for large samples
    const p = successes / trials;
    const se = Math.sqrt(expectedProbability * (1 - expectedProbability) / trials);
    const z = (p - expectedProbability) / se;

    // Two-tailed test
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    return {
      pValue,
      isSignificant: pValue < 0.05 // 95% confidence level
    };
  }

  /**
   * Normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - probability : probability;
  }

  /**
   * Perform A/B testing between two prediction algorithms
   */
  async performABTest(
    algorithmA: {
      name: string;
      predictor: (trainData: Draw[], testSize: number) => Promise<Array<{
        combination: number[];
        confidence: number;
        expectedHits: number;
      }>>;
    },
    algorithmB: {
      name: string;
      predictor: (trainData: Draw[], testSize: number) => Promise<Array<{
        combination: number[];
        confidence: number;
        expectedHits: number;
      }>>;
    },
    testDraws: Draw[]
  ): Promise<{
    winner: string | null;
    confidence: number;
    algorithmAResult: ValidationResult;
    algorithmBResult: ValidationResult;
    significance: { pValue: number; isSignificant: boolean };
  }> {
    const trainData = this.historicalDraws.filter(draw =>
      !testDraws.some(testDraw => testDraw.date === draw.date)
    );

    const [resultA, resultB] = await Promise.all([
      this.validatePredictions(await algorithmA.predictor(trainData, testDraws.length), testDraws),
      this.validatePredictions(await algorithmB.predictor(trainData, testDraws.length), testDraws)
    ]);

    // Perform statistical test to determine if difference is significant
    const diff = resultA.accuracy - resultB.accuracy;
    const pooledSE = Math.sqrt(
      (resultA.accuracy * (1 - resultA.accuracy) / resultA.details.totalPredictions) +
      (resultB.accuracy * (1 - resultB.accuracy) / resultB.details.totalPredictions)
    );

    const z = Math.abs(diff) / pooledSE;
    const pValue = 2 * (1 - this.normalCDF(z));
    const isSignificant = pValue < 0.05;

    let winner = null;
    let confidence = 0;

    if (isSignificant) {
      winner = resultA.accuracy > resultB.accuracy ? algorithmA.name : algorithmB.name;
      confidence = 1 - pValue;
    }

    return {
      winner,
      confidence,
      algorithmAResult: resultA,
      algorithmBResult: resultB,
      significance: { pValue, isSignificant }
    };
  }

  /**
   * Calculate prediction confidence based on historical performance
   */
  calculatePredictionConfidence(
    predictions: Array<{
      combination: number[];
      historicalFrequency: number;
      recencyScore: number;
      patternStrength: number;
    }>
  ): number {
    if (predictions.length === 0) return 0;

    const weights = {
      historicalFrequency: 0.4,
      recencyScore: 0.3,
      patternStrength: 0.3
    };

    const averageConfidence = predictions.reduce((sum, pred) => {
      return sum + (
        pred.historicalFrequency * weights.historicalFrequency +
        pred.recencyScore * weights.recencyScore +
        pred.patternStrength * weights.patternStrength
      );
    }, 0) / predictions.length;

    // Apply diminishing returns for overconfidence
    return Math.min(averageConfidence, 0.95);
  }
}

// Utility functions for validation
export const calculateExpectedAccuracy = (totalNumbers: number = 292201338): number => {
  return 1 / totalNumbers;
};

export const calculateHitProbability = (
  whiteBallsMatched: number,
  powerballMatched: boolean,
  totalWhiteBalls: number = 69,
  totalPowerballs: number = 26
): number => {
  const whiteBallProb = combinations(totalWhiteBalls - whiteBallsMatched, 5 - whiteBallsMatched) /
                        combinations(totalWhiteBalls, 5);
  const powerballProb = powerballMatched ? (1 / totalPowerballs) : (1 - 1 / totalPowerballs);

  return whiteBallProb * powerballProb;
};

const combinations = (n: number, k: number): number => {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;

  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = result * (n - k + i) / i;
  }

  return result;
};
