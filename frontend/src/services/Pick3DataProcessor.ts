import type { Pick3Draw } from './Pick3DataManager';

export interface PatternAnalysis {
  repeating: string[];
  alternating: string[];
  trending: string[];
}

export interface RandomGroup {
  id: number;
  numbers: string[];
  average: number;
  totalSkips: number;
  lastDrawDate?: string;
  hotNumbers: string[];
  dueNumbers: string[];
  score: number;
  confidence: number;
  predictedNumbers: string[];
}

export interface GroupPrediction {
  groupId: number;
  predictedNumbers: string[];
  confidence: number;
  reasoning: string[];
  expectedDrawDate: string;
}

export interface BacktestResult {
  date: string;
  predictedNumbers: string[];
  actualNumbers: string[];
  hits: {
    straight: string[];
    box: string[];
  };
  accuracy: {
    straight: number;
    box: number;
  };
  confidence: number;
}

export interface BacktestSummary {
  totalTests: number;
  averageAccuracy: {
    straight: number;
    box: number;
  };
  bestPerformingDays: string[];
  worstPerformingDays: string[];
  confidenceCorrelation: number;
  overallScore: number;
}

export interface GroupAnalysis {
  groups: RandomGroup[];
  overallStats: {
    totalNumbers: number;
    averageGroupSize: number;
    coveragePercentage: number;
  };
}

export interface ColumnData {
  position: number; // 0, 1, or 2 for hundreds, tens, units
  digit: number;
  frequency: number;
  lastSeen: string;
  skipCount: number;
  hotStreak: number;
  coldStreak: number;
}

export interface ColumnAnalysis {
  date: string;
  columns: ColumnData[];
  patterns: {
    repeating: string[];
    alternating: string[];
    trending: string[];
  };
  predictions: {
    nextMidday: string;
    nextEvening: string;
    confidence: number;
  };
}

export class Pick3DataProcessor {
  private draws: Pick3Draw[];

  constructor(draws: Pick3Draw[] = []) {
    this.draws = draws.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  public updateDraws(draws: Pick3Draw[]): void {
    this.draws = draws.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  public getColumnStraightData(): ColumnAnalysis[] {
    const analyses: ColumnAnalysis[] = [];

    // Need at least 3 draws to start analysis
    if (this.draws.length < 3) {
      return analyses;
    }

    for (let i = 2; i < this.draws.length; i++) {
      const currentDraw = this.draws[i];
      const prevDraws = this.draws.slice(Math.max(0, i - 2), i + 1);

      const analysis = this.analyzeColumns(currentDraw, prevDraws);
      analyses.push(analysis);
    }

    return analyses;
  }

  private analyzeColumns(currentDraw: Pick3Draw, prevDraws: Pick3Draw[]): ColumnAnalysis {
    const columns: ColumnData[] = [];

    // Analyze each position (0=hundreds, 1=tens, 2=units)
    for (let position = 0; position < 3; position++) {
      const columnData = this.analyzeColumnPosition(position, currentDraw, prevDraws);
      columns.push(columnData);
    }

    const patterns = this.identifyPatterns(prevDraws);
    const predictions = this.generatePredictions(columns, patterns);

    return {
      date: currentDraw.date,
      columns,
      patterns,
      predictions
    };
  }

  private analyzeColumnPosition(position: number, currentDraw: Pick3Draw, prevDraws: Pick3Draw[]): ColumnData {
    const currentDigits = this.extractDigits(currentDraw);
    const currentDigit = currentDigits[position];

    let frequency = 0;
    let lastSeen = currentDraw.date;
    let skipCount = 0;
    let hotStreak = 0;
    let coldStreak = 0;

    // Analyze previous draws
    for (let i = prevDraws.length - 2; i >= 0; i--) {
      const draw = prevDraws[i];
      const digits = this.extractDigits(draw);
      const digit = digits[position];

      if (digit === currentDigit) {
        frequency++;
        lastSeen = draw.date;
        hotStreak++;
        coldStreak = 0;
      } else {
        skipCount++;
        hotStreak = 0;
        coldStreak++;
      }
    }

    return {
      position,
      digit: currentDigit,
      frequency,
      lastSeen,
      skipCount,
      hotStreak,
      coldStreak
    };
  }

  private extractDigits(draw: Pick3Draw): number[] {
    const digits: number[] = [];

    // Try midday first, then evening
    const number = draw.midday || draw.evening;
    if (number) {
      for (let i = 0; i < number.length; i++) {
        digits.push(parseInt(number[i]));
      }
    }

    // Pad with zeros if needed
    while (digits.length < 3) {
      digits.push(0);
    }

    return digits;
  }

  private identifyPatterns(prevDraws: Pick3Draw[]): {
    repeating: string[];
    alternating: string[];
    trending: string[];
  } {
    const repeating: string[] = [];
    const alternating: string[] = [];
    const trending: string[] = [];

    if (prevDraws.length < 3) {
      return { repeating, alternating, trending };
    }

    // Check for repeating patterns
    for (let pos = 0; pos < 3; pos++) {
      const digits = prevDraws.map(draw => this.extractDigits(draw)[pos]);
      if (digits[0] === digits[1] && digits[1] === digits[2]) {
        repeating.push(`Position ${pos}: ${digits[0]} repeating`);
      }
    }

    // Check for alternating patterns
    for (let pos = 0; pos < 3; pos++) {
      const digits = prevDraws.map(draw => this.extractDigits(draw)[pos]);
      if (Math.abs(digits[0] - digits[1]) === 1 && Math.abs(digits[1] - digits[2]) === 1) {
        alternating.push(`Position ${pos}: alternating around ${digits[1]}`);
      }
    }

    // Check for trending patterns
    for (let pos = 0; pos < 3; pos++) {
      const digits = prevDraws.map(draw => this.extractDigits(draw)[pos]);
      const diff1 = digits[1] - digits[0];
      const diff2 = digits[2] - digits[1];

      if (diff1 > 0 && diff2 > 0) {
        trending.push(`Position ${pos}: increasing trend`);
      } else if (diff1 < 0 && diff2 < 0) {
        trending.push(`Position ${pos}: decreasing trend`);
      }
    }

    return { repeating, alternating, trending };
  }

  private generatePredictions(columns: ColumnData[], patterns: PatternAnalysis): {
    nextMidday: string;
    nextEvening: string;
    confidence: number;
  } {
    // Simple prediction algorithm based on column analysis
    const predictedDigits = columns.map(col => {
      // If digit is hot (high frequency, low skip), keep it
      if (col.frequency > 1 && col.skipCount < 2) {
        return col.digit;
      }

      // If digit is cold (high skip, low frequency), change it
      if (col.skipCount > 2 && col.frequency === 0) {
        // Simple prediction: add 1 or subtract 1
        return (col.digit + 1) % 10;
      }

      // Default: keep the same
      return col.digit;
    });

    const nextMidday = predictedDigits.join('');
    const nextEvening = predictedDigits.map(d => (d + 1) % 10).join(''); // Slight variation for evening

    // Calculate confidence based on pattern strength
    let confidence = 50; // Base confidence
    confidence += patterns.repeating.length * 10;
    confidence += patterns.alternating.length * 5;
    confidence += patterns.trending.length * 5;
    confidence = Math.min(confidence, 95); // Cap at 95%

    return {
      nextMidday,
      nextEvening,
      confidence
    };
  }

  public getDrawsWithMissingData(): Pick3Draw[] {
    return this.draws.filter(draw => !draw.midday || !draw.evening);
  }

  public getCompleteDraws(): Pick3Draw[] {
    return this.draws.filter(draw => draw.midday && draw.evening);
  }

  public getStatistics(): {
    totalDraws: number;
    completeDraws: number;
    incompleteDraws: number;
    averageDigits: number[];
    mostFrequentDigits: number[];
    dateRange: { start: string; end: string } | null;
  } {
    const completeDraws = this.getCompleteDraws();
    const digitCounts = [new Array(10).fill(0), new Array(10).fill(0), new Array(10).fill(0)];

    completeDraws.forEach(draw => {
      const middayDigits = this.extractDigits(draw);
      middayDigits.forEach((digit, pos) => {
        digitCounts[pos][digit]++;
      });

      if (draw.evening) {
        const eveningDigits = draw.evening.split('').map(d => parseInt(d));
        eveningDigits.forEach((digit, pos) => {
          digitCounts[pos][digit]++;
        });
      }
    });

    const averageDigits = digitCounts.map(counts => {
      const total = counts.reduce((sum, count) => sum + count, 0);
      const weightedSum = counts.reduce((sum, count, digit) => sum + count * digit, 0);
      return total > 0 ? weightedSum / total : 0;
    });

    const mostFrequentDigits = digitCounts.map(counts => {
      let maxCount = 0;
      let maxDigit = 0;
      counts.forEach((count, digit) => {
        if (count > maxCount) {
          maxCount = count;
          maxDigit = digit;
        }
      });
      return maxDigit;
    });

    let dateRange = null;
    if (this.draws.length > 0) {
      dateRange = {
        start: this.draws[0].date,
        end: this.draws[this.draws.length - 1].date
      };
    }

    return {
      totalDraws: this.draws.length,
      completeDraws: completeDraws.length,
      incompleteDraws: this.draws.length - completeDraws.length,
      averageDigits,
      mostFrequentDigits,
      dateRange
    };
  }

  /**
   * Generate 50 random groups of 20 Pick3 numbers each with balanced distribution
   */
  public generateRandomGroups(): GroupAnalysis {
    const allNumbers = this.generateAllPossibleNumbers();
    const groups: RandomGroup[] = [];
    const numbersPerGroup = 20;
    const totalGroups = 50;

    // Shuffle the array for random distribution
    const shuffledNumbers = [...allNumbers].sort(() => Math.random() - 0.5);

    for (let i = 0; i < totalGroups; i++) {
      const startIndex = i * numbersPerGroup;
      const endIndex = startIndex + numbersPerGroup;
      const groupNumbers = shuffledNumbers.slice(startIndex, endIndex);

      const group: RandomGroup = {
        id: i + 1,
        numbers: groupNumbers,
        average: 0,
        totalSkips: 0,
        hotNumbers: [],
        dueNumbers: [],
        score: 0,
        confidence: 0,
        predictedNumbers: []
      };

      groups.push(group);
    }

    // Analyze each group with current draw data
    this.analyzeGroups(groups);

    const overallStats = {
      totalNumbers: allNumbers.length,
      averageGroupSize: numbersPerGroup,
      coveragePercentage: (groups.length * numbersPerGroup / allNumbers.length) * 100
    };

    return {
      groups,
      overallStats
    };
  }

  /**
   * Generate all possible Pick3 numbers (000-999)
   */
  private generateAllPossibleNumbers(): string[] {
    const numbers: string[] = [];
    for (let i = 0; i < 1000; i++) {
      numbers.push(i.toString().padStart(3, '0'));
    }
    return numbers;
  }

  /**
   * Analyze groups based on historical draw data
   */
  private analyzeGroups(groups: RandomGroup[]): void {
    const recentDraws = this.getRecentDraws(30); // Last 30 draws for analysis

    groups.forEach(group => {
      const numberStats: { [key: string]: { skips: number; lastSeen?: string } } = {};

      // Initialize stats for each number in the group
      group.numbers.forEach(number => {
        numberStats[number] = { skips: 0 };
      });

      // Analyze each recent draw
      recentDraws.forEach(draw => {
        const drawNumbers = [draw.midday, draw.evening].filter(n => n) as string[];

        group.numbers.forEach(number => {
          if (drawNumbers.includes(number)) {
            numberStats[number].lastSeen = draw.date;
            numberStats[number].skips = 0;
          } else {
            numberStats[number].skips++;
          }
        });
      });

      // Calculate group statistics
      const skipValues = Object.values(numberStats).map(stat => stat.skips);
      group.totalSkips = skipValues.reduce((sum, skips) => sum + skips, 0);
      group.average = group.totalSkips / group.numbers.length;

      // Identify hot and due numbers
      group.hotNumbers = Object.entries(numberStats)
        .filter(([_, stat]) => stat.skips <= 2)
        .map(([number, _]) => number);

      group.dueNumbers = Object.entries(numberStats)
        .filter(([_, stat]) => stat.skips >= 10)
        .sort((a, b) => b[1].skips - a[1].skips)
        .slice(0, 5)
        .map(([number, _]) => number);

      // Calculate group score and confidence
      group.score = this.calculateGroupScore(group, numberStats);
      group.confidence = this.calculateGroupConfidence(group, numberStats);
      group.predictedNumbers = this.generateGroupPredictions(group, numberStats);
    });
  }

  /**
   * Get recent draws for analysis
   */
  private getRecentDraws(count: number): Pick3Draw[] {
    return this.draws.slice(-count);
  }

  /**
   * Get analysis for a specific group
   */
  public getGroupAnalysis(groupId: number): RandomGroup | null {
    const analysis = this.generateRandomGroups();
    return analysis.groups.find(group => group.id === groupId) || null;
  }

  /**
   * Get the best performing groups based on due numbers
   */
  public getBestGroups(limit: number = 10): RandomGroup[] {
    const analysis = this.generateRandomGroups();
    return analysis.groups
      .sort((a, b) => b.dueNumbers.length - a.dueNumbers.length)
      .slice(0, limit);
  }

  /**
   * Calculate a score for the group based on due numbers and skip patterns
   */
  private calculateGroupScore(group: RandomGroup, numberStats: { [key: string]: { skips: number; lastSeen?: string } }): number {
    let score = 0;

    // Points for due numbers (numbers that haven't appeared recently)
    score += group.dueNumbers.length * 15;

    // Points for numbers with high skip counts
    const highSkipNumbers = Object.values(numberStats).filter(stat => stat.skips >= 15).length;
    score += highSkipNumbers * 10;

    // Bonus points for groups with balanced skip distribution
    const skipValues = Object.values(numberStats).map(stat => stat.skips);
    const variance = this.calculateVariance(skipValues);
    if (variance < 50) {
      score += 20; // Bonus for balanced groups
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate confidence level for the group's predictions
   */
  private calculateGroupConfidence(group: RandomGroup, _numberStats: { [key: string]: { skips: number; lastSeen?: string } }): number {
    let confidence = 50; // Base confidence

    // Higher confidence with more due numbers
    confidence += group.dueNumbers.length * 8;

    // Higher confidence with more hot numbers (recent activity)
    confidence += group.hotNumbers.length * 5;

    // Confidence based on data availability
    const recentDraws = this.getRecentDraws(30);
    if (recentDraws.length >= 20) {
      confidence += 15;
    } else if (recentDraws.length >= 10) {
      confidence += 5;
    }

    return Math.min(confidence, 95); // Cap at 95%
  }

  /**
   * Generate predictions for the group based on analysis
   */
  private generateGroupPredictions(group: RandomGroup, numberStats: { [key: string]: { skips: number; lastSeen?: string } }): string[] {
    const predictions: string[] = [];

    // Prioritize due numbers for predictions
    predictions.push(...group.dueNumbers.slice(0, 3));

    // Add some hot numbers for balance
    const remainingHotNumbers = group.hotNumbers.filter(num => !predictions.includes(num));
    predictions.push(...remainingHotNumbers.slice(0, 2));

    // Fill remaining slots with numbers that have moderate skip counts
    const moderateSkipNumbers = Object.entries(numberStats)
      .filter(([number, stat]) => !predictions.includes(number) && stat.skips >= 5 && stat.skips < 10)
      .sort((a, b) => b[1].skips - a[1].skips)
      .slice(0, 3)
      .map(([number, _]) => number);

    predictions.push(...moderateSkipNumbers);

    return predictions.slice(0, 8); // Return top 8 predictions
  }

  /**
   * Calculate variance of an array of numbers
   */
  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  /**
   * Get group-based predictions for upcoming draws
   */
  public getGroupPredictions(): GroupPrediction[] {
    const analysis = this.generateRandomGroups();
    const predictions: GroupPrediction[] = [];

    // Get top 5 groups by score
    const topGroups = analysis.groups
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    topGroups.forEach(group => {
      const reasoning = [
        `${group.dueNumbers.length} due numbers (skipped 10+ draws)`,
        `${group.hotNumbers.length} hot numbers (recent activity)`,
        `Average skips: ${group.average.toFixed(1)}`,
        `Group score: ${group.score}/100`
      ];

      predictions.push({
        groupId: group.id,
        predictedNumbers: group.predictedNumbers,
        confidence: group.confidence,
        reasoning,
        expectedDrawDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
      });
    });

    return predictions;
  }

  /**
   * Get detailed analysis for group-based due draw detection
   */
  public getDueDrawAnalysis(): {
    mostDueGroups: RandomGroup[];
    upcomingPredictions: GroupPrediction[];
    overallStats: {
      averageGroupScore: number;
      totalDueNumbers: number;
      coveragePercentage: number;
    };
  } {
    const analysis = this.generateRandomGroups();
    const mostDueGroups = analysis.groups
      .sort((a, b) => b.dueNumbers.length - a.dueNumbers.length)
      .slice(0, 10);

    const upcomingPredictions = this.getGroupPredictions();

    const averageGroupScore = analysis.groups.reduce((sum, group) => sum + group.score, 0) / analysis.groups.length;
    const totalDueNumbers = analysis.groups.reduce((sum, group) => sum + group.dueNumbers.length, 0);

    return {
      mostDueGroups,
      upcomingPredictions,
      overallStats: {
        averageGroupScore,
        totalDueNumbers,
        coveragePercentage: analysis.overallStats.coveragePercentage
      }
    };
  }

  /**
   * Run backtesting analysis on historical predictions vs actual results
   */
  public runBacktest(testDays: number = 30): BacktestResult[] {
    const results: BacktestResult[] = [];
    const testDraws = this.getRecentDraws(testDays + 1); // +1 for prediction generation

    if (testDraws.length < testDays + 1) {
      return results; // Not enough data
    }

    for (let i = 1; i <= testDays; i++) {
      const actualDraw = testDraws[testDraws.length - i];

      // Generate predictions based on data up to prediction date
      const tempProcessor = new Pick3DataProcessor(testDraws.slice(0, testDraws.length - i));
      const groupPredictions = tempProcessor.getGroupPredictions();

      // Combine predictions from top groups
      const allPredictedNumbers = new Set<string>();
      groupPredictions.slice(0, 3).forEach(prediction => {
        prediction.predictedNumbers.forEach(num => allPredictedNumbers.add(num));
      });

      const predictedNumbers = Array.from(allPredictedNumbers);
      const actualNumbers = [actualDraw.midday, actualDraw.evening].filter(n => n) as string[];

      // Calculate hits
      const straightHits = predictedNumbers.filter(pred => actualNumbers.includes(pred));
      const boxHits = this.calculateBoxHits(predictedNumbers, actualNumbers);

      // Calculate accuracy
      const straightAccuracy = predictedNumbers.length > 0 ? (straightHits.length / predictedNumbers.length) * 100 : 0;
      const boxAccuracy = predictedNumbers.length > 0 ? (boxHits.length / predictedNumbers.length) * 100 : 0;

      // Get average confidence
      const avgConfidence = groupPredictions.slice(0, 3).reduce((sum, pred) => sum + pred.confidence, 0) / 3;

      results.push({
        date: actualDraw.date,
        predictedNumbers,
        actualNumbers,
        hits: {
          straight: straightHits,
          box: boxHits
        },
        accuracy: {
          straight: straightAccuracy,
          box: boxAccuracy
        },
        confidence: avgConfidence
      });
    }

    return results.reverse(); // Return in chronological order
  }

  /**
   * Calculate box hits (order doesn't matter)
   */
  private calculateBoxHits(predicted: string[], actual: string[]): string[] {
    const boxHits: string[] = [];

    predicted.forEach(pred => {
      // Check if any actual number matches when digits are sorted
      const predSorted = pred.split('').sort().join('');
      const actualMatches = actual.some(act => act.split('').sort().join('') === predSorted);
      if (actualMatches) {
        boxHits.push(pred);
      }
    });

    return boxHits;
  }

  /**
   * Get backtesting summary statistics
   */
  public getBacktestSummary(testDays: number = 30): BacktestSummary {
    const results = this.runBacktest(testDays);

    if (results.length === 0) {
      return {
        totalTests: 0,
        averageAccuracy: { straight: 0, box: 0 },
        bestPerformingDays: [],
        worstPerformingDays: [],
        confidenceCorrelation: 0,
        overallScore: 0
      };
    }

    const totalTests = results.length;
    const avgStraight = results.reduce((sum, result) => sum + result.accuracy.straight, 0) / totalTests;
    const avgBox = results.reduce((sum, result) => sum + result.accuracy.box, 0) / totalTests;

    // Find best and worst performing days
    const sortedByStraight = results.sort((a, b) => b.accuracy.straight - a.accuracy.straight);
    const bestPerformingDays = sortedByStraight.slice(0, 5).map(r => r.date);
    const worstPerformingDays = sortedByStraight.slice(-5).map(r => r.date);

    // Calculate confidence correlation
    const confidenceCorrelation = this.calculateCorrelation(
      results.map(r => r.confidence),
      results.map(r => r.accuracy.straight)
    );

    // Calculate overall score (weighted average of accuracies)
    const overallScore = (avgStraight * 0.7) + (avgBox * 0.3);

    return {
      totalTests,
      averageAccuracy: {
        straight: avgStraight,
        box: avgBox
      },
      bestPerformingDays,
      worstPerformingDays,
      confidenceCorrelation,
      overallScore
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Get detailed backtest results for a specific date range
   */
  public getBacktestDetails(startDate: string, endDate: string): BacktestResult[] {
    const allResults = this.runBacktest(90); // Get last 90 days
    return allResults.filter(result =>
      result.date >= startDate && result.date <= endDate
    );
  }

  /**
   * Get prediction accuracy trends over time
   */
  public getAccuracyTrends(days: number = 30): {
    dates: string[];
    straightAccuracy: number[];
    boxAccuracy: number[];
    confidenceLevels: number[];
  } {
    const results = this.runBacktest(days);

    return {
      dates: results.map(r => r.date),
      straightAccuracy: results.map(r => r.accuracy.straight),
      boxAccuracy: results.map(r => r.accuracy.box),
      confidenceLevels: results.map(r => r.confidence)
    };
  }
}
