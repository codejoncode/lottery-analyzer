import type { Pick3Draw } from './Pick3DataManager';

export interface NumberGroup {
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
  hits: {
    straight: number;
    box: number;
    total: number;
  };
  performance: {
    winRate: number;
    averageHitsPerDraw: number;
    lastHitDate?: string;
    consecutiveMisses: number;
  };
}

export interface GroupAnalysisResult {
  groups: NumberGroup[];
  overallStats: {
    totalNumbers: number;
    averageGroupSize: number;
    coveragePercentage: number;
    totalHits: number;
    averageWinRate: number;
  };
  recommendations: {
    bestPerformingGroups: NumberGroup[];
    dueGroups: NumberGroup[];
    hotGroups: NumberGroup[];
    nextDrawPredictions: string[];
  };
}

export class Pick3GroupAnalyzer {
  private draws: Pick3Draw[] = [];
  private groups: NumberGroup[] = [];
  private readonly GROUP_SIZE = 20;
  private readonly TOTAL_GROUPS = 50;

  constructor(draws: Pick3Draw[] = []) {
    this.draws = draws.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    this.initializeGroups();
  }

  public updateDraws(draws: Pick3Draw[]): void {
    this.draws = draws.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    this.updateGroupPerformance();
  }

  /**
   * Initialize 50 groups with balanced distribution
   */
  private initializeGroups(): void {
    this.groups = [];

    // Generate all possible Pick3 combinations (000-999)
    const allNumbers: string[] = [];
    for (let i = 0; i < 1000; i++) {
      allNumbers.push(i.toString().padStart(3, '0'));
    }

    // Categorize numbers by type
    const singles: string[] = [];
    const doubles: string[] = [];
    const triples: string[] = [];

    allNumbers.forEach(num => {
      const digits = num.split('');
      const uniqueDigits = new Set(digits);

      if (uniqueDigits.size === 1) {
        triples.push(num);
      } else if (uniqueDigits.size === 2) {
        doubles.push(num);
      } else {
        singles.push(num);
      }
    });

    console.log(`📊 Number distribution: ${singles.length} singles, ${doubles.length} doubles, ${triples.length} triples`);

    // Calculate target distribution per group (balanced)
    const targetSinglesPerGroup = Math.floor(singles.length / this.TOTAL_GROUPS);
    const targetDoublesPerGroup = Math.floor(doubles.length / this.TOTAL_GROUPS);
    const targetTriplesPerGroup = Math.floor(triples.length / this.TOTAL_GROUPS);

    console.log(`🎯 Target per group: ${targetSinglesPerGroup} singles, ${targetDoublesPerGroup} doubles, ${targetTriplesPerGroup} triples`);

    // Shuffle arrays for random distribution
    this.shuffleArray(singles);
    this.shuffleArray(doubles);
    this.shuffleArray(triples);

    // Create groups with balanced distribution
    for (let groupId = 1; groupId <= this.TOTAL_GROUPS; groupId++) {
      const groupNumbers: string[] = [];

      // Add target numbers from each category
      const startSingle = (groupId - 1) * targetSinglesPerGroup;
      const endSingle = groupId * targetSinglesPerGroup;
      groupNumbers.push(...singles.slice(startSingle, endSingle));

      const startDouble = (groupId - 1) * targetDoublesPerGroup;
      const endDouble = groupId * targetDoublesPerGroup;
      groupNumbers.push(...doubles.slice(startDouble, endDouble));

      const startTriple = (groupId - 1) * targetTriplesPerGroup;
      const endTriple = groupId * targetTriplesPerGroup;
      groupNumbers.push(...triples.slice(startTriple, endTriple));

      // Fill remaining slots with random numbers from any category
      while (groupNumbers.length < this.GROUP_SIZE) {
        const remainingNumbers = [...singles.slice(endSingle), ...doubles.slice(endDouble), ...triples.slice(endTriple)];
        if (remainingNumbers.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
          groupNumbers.push(remainingNumbers[randomIndex]);
          remainingNumbers.splice(randomIndex, 1);
        } else {
          // Fallback: add any remaining numbers
          const allRemaining = [...singles, ...doubles, ...triples].filter(num => !groupNumbers.includes(num));
          if (allRemaining.length > 0) {
            groupNumbers.push(allRemaining[Math.floor(Math.random() * allRemaining.length)]);
          }
        }
      }

      // Ensure exactly GROUP_SIZE numbers
      if (groupNumbers.length > this.GROUP_SIZE) {
        groupNumbers.splice(this.GROUP_SIZE);
      }

      // Shuffle the group for randomness
      this.shuffleArray(groupNumbers);

      const group: NumberGroup = {
        id: groupId,
        numbers: groupNumbers,
        average: 0,
        totalSkips: 0,
        hotNumbers: [],
        dueNumbers: [],
        score: 0,
        confidence: 0,
        predictedNumbers: [],
        hits: {
          straight: 0,
          box: 0,
          total: 0
        },
        performance: {
          winRate: 0,
          averageHitsPerDraw: 0,
          consecutiveMisses: 0
        }
      };

      this.groups.push(group);
    }

    console.log(`✅ Created ${this.groups.length} groups with ${this.GROUP_SIZE} numbers each`);
    this.updateGroupPerformance();
  }

  /**
   * Update performance metrics for all groups based on historical draws
   */
  private updateGroupPerformance(): void {
    if (this.draws.length === 0) return;

    this.groups.forEach(group => {
      this.calculateGroupMetrics(group);
    });

    // Sort groups by performance for recommendations
    this.groups.sort((a, b) => b.performance.winRate - a.performance.winRate);
  }

  /**
   * Calculate performance metrics for a specific group
   */
  private calculateGroupMetrics(group: NumberGroup): void {
    let totalHits = 0;
    let straightHits = 0;
    let boxHits = 0;
    let lastHitDate: string | undefined;
    let consecutiveMisses = 0;

    // Track number frequencies within the group
    const numberStats = new Map<string, { lastSeen: number; skipCount: number }>();
    group.numbers.forEach(num => {
      numberStats.set(num, { lastSeen: -1, skipCount: 0 });
    });

    // Analyze each draw
    this.draws.forEach((draw, drawIndex) => {
      const middayHit = this.checkHit(group, draw.midday);
      const eveningHit = this.checkHit(group, draw.evening);

      if (middayHit) {
        totalHits++;
        if (middayHit.type === 'straight') straightHits++;
        else boxHits++;
        lastHitDate = draw.date;
        consecutiveMisses = 0;
      } else {
        consecutiveMisses++;
      }

      if (eveningHit) {
        totalHits++;
        if (eveningHit.type === 'straight') straightHits++;
        else boxHits++;
        lastHitDate = draw.date;
        consecutiveMisses = 0;
      } else {
        consecutiveMisses++;
      }

      // Update skip counts
      group.numbers.forEach(num => {
        const stats = numberStats.get(num)!;
        if (middayHit?.number === num || eveningHit?.number === num) {
          stats.lastSeen = drawIndex;
          stats.skipCount = 0;
        } else {
          stats.skipCount++;
        }
      });
    });

    // Calculate averages and identify hot/due numbers
    const averages = Array.from(numberStats.values());
    const avgSkip = averages.reduce((sum, stat) => sum + stat.skipCount, 0) / averages.length;

    const hotNumbers = group.numbers.filter(num => {
      const stats = numberStats.get(num)!;
      return stats.skipCount <= avgSkip * 0.5; // Hot if skip count is below average
    });

    const dueNumbers = group.numbers.filter(num => {
      const stats = numberStats.get(num)!;
      return stats.skipCount >= avgSkip * 1.5; // Due if skip count is above average
    });

    // Update group metrics
    group.average = avgSkip;
    group.totalSkips = averages.reduce((sum, stat) => sum + stat.skipCount, 0);
    group.hotNumbers = hotNumbers;
    group.dueNumbers = dueNumbers;
    group.hits = { straight: straightHits, box: boxHits, total: totalHits };
    group.performance = {
      winRate: this.draws.length > 0 ? (totalHits / (this.draws.length * 2)) * 100 : 0,
      averageHitsPerDraw: this.draws.length > 0 ? totalHits / this.draws.length : 0,
      lastHitDate,
      consecutiveMisses
    };

    // Calculate score and confidence
    group.score = this.calculateGroupScore(group);
    group.confidence = this.calculateGroupConfidence(group);
  }

  /**
   * Check if a draw number hits in the group
   */
  private checkHit(group: NumberGroup, drawNumber?: string): { number: string; type: 'straight' | 'box' } | null {
    if (!drawNumber) return null;

    // Check for straight hit
    if (group.numbers.includes(drawNumber)) {
      return { number: drawNumber, type: 'straight' };
    }

    // Check for box hit (any permutation)
    const drawDigits = drawNumber.split('').sort().join('');
    for (const num of group.numbers) {
      const numDigits = num.split('').sort().join('');
      if (numDigits === drawDigits) {
        return { number: num, type: 'box' };
      }
    }

    return null;
  }

  /**
   * Calculate group score based on performance
   */
  private calculateGroupScore(group: NumberGroup): number {
    let score = 0;

    // Performance-based scoring
    score += group.performance.winRate * 10;
    score += group.hits.total * 5;
    score += (100 - group.average) * 0.1; // Lower average skip is better

    // Hot/due number bonuses
    score += group.hotNumbers.length * 2;
    score += group.dueNumbers.length * 3;

    // Penalty for consecutive misses
    score -= group.performance.consecutiveMisses * 0.5;

    return Math.max(0, score);
  }

  /**
   * Calculate group confidence based on recent performance
   */
  private calculateGroupConfidence(group: NumberGroup): number {
    let confidence = 50; // Base confidence

    // Recent performance bonus
    if (group.performance.consecutiveMisses === 0) {
      confidence += 20; // Recently hit
    } else if (group.performance.consecutiveMisses <= 3) {
      confidence += 10;
    } else if (group.performance.consecutiveMisses > 10) {
      confidence -= 20; // Long time no hit
    }

    // Hot numbers bonus
    confidence += Math.min(group.hotNumbers.length * 5, 25);

    // Due numbers bonus
    confidence += Math.min(group.dueNumbers.length * 3, 15);

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generate predictions for next draw based on group analysis
   */
  public generatePredictions(): string[] {
    const predictions: string[] = [];
    const predictionSet = new Set<string>();

    // Get top performing groups
    const topGroups = this.groups
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // Collect predictions from top groups
    topGroups.forEach(group => {
      // Prioritize due numbers
      group.dueNumbers.slice(0, 3).forEach(num => {
        if (predictionSet.size < 20) {
          predictionSet.add(num);
        }
      });

      // Add some hot numbers
      group.hotNumbers.slice(0, 2).forEach(num => {
        if (predictionSet.size < 20) {
          predictionSet.add(num);
        }
      });
    });

    // Fill remaining slots with random selections from high-confidence groups
    const highConfidenceGroups = this.groups.filter(g => g.confidence > 70);
    while (predictionSet.size < 20 && highConfidenceGroups.length > 0) {
      const randomGroup = highConfidenceGroups[Math.floor(Math.random() * highConfidenceGroups.length)];
      const availableNumbers = randomGroup.numbers.filter(num => !predictionSet.has(num));
      if (availableNumbers.length > 0) {
        predictionSet.add(availableNumbers[Math.floor(Math.random() * availableNumbers.length)]);
      }
    }

    predictions.push(...Array.from(predictionSet));
    return predictions;
  }

  /**
   * Get comprehensive analysis results
   */
  public getAnalysis(): GroupAnalysisResult {
    const totalNumbers = this.groups.reduce((sum, group) => sum + group.numbers.length, 0);
    const totalHits = this.groups.reduce((sum, group) => sum + group.hits.total, 0);
    const averageWinRate = this.groups.reduce((sum, group) => sum + group.performance.winRate, 0) / this.groups.length;

    const bestPerformingGroups = this.groups
      .sort((a, b) => b.performance.winRate - a.performance.winRate)
      .slice(0, 5);

    const dueGroups = this.groups
      .filter(g => g.performance.consecutiveMisses >= 5)
      .sort((a, b) => b.performance.consecutiveMisses - a.performance.consecutiveMisses)
      .slice(0, 5);

    const hotGroups = this.groups
      .filter(g => g.performance.consecutiveMisses === 0)
      .sort((a, b) => b.hits.total - a.hits.total)
      .slice(0, 5);

    return {
      groups: this.groups,
      overallStats: {
        totalNumbers,
        averageGroupSize: totalNumbers / this.groups.length,
        coveragePercentage: (totalNumbers / 1000) * 100, // Percentage of all possible numbers
        totalHits,
        averageWinRate
      },
      recommendations: {
        bestPerformingGroups,
        dueGroups,
        hotGroups,
        nextDrawPredictions: this.generatePredictions()
      }
    };
  }

  /**
   * Utility function to shuffle array
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get a specific group by ID
   */
  public getGroup(groupId: number): NumberGroup | undefined {
    return this.groups.find(g => g.id === groupId);
  }

  /**
   * Get all groups
   */
  public getAllGroups(): NumberGroup[] {
    return this.groups;
  }
}