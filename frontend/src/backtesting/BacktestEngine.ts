import type { Draw } from '../utils/scoringSystem';
import type { Combination, BacktestResult, PredictionResult } from '../prediction-engine/types';
import { PredictionEngine } from '../prediction-engine/PredictionEngine';

/**
 * Backtesting Engine
 * Validates prediction accuracy by comparing predictions against historical draws
 */
export class BacktestEngine {
  private draws: Draw[] = [];
  private predictionEngine: PredictionEngine;
  private results: BacktestResult[] = [];

  constructor(draws: Draw[] = []) {
    this.draws = draws;
    this.predictionEngine = new PredictionEngine(draws);
  }

  /**
   * Update draws and refresh prediction engine
   */
  updateDraws(draws: Draw[]): void {
    this.draws = draws;
    this.predictionEngine.updateDraws(draws);
    this.results = []; // Clear cached results
  }

  /**
   * Run backtest for a specific draw
   */
  async backtestDraw(drawIndex: number, options: {
    maxPredictions?: number;
    enabledFilters?: string[];
    minScore?: number;
  } = {}): Promise<BacktestResult> {
    if (drawIndex >= this.draws.length) {
      throw new Error(`Draw index ${drawIndex} is out of range`);
    }

    const targetDraw = this.draws[drawIndex];
    const historicalDraws = this.draws.slice(0, drawIndex); // Only use draws before this one

    console.log(`🔬 Backtesting draw ${drawIndex} (${targetDraw.date})`);

    // Update prediction engine with historical data only
    this.predictionEngine.updateDraws(historicalDraws);

    const startTime = performance.now();

    // Generate predictions
    const predictionResult: PredictionResult = await this.predictionEngine.generatePredictions({
      maxCombinations: options.maxPredictions || 100,
      enabledFilters: options.enabledFilters || [],
      minScore: options.minScore || 0
    });

    const processingTime = performance.now() - startTime;

    // Calculate hits
    const hits = this.calculateHits(targetDraw, predictionResult.combinations);

    // Calculate accuracy metrics
    const accuracy = this.calculateAccuracy(hits, predictionResult.combinations.length);
    const scores = predictionResult.combinations.map(c => c.compositeScore);
    const topScore = Math.max(...scores);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const result: BacktestResult = {
      drawId: drawIndex,
      drawDate: targetDraw.date,
      actualNumbers: targetDraw.white_balls,
      predictedCombinations: predictionResult.combinations,
      hits,
      accuracy,
      topScore,
      averageScore,
      processingTime
    };

    console.log(`✅ Backtest complete - Accuracy: ${(accuracy * 100).toFixed(1)}%`);

    return result;
  }

  /**
   * Run backtest for multiple draws
   */
  async backtestMultipleDraws(options: {
    startDraw?: number;
    endDraw?: number;
    maxPredictions?: number;
    enabledFilters?: string[];
    minScore?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}): Promise<BacktestResult[]> {
    const {
      startDraw = Math.max(0, this.draws.length - 100), // Last 100 draws by default
      endDraw = this.draws.length - 1,
      maxPredictions = 50,
      enabledFilters = [],
      minScore = 0,
      onProgress
    } = options;

    const results: BacktestResult[] = [];
    const totalDraws = endDraw - startDraw + 1;

    console.log(`🔬 Running backtest for ${totalDraws} draws (${startDraw} to ${endDraw})`);

    for (let i = startDraw; i <= endDraw; i++) {
      try {
        const result = await this.backtestDraw(i, {
          maxPredictions,
          enabledFilters,
          minScore
        });
        results.push(result);

        if (onProgress) {
          onProgress(i - startDraw + 1, totalDraws);
        }
      } catch (error) {
        console.error(`❌ Failed to backtest draw ${i}:`, error);
      }
    }

    this.results = results;
    console.log(`✅ Backtest complete - ${results.length}/${totalDraws} draws processed`);

    return results;
  }

  /**
   * Calculate hits for a specific draw
   */
  private calculateHits(targetDraw: Draw, predictions: Combination[]): BacktestResult['hits'] {
    const actualNumbers = new Set(targetDraw.white_balls);
    const hits = {
      '1-match': 0,
      '2-match': 0,
      '3-match': 0,
      '4-match': 0,
      '5-match': 0
    };

    predictions.forEach(prediction => {
      const matchedNumbers = prediction.numbers.filter(num => actualNumbers.has(num));
      const matchCount = matchedNumbers.length;

      if (matchCount >= 1 && matchCount <= 5) {
        hits[`${matchCount}-match` as keyof typeof hits]++;
      }
    });

    return hits;
  }

  /**
   * Calculate overall accuracy
   */
  private calculateAccuracy(hits: BacktestResult['hits'], totalPredictions: number): number {
    if (totalPredictions === 0) return 0;

    // Weight different match levels
    const weightedHits =
      hits['5-match'] * 5 +
      hits['4-match'] * 4 +
      hits['3-match'] * 3 +
      hits['2-match'] * 2 +
      hits['1-match'] * 1;

    const maxPossibleHits = totalPredictions * 5;
    return weightedHits / maxPossibleHits;
  }

  /**
   * Get backtest statistics
   */
  getBacktestStatistics(results: BacktestResult[] = this.results): {
    totalDraws: number;
    averageAccuracy: number;
    averageScore: number;
    totalHits: BacktestResult['hits'];
    hitRates: { [key: string]: number };
    averageProcessingTime: number;
    bestDraw: { index: number; accuracy: number; date: string };
    worstDraw: { index: number; accuracy: number; date: string };
    scoreCorrelation: number;
  } {
    if (results.length === 0) {
      return {
        totalDraws: 0,
        averageAccuracy: 0,
        averageScore: 0,
        totalHits: { '1-match': 0, '2-match': 0, '3-match': 0, '4-match': 0, '5-match': 0 },
        hitRates: {},
        averageProcessingTime: 0,
        bestDraw: { index: -1, accuracy: 0, date: '' },
        worstDraw: { index: -1, accuracy: 0, date: '' },
        scoreCorrelation: 0
      };
    }

    const totalDraws = results.length;
    const averageAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalDraws;
    const averageProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / totalDraws;

    // Aggregate hits
    const totalHits = results.reduce((acc, result) => {
      acc['1-match'] += result.hits['1-match'];
      acc['2-match'] += result.hits['2-match'];
      acc['3-match'] += result.hits['3-match'];
      acc['4-match'] += result.hits['4-match'];
      acc['5-match'] += result.hits['5-match'];
      return acc;
    }, { '1-match': 0, '2-match': 0, '3-match': 0, '4-match': 0, '5-match': 0 });

    // Calculate hit rates
    const totalPredictions = results.reduce((sum, r) => sum + r.predictedCombinations.length, 0);
    const hitRates = {
      '1-match': totalHits['1-match'] / totalPredictions,
      '2-match': totalHits['2-match'] / totalPredictions,
      '3-match': totalHits['3-match'] / totalPredictions,
      '4-match': totalHits['4-match'] / totalPredictions,
      '5-match': totalHits['5-match'] / totalPredictions
    };

    // Find best and worst draws
    let bestDraw = { index: -1, accuracy: -1, date: '' };
    let worstDraw = { index: -1, accuracy: 2, date: '' };

    results.forEach((result, _index) => {
      if (result.accuracy > bestDraw.accuracy) {
        bestDraw = { index: result.drawId, accuracy: result.accuracy, date: result.drawDate };
      }
      if (result.accuracy < worstDraw.accuracy) {
        worstDraw = { index: result.drawId, accuracy: result.accuracy, date: result.drawDate };
      }
    });

    // Calculate score correlation (simplified)
    const scoreCorrelation = this.calculateScoreCorrelation(results);
    const averageScore = results.reduce((sum, r) => sum + r.averageScore, 0) / totalDraws;

    return {
      totalDraws,
      averageAccuracy,
      averageScore,
      totalHits,
      hitRates,
      averageProcessingTime,
      bestDraw,
      worstDraw,
      scoreCorrelation
    };
  }

  /**
   * Calculate correlation between prediction scores and actual hits
   */
  private calculateScoreCorrelation(results: BacktestResult[]): number {
    const scoreHitPairs: Array<{ score: number; hits: number }> = [];

    results.forEach(result => {
      result.predictedCombinations.forEach(combo => {
        const actualNumbers = new Set(result.actualNumbers);
        const hits = combo.numbers.filter(num => actualNumbers.has(num)).length;
        scoreHitPairs.push({ score: combo.compositeScore, hits });
      });
    });

    if (scoreHitPairs.length < 2) return 0;

    // Simple correlation calculation
    const n = scoreHitPairs.length;
    const sumX = scoreHitPairs.reduce((sum, pair) => sum + pair.score, 0);
    const sumY = scoreHitPairs.reduce((sum, pair) => sum + pair.hits, 0);
    const sumXY = scoreHitPairs.reduce((sum, pair) => sum + pair.score * pair.hits, 0);
    const sumX2 = scoreHitPairs.reduce((sum, pair) => sum + pair.score * pair.score, 0);
    const sumY2 = scoreHitPairs.reduce((sum, pair) => sum + pair.hits * pair.hits, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Export backtest results to CSV
   */
  exportResultsToCSV(results: BacktestResult[] = this.results): string {
    const headers = [
      'Draw ID',
      'Date',
      'Actual Numbers',
      'Total Predictions',
      '1-Match Hits',
      '2-Match Hits',
      '3-Match Hits',
      '4-Match Hits',
      '5-Match Hits',
      'Accuracy',
      'Top Score',
      'Average Score',
      'Processing Time (ms)'
    ];

    const rows = results.map(result => [
      result.drawId.toString(),
      result.drawDate,
      result.actualNumbers.join(' '),
      result.predictedCombinations.length.toString(),
      result.hits['1-match'].toString(),
      result.hits['2-match'].toString(),
      result.hits['3-match'].toString(),
      result.hits['4-match'].toString(),
      result.hits['5-match'].toString(),
      result.accuracy.toFixed(4),
      result.topScore.toFixed(2),
      result.averageScore.toFixed(2),
      result.processingTime.toFixed(2)
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Get cached results
   */
  getResults(): BacktestResult[] {
    return [...this.results];
  }

  /**
   * Clear cached results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Get prediction engine for advanced usage
   */
  getPredictionEngine(): PredictionEngine {
    return this.predictionEngine;
  }
}
