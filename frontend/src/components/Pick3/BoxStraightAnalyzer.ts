export interface Draw {
  digits: [number, number, number];
  date: string;
  drawNumber?: number;
}

export interface BetTypeAnalysis {
  combination: string;
  straightMatches: number;
  boxMatches: number;
  pairMatches: number;
  straightFrequency: number;
  boxFrequency: number;
  pairFrequency: number;
  lastStraightHit: number;
  lastBoxHit: number;
  straightDue: boolean;
  boxDue: boolean;
  recommendedBet: 'straight' | 'box' | 'both';
  confidence: number;
}

export interface PatternAnalysis {
  pattern: string;
  frequency: number;
  lastSeen: number;
  dueFactor: number;
  hotStreak: number;
  coldStreak: number;
}

/**
 * Analyzes box (any order) and straight (exact order) patterns for Pick 3 combinations
 */
export class BoxStraightAnalyzer {
  private historicalDraws: Draw[];
  private analysisCache: Map<string, BetTypeAnalysis> = new Map();

  constructor(historicalDraws: Draw[]) {
    this.historicalDraws = historicalDraws;
  }

  /**
   * Analyzes a specific combination for box/straight performance
   */
  analyzeCombination(combination: string): BetTypeAnalysis {
    if (this.analysisCache.has(combination)) {
      return this.analysisCache.get(combination)!;
    }

    const digits = combination.split('').map(Number);
    if (digits.length !== 3 || digits.some(isNaN)) {
      throw new Error('Invalid combination format');
    }

    const sortedDigits = [...digits].sort();
    const straightCombo = digits.join('');
    const boxCombo = sortedDigits.join('');

    let straightMatches = 0;
    let boxMatches = 0;
    let pairMatches = 0;
    let lastStraightHit = -1;
    let lastBoxHit = -1;

    // Analyze recent draws (last 50 for performance)
    const recentDraws = this.historicalDraws.slice(-50);

    recentDraws.forEach((draw, index) => {
      const drawStraight = draw.digits.join('');
      const drawBox = [...draw.digits].sort().join('');

      // Straight match (exact order)
      if (drawStraight === straightCombo) {
        straightMatches++;
        lastStraightHit = recentDraws.length - 1 - index;
      }

      // Box match (any order)
      if (drawBox === boxCombo) {
        boxMatches++;
        lastBoxHit = recentDraws.length - 1 - index;
      }

      // Pair analysis (any two digits match)
      const drawPairs = this.getDigitPairs(draw.digits);
      const comboPairs = this.getDigitPairs(digits);
      const pairIntersection = drawPairs.filter(pair =>
        comboPairs.some(comboPair =>
          (comboPair[0] === pair[0] && comboPair[1] === pair[1]) ||
          (comboPair[0] === pair[1] && comboPair[1] === pair[0])
        )
      );

      if (pairIntersection.length >= 2) {
        pairMatches++;
      }
    });

    const totalDraws = recentDraws.length;
    const straightFrequency = straightMatches / totalDraws;
    const boxFrequency = boxMatches / totalDraws;
    const pairFrequency = pairMatches / totalDraws;

    // Determine if patterns are due
    const avgStraightFreq = this.calculateAverageFrequency('straight');
    const avgBoxFreq = this.calculateAverageFrequency('box');

    const straightDue = lastStraightHit > 10 && straightFrequency < avgStraightFreq * 0.8;
    const boxDue = lastBoxHit > 10 && boxFrequency < avgBoxFreq * 0.8;

    // Recommend bet type
    let recommendedBet: 'straight' | 'box' | 'both' = 'both';
    if (straightFrequency > boxFrequency * 1.5) {
      recommendedBet = 'straight';
    } else if (boxFrequency > straightFrequency * 1.5) {
      recommendedBet = 'box';
    }

    // Calculate confidence based on historical performance
    const confidence = Math.min(1, (straightMatches + boxMatches * 0.7 + pairMatches * 0.3) / (totalDraws * 0.1));

    const analysis: BetTypeAnalysis = {
      combination,
      straightMatches,
      boxMatches,
      pairMatches,
      straightFrequency,
      boxFrequency,
      pairFrequency,
      lastStraightHit,
      lastBoxHit,
      straightDue,
      boxDue,
      recommendedBet,
      confidence
    };

    this.analysisCache.set(combination, analysis);
    return analysis;
  }

  /**
   * Analyzes patterns across all combinations
   */
  analyzePatterns(): PatternAnalysis[] {
    const patternMap = new Map<string, PatternAnalysis>();

    // Analyze digit pair patterns
    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j <= 9; j++) {
        const pattern = `${i}${j}`;
        let frequency = 0;
        let lastSeen = -1;
        let hotStreak = 0;
        let coldStreak = 0;

        this.historicalDraws.slice(-100).forEach((draw, index) => {
          const drawPairs = this.getDigitPairs(draw.digits);
          const hasPattern = drawPairs.some(pair =>
            pair.includes(i) && pair.includes(j)
          );

          if (hasPattern) {
            frequency++;
            lastSeen = 99 - index;
            hotStreak++;
            coldStreak = 0;
          } else {
            coldStreak++;
            hotStreak = 0;
          }
        });

        const dueFactor = coldStreak > 15 ? coldStreak / 30 : 0;

        patternMap.set(pattern, {
          pattern,
          frequency: frequency / 100,
          lastSeen,
          dueFactor,
          hotStreak,
          coldStreak
        });
      }
    }

    return Array.from(patternMap.values()).sort((a, b) => b.dueFactor - a.dueFactor);
  }

  /**
   * Gets top combinations by box/straight performance
   */
  getTopCombinations(limit: number = 20): BetTypeAnalysis[] {
    const allCombinations = this.generateAllCombinations();
    const analyzed = allCombinations.map(combo => this.analyzeCombination(combo));

    return analyzed
      .sort((a, b) => {
        // Sort by combined performance score
        const scoreA = a.straightFrequency + a.boxFrequency + a.confidence;
        const scoreB = b.straightFrequency + b.boxFrequency + b.confidence;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Gets combinations that are due for box or straight hits
   */
  getDueCombinations(): BetTypeAnalysis[] {
    const allCombinations = this.generateAllCombinations();
    return allCombinations
      .map(combo => this.analyzeCombination(combo))
      .filter(analysis => analysis.straightDue || analysis.boxDue)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculates expected value for different bet types
   */
  calculateExpectedValue(combination: string, betAmount: number = 1): {
    straightEV: number;
    boxEV: number;
    recommendedBet: 'straight' | 'box';
  } {
    const analysis = this.analyzeCombination(combination);

    // Straight payout is typically 500:1, Box is 80:1 for 3-digit games
    const straightPayout = 500;
    const boxPayout = 80;

    const straightEV = (analysis.straightFrequency * straightPayout) - (1 - analysis.straightFrequency) * betAmount;
    const boxEV = (analysis.boxFrequency * boxPayout) - (1 - analysis.boxFrequency) * betAmount;

    const recommendedBet = straightEV > boxEV ? 'straight' : 'box';

    return { straightEV, boxEV, recommendedBet };
  }

  private getDigitPairs(digits: number[]): number[][] {
    return [
      [digits[0], digits[1]],
      [digits[1], digits[2]],
      [digits[0], digits[2]]
    ];
  }

  private calculateAverageFrequency(type: 'straight' | 'box'): number {
    const sampleSize = Math.min(100, this.historicalDraws.length);
    const recentDraws = this.historicalDraws.slice(-sampleSize);

    if (type === 'straight') {
      const uniqueStraights = new Set(recentDraws.map(d => d.digits.join('')));
      return uniqueStraights.size / sampleSize;
    } else {
      const uniqueBoxes = new Set(recentDraws.map(d => [...d.digits].sort().join('')));
      return uniqueBoxes.size / sampleSize;
    }
  }

  private generateAllCombinations(): string[] {
    const combinations: string[] = [];
    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j <= 9; j++) {
        for (let k = 0; k <= 9; k++) {
          combinations.push(`${i}${j}${k}`);
        }
      }
    }
    return combinations;
  }
}

/**
 * Utility functions for pattern analysis
 */
export const PatternUtils = {
  /**
   * Detects repeating patterns in draw sequences
   */
  detectRepeatingPatterns: (draws: Draw[], patternLength: number = 3): string[] => {
    const patterns: string[] = [];

    for (let i = 0; i <= draws.length - patternLength * 2; i++) {
      const pattern1 = draws.slice(i, i + patternLength).map(d => d.digits.join(''));
      const pattern2 = draws.slice(i + patternLength, i + patternLength * 2).map(d => d.digits.join(''));

      if (pattern1.join('') === pattern2.join('')) {
        patterns.push(pattern1.join('-'));
      }
    }

    return [...new Set(patterns)];
  },

  /**
   * Analyzes sum patterns and their frequencies
   */
  analyzeSumPatterns: (draws: Draw[]): Map<number, number> => {
    const sumFrequency = new Map<number, number>();

    draws.forEach(draw => {
      const sum = draw.digits.reduce((a, b) => a + b, 0);
      sumFrequency.set(sum, (sumFrequency.get(sum) || 0) + 1);
    });

    return sumFrequency;
  },

  /**
   * Calculates digit frequency distribution
   */
  calculateDigitFrequency: (draws: Draw[]): Map<number, number> => {
    const frequency = new Map<number, number>();

    draws.forEach(draw => {
      draw.digits.forEach(digit => {
        frequency.set(digit, (frequency.get(digit) || 0) + 1);
      });
    });

    return frequency;
  }
};