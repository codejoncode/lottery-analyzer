import { z } from 'zod';

const Pick3DrawSchema = z.object({
  date: z.string(),
  numbers: z.array(z.number().int().min(0).max(9)).length(3),
  drawTime: z.enum(['morning', 'midday', 'evening', 'night']).optional(),
});

export type Pick3Draw = z.infer<typeof Pick3DrawSchema>;

interface VTracPattern {
  pattern: string;
  frequency: number;
  lastSeen: string;
  skipCount: number;
  positions: number[];
}

interface VTracAnalysis {
  vtracNumbers: number[];
  patterns: VTracPattern[];
  recommendations: string[];
  confidence: number;
  rootSum: number;
  combinationType: 'single' | 'double' | 'triple';
}

export class AdvancedVTracAnalyzer {
  private readonly VTRAC_MAP: Record<number, number> = {
    0: 5, 1: 1, 2: 2, 3: 3, 4: 4,
    5: 0, 6: 9, 7: 8, 8: 7, 9: 6
  };

  private readonly PATTERN_WEIGHTS = {
    'consecutive': 0.3,
    'repeating': 0.25,
    'fibonacci': 0.2,
    'sum_cluster': 0.15,
    'skip_pattern': 0.1,
  };

  analyzeDraws(draws: Pick3Draw[]): VTracAnalysis {
    const validatedDraws = draws.map(draw => Pick3DrawSchema.parse(draw));
    
    // Convert draws to VTrac
    const vtracDraws = this.convertToVTrac(validatedDraws);
    
    // Detect patterns
    const patterns = this.detectPatterns(vtracDraws);
    
    // Get most recent VTrac numbers
    const latestDraw = vtracDraws[vtracDraws.length - 1];
    const vtracNumbers = latestDraw ? latestDraw.numbers : [];
    
    // Calculate root sum
    const rootSum = this.calculateRootSum(vtracNumbers);
    
    // Determine combination type
    const combinationType = this.getCombinationType(vtracNumbers);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(patterns);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns, vtracDraws);

    return {
      vtracNumbers,
      patterns,
      recommendations,
      confidence,
      rootSum,
      combinationType,
    };
  }

  private convertToVTrac(draws: Pick3Draw[]): Pick3Draw[] {
    return draws.map(draw => ({
      ...draw,
      numbers: draw.numbers.map(n => this.VTRAC_MAP[n]),
    }));
  }

  private detectPatterns(draws: Pick3Draw[]): VTracPattern[] {
    const patterns: VTracPattern[] = [];
    
    // Detect different pattern types
    patterns.push(...this.detectConsecutivePatterns(draws));
    patterns.push(...this.detectRepeatingPatterns(draws));
    patterns.push(...this.detectFibonacciPatterns(draws));
    patterns.push(...this.detectSumClusters(draws));
    patterns.push(...this.detectSkipPatterns(draws));
    
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private detectConsecutivePatterns(draws: Pick3Draw[]): VTracPattern[] {
    const patterns: VTracPattern[] = [];
    const consecutiveMap = new Map<string, number[]>();

    draws.forEach((draw, index) => {
      const sorted = [...draw.numbers].sort((a, b) => a - b);
      const isConsecutive = 
        sorted[1] === sorted[0] + 1 && 
        sorted[2] === sorted[1] + 1;

      if (isConsecutive) {
        const key = 'consecutive';
        if (!consecutiveMap.has(key)) {
          consecutiveMap.set(key, []);
        }
        consecutiveMap.get(key)!.push(index);
      }
    });

    consecutiveMap.forEach((positions, _key) => {
      patterns.push({
        pattern: 'consecutive',
        frequency: positions.length,
        lastSeen: draws[positions[positions.length - 1]]?.date || '',
        skipCount: this.calculateSkipCount(positions),
        positions,
      });
    });

    return patterns;
  }

  private detectRepeatingPatterns(draws: Pick3Draw[]): VTracPattern[] {
    const patterns: VTracPattern[] = [];
    const repeatMap = new Map<string, number[]>();

    draws.forEach((draw, index) => {
      const uniqueCount = new Set(draw.numbers).size;
      if (uniqueCount < 3) {
        const key = uniqueCount === 1 ? 'triple' : 'double';
        if (!repeatMap.has(key)) {
          repeatMap.set(key, []);
        }
        repeatMap.get(key)!.push(index);
      }
    });

    repeatMap.forEach((positions, key) => {
      patterns.push({
        pattern: `repeating-${key}`,
        frequency: positions.length,
        lastSeen: draws[positions[positions.length - 1]]?.date || '',
        skipCount: this.calculateSkipCount(positions),
        positions,
      });
    });

    return patterns;
  }

  private detectFibonacciPatterns(draws: Pick3Draw[]): VTracPattern[] {
    const fibSequence = [0, 1, 1, 2, 3, 5, 8];
    const patterns: VTracPattern[] = [];
    const positions: number[] = [];

    draws.forEach((draw, index) => {
      const allFib = draw.numbers.every(n => fibSequence.includes(n));
      if (allFib) {
        positions.push(index);
      }
    });

    if (positions.length > 0) {
      patterns.push({
        pattern: 'fibonacci',
        frequency: positions.length,
        lastSeen: draws[positions[positions.length - 1]]?.date || '',
        skipCount: this.calculateSkipCount(positions),
        positions,
      });
    }

    return patterns;
  }

  private detectSumClusters(draws: Pick3Draw[]): VTracPattern[] {
    const patterns: VTracPattern[] = [];
    const sumRanges = [
      { range: '0-9', min: 0, max: 9 },
      { range: '10-14', min: 10, max: 14 },
      { range: '15-18', min: 15, max: 18 },
      { range: '19-27', min: 19, max: 27 },
    ];

    sumRanges.forEach(({ range, min, max }) => {
      const positions: number[] = [];
      
      draws.forEach((draw, index) => {
        const sum = draw.numbers.reduce((a, b) => a + b, 0);
        if (sum >= min && sum <= max) {
          positions.push(index);
        }
      });

      if (positions.length > 0) {
        patterns.push({
          pattern: `sum-cluster-${range}`,
          frequency: positions.length,
          lastSeen: draws[positions[positions.length - 1]]?.date || '',
          skipCount: this.calculateSkipCount(positions),
          positions,
        });
      }
    });

    return patterns;
  }

  private detectSkipPatterns(draws: Pick3Draw[]): VTracPattern[] {
    const patterns: VTracPattern[] = [];
    const digitLastSeen = new Map<number, number>();
    const skipCounts = new Map<string, number[]>();

    draws.forEach((draw, index) => {
      draw.numbers.forEach(digit => {
        if (digitLastSeen.has(digit)) {
          const lastIndex = digitLastSeen.get(digit)!;
          const skip = index - lastIndex - 1;
          const key = `digit-${digit}-skip-${skip}`;
          
          if (!skipCounts.has(key)) {
            skipCounts.set(key, []);
          }
          skipCounts.get(key)!.push(index);
        }
        digitLastSeen.set(digit, index);
      });
    });

    skipCounts.forEach((positions, key) => {
      if (positions.length >= 2) {
        patterns.push({
          pattern: key,
          frequency: positions.length,
          lastSeen: draws[positions[positions.length - 1]]?.date || '',
          skipCount: this.calculateSkipCount(positions),
          positions,
        });
      }
    });

    return patterns;
  }

  private calculateSkipCount(positions: number[]): number {
    if (positions.length < 2) return 0;
    
    const skips = [];
    for (let i = 1; i < positions.length; i++) {
      skips.push(positions[i] - positions[i - 1] - 1);
    }
    
    return Math.round(skips.reduce((a, b) => a + b, 0) / skips.length);
  }

  private calculateRootSum(numbers: number[]): number {
    let sum = numbers.reduce((a, b) => a + b, 0);
    while (sum > 9) {
      sum = String(sum).split('').reduce((a, b) => a + parseInt(b), 0);
    }
    return sum;
  }

  private getCombinationType(numbers: number[]): 'single' | 'double' | 'triple' {
    const unique = new Set(numbers);
    if (unique.size === 1) return 'triple';
    if (unique.size === 2) return 'double';
    return 'single';
  }

  private calculateConfidence(patterns: VTracPattern[]): number {
    if (patterns.length === 0) return 0;

    let totalWeight = 0;
    let weightedScore = 0;

    patterns.forEach(pattern => {
      const patternType = pattern.pattern.split('-')[0];
      const weight = this.PATTERN_WEIGHTS[patternType as keyof typeof this.PATTERN_WEIGHTS] || 0.05;
      const frequencyScore = Math.min(pattern.frequency / 10, 1);
      
      totalWeight += weight;
      weightedScore += weight * frequencyScore;
    });

    return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  }

  private generateRecommendations(patterns: VTracPattern[], draws: Pick3Draw[]): string[] {
    const recommendations: string[] = [];

    // Analyze most frequent patterns
    const topPatterns = patterns.slice(0, 3);
    
    topPatterns.forEach(pattern => {
      if (pattern.pattern.includes('consecutive')) {
        recommendations.push('Consider consecutive number combinations based on recent trends');
      } else if (pattern.pattern.includes('repeating')) {
        recommendations.push('Double or triple digit combinations show strong frequency');
      } else if (pattern.pattern.includes('fibonacci')) {
        recommendations.push('Fibonacci sequence numbers appearing frequently');
      } else if (pattern.pattern.includes('sum-cluster')) {
        const range = pattern.pattern.split('-').slice(-2).join('-');
        recommendations.push(`Target sum ranges: ${range} shows high activity`);
      }
    });

    // Analyze recent trends
    if (draws.length >= 10) {
      const recentDraws = draws.slice(-10);
      const recentSums = recentDraws.map(d => d.numbers.reduce((a, b) => a + b, 0));
      const avgSum = recentSums.reduce((a, b) => a + b, 0) / recentSums.length;
      
      recommendations.push(`Recent average sum: ${avgSum.toFixed(1)} - consider numbers in this range`);
    }

    // Add skip analysis recommendation
    if (patterns.some(p => p.pattern.includes('skip'))) {
      recommendations.push('Monitor skip patterns for due numbers');
    }

    return recommendations;
  }

  generatePredictions(analysis: VTracAnalysis, count: number = 5): Pick3Draw[] {
    const predictions: Pick3Draw[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < count; i++) {
      const numbers = this.generateSinglePrediction(analysis);
      predictions.push({
        date: today,
        numbers,
        drawTime: 'evening',
      });
    }

    return predictions;
  }

  private generateSinglePrediction(analysis: VTracAnalysis): number[] {
    // Use pattern analysis to influence predictions
    const { patterns } = analysis;

    // Weight predictions based on patterns
    if (patterns.length > 0 && Math.random() < 0.7) {
      return this.generatePatternBasedPrediction(patterns, analysis);
    } else {
      return this.generateStatisticalPrediction(analysis);
    }
  }

  private generatePatternBasedPrediction(
    patterns: VTracPattern[], 
    analysis: VTracAnalysis
  ): number[] {
    const topPattern = patterns[0];

    if (topPattern.pattern.includes('consecutive')) {
      const start = Math.floor(Math.random() * 7);
      return [start, start + 1, start + 2];
    } else if (topPattern.pattern.includes('repeating')) {
      const digit = Math.floor(Math.random() * 10);
      if (analysis.combinationType === 'double') {
        const other = Math.floor(Math.random() * 10);
        return [digit, digit, other].sort(() => Math.random() - 0.5);
      } else {
        return [digit, digit, digit];
      }
    } else {
      return this.generateStatisticalPrediction(analysis);
    }
  }

  private generateStatisticalPrediction(analysis: VTracAnalysis): number[] {
    // Generate based on root sum tendencies
    const targetSum = analysis.rootSum + Math.floor(Math.random() * 5) - 2;
    const prediction: number[] = [];

    for (let i = 0; i < 3; i++) {
      const remaining = 3 - i;
      const currentSum = prediction.reduce((a, b) => a + b, 0);
      const needed = Math.max(0, targetSum - currentSum);
      const maxDigit = Math.min(9, needed);
      const minDigit = Math.max(0, needed - (remaining - 1) * 9);
      
      const digit = Math.floor(Math.random() * (maxDigit - minDigit + 1)) + minDigit;
      prediction.push(Math.max(0, Math.min(9, digit)));
    }

    return prediction.map(n => Math.max(0, Math.min(9, n)));
  }
}
