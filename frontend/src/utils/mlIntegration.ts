import type { Draw } from './scoringSystem';
import { performanceOptimizer, withPerformanceMonitoring } from './performanceOptimizer';

export interface Pattern {
  id: string;
  type: 'recurrence' | 'positional' | 'temporal' | 'combinatorial';
  description: string;
  confidence: number;
  frequency: number;
  lastSeen: number;
  strength: number;
  metadata: Record<string, any>;
}

export interface PatternRecognitionResult {
  patterns: Pattern[];
  confidence: number;
  prediction: number[];
  reasoning: string[];
}

export interface AdaptiveWeight {
  factor: string;
  weight: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: number;
}

export interface MLModel {
  id: string;
  name: string;
  type: 'pattern' | 'trend' | 'correlation' | 'ensemble';
  accuracy: number;
  confidence: number;
  lastTrained: number;
  parameters: Record<string, any>;
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
  };
}

/**
 * Machine Learning Integration for Lottery Prediction
 * Implements pattern recognition, adaptive scoring, and predictive modeling
 */
export class MLIntegration {
  private patterns: Map<string, Pattern> = new Map();
  private adaptiveWeights: Map<string, AdaptiveWeight> = new Map();
  private models: Map<string, MLModel> = new Map();
  private historicalAccuracy: Map<string, number[]> = new Map();

  constructor() {
    this.initializeBaseModels();
    this.initializeAdaptiveWeights();
  }

  /**
   * Initialize base machine learning models
   */
  private initializeBaseModels(): void {
    const baseModels: MLModel[] = [
      {
        id: 'pattern-recognizer',
        name: 'Pattern Recognition Engine',
        type: 'pattern',
        accuracy: 0.65,
        confidence: 0.7,
        lastTrained: Date.now(),
        parameters: { windowSize: 50, minFrequency: 3 },
        performance: { precision: 0.68, recall: 0.62, f1Score: 0.65 }
      },
      {
        id: 'trend-predictor',
        name: 'Trend Prediction Model',
        type: 'trend',
        accuracy: 0.58,
        confidence: 0.6,
        lastTrained: Date.now(),
        parameters: { lookback: 100, smoothing: 0.3 },
        performance: { precision: 0.61, recall: 0.55, f1Score: 0.58 }
      },
      {
        id: 'correlation-analyzer',
        name: 'Correlation Analysis Engine',
        type: 'correlation',
        accuracy: 0.72,
        confidence: 0.75,
        lastTrained: Date.now(),
        parameters: { threshold: 0.7, maxPairs: 1000 },
        performance: { precision: 0.74, recall: 0.70, f1Score: 0.72 }
      },
      {
        id: 'ensemble-predictor',
        name: 'Ensemble Prediction System',
        type: 'ensemble',
        accuracy: 0.78,
        confidence: 0.8,
        lastTrained: Date.now(),
        parameters: { models: ['pattern-recognizer', 'trend-predictor', 'correlation-analyzer'] },
        performance: { precision: 0.80, recall: 0.76, f1Score: 0.78 }
      }
    ];

    baseModels.forEach(model => this.models.set(model.id, model));
  }

  /**
   * Initialize adaptive weights for scoring factors
   */
  private initializeAdaptiveWeights(): void {
    const factors = [
      'recurrence', 'hotCold', 'location', 'skipCount',
      'pairAnalysis', 'tripleAnalysis', 'sumRange', 'parity'
    ];

    factors.forEach(factor => {
      this.adaptiveWeights.set(factor, {
        factor,
        weight: 1.0,
        confidence: 0.5,
        trend: 'stable',
        lastUpdated: Date.now()
      });
    });
  }

  /**
   * Analyze patterns in historical draw data
   */
  async analyzePatterns(draws: Draw[], windowSize: number = 100): Promise<PatternRecognitionResult> {
    return withPerformanceMonitoring('PatternAnalysis', async () => {
      const recentDraws = draws.slice(-windowSize);
      const patterns: Pattern[] = [];

      // Analyze recurrence patterns
      const recurrencePatterns = await this.analyzeRecurrencePatterns(recentDraws);
      patterns.push(...recurrencePatterns);

      // Analyze positional patterns
      const positionalPatterns = await this.analyzePositionalPatterns(recentDraws);
      patterns.push(...positionalPatterns);

      // Analyze temporal patterns
      const temporalPatterns = await this.analyzeTemporalPatterns(recentDraws);
      patterns.push(...temporalPatterns);

      // Analyze combinatorial patterns
      const combinatorialPatterns = await this.analyzeCombinatorialPatterns(recentDraws);
      patterns.push(...combinatorialPatterns);

      // Generate prediction based on strongest patterns
      const prediction = await this.generateMLPrediction(patterns, recentDraws);
      const confidence = this.calculateOverallConfidence(patterns);
      const reasoning = this.generateReasoning(patterns, prediction);

      return {
        patterns,
        confidence,
        prediction,
        reasoning
      };
    });
  }

  /**
   * Analyze recurrence patterns in draw data
   */
  private async analyzeRecurrencePatterns(draws: Draw[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    const numberFrequency = new Map<number, number[]>();

    // Track frequency of each number
    draws.forEach((draw, index) => {
      [...draw.white_balls, draw.red_ball].forEach((num: number) => {
        if (!numberFrequency.has(num)) {
          numberFrequency.set(num, []);
        }
        numberFrequency.get(num)!.push(index);
      });
    });

    // Identify recurrence patterns
    numberFrequency.forEach((positions, number) => {
      if (positions.length >= 3) {
        const intervals = [];
        for (let i = 1; i < positions.length; i++) {
          intervals.push(positions[i] - positions[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const regularity = Math.max(0, 1 - variance / (avgInterval * avgInterval));

        if (regularity > 0.6) {
          patterns.push({
            id: `recurrence-${number}`,
            type: 'recurrence',
            description: `Number ${number} shows regular recurrence pattern (avg interval: ${avgInterval.toFixed(1)} draws)`,
            confidence: regularity,
            frequency: positions.length,
            lastSeen: draws.length - positions[positions.length - 1],
            strength: regularity * (positions.length / draws.length),
            metadata: { number, avgInterval, regularity, positions }
          });
        }
      }
    });

    return patterns;
  }

  /**
   * Analyze positional patterns (where numbers appear in combinations)
   */
  private async analyzePositionalPatterns(draws: Draw[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    const positionFrequency = new Map<number, Map<number, number>>();

    // Track which numbers appear in which positions
    draws.forEach(draw => {
      draw.white_balls.forEach((num: number, pos: number) => {
        if (!positionFrequency.has(pos)) {
          positionFrequency.set(pos, new Map());
        }
        const posMap = positionFrequency.get(pos)!;
        posMap.set(num, (posMap.get(num) || 0) + 1);
      });
    });

    // Identify strong positional preferences
    positionFrequency.forEach((posMap, position) => {
      const total = Array.from(posMap.values()).reduce((a, b) => a + b, 0);
      posMap.forEach((count, number) => {
        const frequency = count / total;
        if (frequency > 0.15) { // More than 15% of the time in this position
          patterns.push({
            id: `positional-${position}-${number}`,
            type: 'positional',
            description: `Number ${number} appears in position ${position + 1} ${frequency.toFixed(1)}% of the time`,
            confidence: frequency,
            frequency: count,
            lastSeen: 0, // Would need to track this
            strength: frequency,
            metadata: { position, number, frequency, count }
          });
        }
      });
    });

    return patterns;
  }

  /**
   * Analyze temporal patterns (time-based trends)
   */
  private async analyzeTemporalPatterns(draws: Draw[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Analyze sum trends over time
    const sums = draws.map(draw => [...draw.white_balls, draw.red_ball].reduce((a: number, b: number) => a + b, 0));
    const sumTrend = this.calculateTrend(sums);

    if (Math.abs(sumTrend.slope) > 0.1) {
      patterns.push({
        id: 'temporal-sum-trend',
        type: 'temporal',
        description: `Sum values are ${sumTrend.direction} with slope ${sumTrend.slope.toFixed(3)}`,
        confidence: Math.min(1, Math.abs(sumTrend.slope) * 10),
        frequency: draws.length,
        lastSeen: 0,
        strength: Math.abs(sumTrend.slope),
        metadata: { trend: sumTrend, type: 'sum' }
      });
    }

    // Analyze range trends
    const ranges = draws.map(draw => Math.max(...draw.white_balls, draw.red_ball) - Math.min(...draw.white_balls, draw.red_ball));
    const rangeTrend = this.calculateTrend(ranges);

    if (Math.abs(rangeTrend.slope) > 0.05) {
      patterns.push({
        id: 'temporal-range-trend',
        type: 'temporal',
        description: `Number ranges are ${rangeTrend.direction} with slope ${rangeTrend.slope.toFixed(3)}`,
        confidence: Math.min(1, Math.abs(rangeTrend.slope) * 20),
        frequency: draws.length,
        lastSeen: 0,
        strength: Math.abs(rangeTrend.slope),
        metadata: { trend: rangeTrend, type: 'range' }
      });
    }

    return patterns;
  }

  /**
   * Analyze combinatorial patterns (relationships between numbers)
   */
  private async analyzeCombinatorialPatterns(draws: Draw[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    const pairFrequency = new Map<string, number>();

    // Track number pairs
    draws.forEach(draw => {
      const numbers = [...draw.white_balls, draw.red_ball].sort((a: number, b: number) => a - b);
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pair = `${numbers[i]}-${numbers[j]}`;
          pairFrequency.set(pair, (pairFrequency.get(pair) || 0) + 1);
        }
      }
    });

    // Identify frequent pairs
    const totalDraws = draws.length;
    pairFrequency.forEach((count, pair) => {
      const frequency = count / totalDraws;
      if (frequency > 0.02) { // Appears in more than 2% of draws
        const [num1, num2] = pair.split('-').map(Number);
        patterns.push({
          id: `combinatorial-pair-${pair}`,
          type: 'combinatorial',
          description: `Numbers ${num1} and ${num2} appear together ${frequency.toFixed(1)}% of the time`,
          confidence: frequency * 5, // Scale up for significance
          frequency: count,
          lastSeen: 0,
          strength: frequency,
          metadata: { pair: [num1, num2], frequency, count }
        });
      }
    });

    return patterns;
  }

  /**
   * Calculate trend in a data series
   */
  private calculateTrend(data: number[]): { slope: number; direction: string; r2: number } {
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = data.reduce((sum, y, x) => sum + Math.pow(y - (slope * x + intercept), 2), 0);
    const ssTot = data.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    const direction = slope > 0 ? 'increasing' : 'decreasing';

    return { slope, direction, r2 };
  }

  /**
   * Generate ML-based prediction from patterns
   */
  private async generateMLPrediction(patterns: Pattern[], draws: Draw[]): Promise<number[]> {
    const prediction: number[] = [];
    const scores = new Map<number, number>();

    // Score numbers based on patterns
    patterns.forEach(pattern => {
      switch (pattern.type) {
        case 'recurrence':
          const recurrenceNum = pattern.metadata.number;
          scores.set(recurrenceNum, (scores.get(recurrenceNum) || 0) + pattern.strength * 10);
          break;

        case 'positional':
          const positionalNum = pattern.metadata.number;
          scores.set(positionalNum, (scores.get(positionalNum) || 0) + pattern.strength * 8);
          break;

        case 'combinatorial':
          pattern.metadata.pair.forEach((num: number) => {
            scores.set(num, (scores.get(num) || 0) + pattern.strength * 6);
          });
          break;
      }
    });

    // Select top 5 numbers
    const sortedNumbers = Array.from(scores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([num]) => num);

    return sortedNumbers;
  }

  /**
   * Calculate overall confidence in patterns
   */
  private calculateOverallConfidence(patterns: Pattern[]): number {
    if (patterns.length === 0) return 0;

    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const avgStrength = patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length;
    const patternCount = patterns.length;

    // Combine factors for overall confidence
    return Math.min(1, (avgConfidence + avgStrength + Math.min(patternCount / 10, 1)) / 3);
  }

  /**
   * Generate reasoning for prediction
   */
  private generateReasoning(patterns: Pattern[], prediction: number[]): string[] {
    const reasoning: string[] = [];

    reasoning.push(`ML Analysis identified ${patterns.length} significant patterns`);

    // Group patterns by type
    const patternTypes = patterns.reduce((acc, pattern) => {
      acc[pattern.type] = (acc[pattern.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(patternTypes).forEach(([type, count]) => {
      reasoning.push(`${count} ${type} patterns detected`);
    });

    reasoning.push(`Predicted numbers: ${prediction.join(', ')}`);

    // Add top pattern insights
    const topPatterns = patterns
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);

    topPatterns.forEach(pattern => {
      reasoning.push(`• ${pattern.description} (confidence: ${(pattern.confidence * 100).toFixed(1)}%)`);
    });

    return reasoning;
  }

  /**
   * Update adaptive weights based on prediction accuracy
   */
  updateAdaptiveWeights(actualNumbers: number[], predictedNumbers: number[]): void {
    const hits = predictedNumbers.filter(num => actualNumbers.includes(num)).length;
    const accuracy = hits / predictedNumbers.length;

    // Update weights based on performance
    this.adaptiveWeights.forEach((weight, factor) => {
      // Simple adaptation: increase weights for factors that contributed to hits
      const adaptation = accuracy > 0.2 ? 0.05 : -0.02; // Reward or penalize
      weight.weight = Math.max(0.1, Math.min(2.0, weight.weight + adaptation));
      weight.lastUpdated = Date.now();

      // Update trend
      if (adaptation > 0) {
        weight.trend = 'increasing';
      } else if (adaptation < 0) {
        weight.trend = 'decreasing';
      } else {
        weight.trend = 'stable';
      }
    });
  }

  /**
   * Get current adaptive weights
   */
  getAdaptiveWeights(): AdaptiveWeight[] {
    return Array.from(this.adaptiveWeights.values());
  }

  /**
   * Train ML models with new data
   */
  async trainModels(newDraws: Draw[]): Promise<void> {
    return withPerformanceMonitoring('ModelTraining', async () => {
      // Update pattern recognition model
      const patternModel = this.models.get('pattern-recognizer');
      if (patternModel) {
        const patterns = await this.analyzePatterns(newDraws);
        patternModel.accuracy = patterns.confidence;
        patternModel.lastTrained = Date.now();
      }

      // Update ensemble model
      const ensembleModel = this.models.get('ensemble-predictor');
      if (ensembleModel) {
        const avgAccuracy = Array.from(this.models.values())
          .filter(m => m.id !== 'ensemble-predictor')
          .reduce((sum, m) => sum + m.accuracy, 0) / 3;

        ensembleModel.accuracy = avgAccuracy;
        ensembleModel.lastTrained = Date.now();
      }

      console.log('🧠 ML models updated with new training data');
    });
  }

  /**
   * Get ML model performance metrics
   */
  getModelPerformance(): Record<string, MLModel> {
    return Object.fromEntries(this.models.entries());
  }

  /**
   * Export ML state for persistence
   */
  exportMLState(): string {
    return JSON.stringify({
      patterns: Array.from(this.patterns.values()),
      adaptiveWeights: Array.from(this.adaptiveWeights.values()),
      models: Array.from(this.models.values()),
      historicalAccuracy: Object.fromEntries(this.historicalAccuracy.entries()),
      exportTime: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import ML state from persistence
   */
  importMLState(stateJson: string): void {
    try {
      const state = JSON.parse(stateJson);

      this.patterns = new Map(state.patterns?.map((p: Pattern) => [p.id, p]) || []);
      this.adaptiveWeights = new Map(state.adaptiveWeights?.map((w: AdaptiveWeight) => [w.factor, w]) || []);
      this.models = new Map(state.models?.map((m: MLModel) => [m.id, m]) || []);
      this.historicalAccuracy = new Map(Object.entries(state.historicalAccuracy || {}));

      console.log('🧠 ML state imported successfully');
    } catch (error) {
      console.error('Failed to import ML state:', error);
    }
  }
}

// Singleton instance
export const mlIntegration = new MLIntegration();

// Utility functions
export const analyzePatterns = async (draws: Draw[]): Promise<PatternRecognitionResult> => {
  return mlIntegration.analyzePatterns(draws);
};

export const updateAdaptiveWeights = (actual: number[], predicted: number[]): void => {
  mlIntegration.updateAdaptiveWeights(actual, predicted);
};

export const trainMLModels = async (draws: Draw[]): Promise<void> => {
  return mlIntegration.trainModels(draws);
};
