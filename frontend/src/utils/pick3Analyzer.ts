import { performanceOptimizer, withPerformanceMonitoring } from './performanceOptimizer';

export interface Pick3Combination {
  straight: string;
  box: string;
  sum: number;
  rootSum: number;
  sumLastDigit: number;
  isSingle: boolean;
  isDouble: boolean;
  isTriple: boolean;
  vtrac: string;
  mirror: string;
}

export interface Pick3SumAnalysis {
  sum: number;
  straightCount: number;
  boxCount: number;
  straightCombinations: string[];
  boxCombinations: string[];
  probability: number;
  odds: number;
}

export interface Pick3RootSumAnalysis {
  rootSum: number;
  straightCount: number;
  boxCount: number;
  straightCombinations: string[];
  boxCombinations: string[];
  probability: number;
  odds: number;
}

export interface Pick3VTracAnalysis {
  vtrac: string;
  combinations: string[];
  mirrorCombinations: string[];
  count: number;
}

/**
 * Advanced Pick 3 Mathematical Analysis Engine
 * Implements comprehensive combinatorial analysis for 3-digit lottery games
 */
export class Pick3Analyzer {
  private combinations: Pick3Combination[] = [];
  private sumAnalysis: Map<number, Pick3SumAnalysis> = new Map();
  private rootSumAnalysis: Map<number, Pick3RootSumAnalysis> = new Map();
  private vtracAnalysis: Map<string, Pick3VTracAnalysis> = new Map();

  constructor() {
    this.initializeCombinations();
    this.analyzeSums();
    this.analyzeRootSums();
    this.analyzeVTracs();
  }

  /**
   * Generate all 1,000 possible Pick 3 combinations
   */
  private initializeCombinations(): void {
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        for (let k = 0; k < 10; k++) {
          const straight = `${i}${j}${k}`;
          const sorted = [i, j, k].sort((a, b) => a - b).join('');
          const sum = i + j + k;
          const rootSum = this.calculateDigitalRoot(sum);
          const sumLastDigit = sum % 10;
          const vtrac = this.calculateVTrac(i, j, k);
          const mirror = this.calculateMirror(i, j, k);

          // Determine combination type
          const digits = [i, j, k];
          const uniqueDigits = new Set(digits);
          const isTriple = uniqueDigits.size === 1;
          const isDouble = uniqueDigits.size === 2;
          const isSingle = uniqueDigits.size === 3;

          this.combinations.push({
            straight,
            box: sorted,
            sum,
            rootSum,
            sumLastDigit,
            isSingle,
            isDouble,
            isTriple,
            vtrac,
            mirror
          });
        }
      }
    }
  }

  /**
   * Calculate digital root (sum of digits until single digit)
   */
  private calculateDigitalRoot(num: number): number {
    return num % 9 || (num === 0 ? 0 : 9);
  }

  /**
   * Calculate VTrac value for a digit (1-5 range)
   */
  private calculateVTracDigit(digit: number): number {
    return digit === 0 ? 5 : digit;
  }

  /**
   * Calculate VTrac combination for three digits
   */
  private calculateVTrac(d1: number, d2: number, d3: number): string {
    return `${this.calculateVTracDigit(d1)}${this.calculateVTracDigit(d2)}${this.calculateVTracDigit(d3)}`;
  }

  /**
   * Calculate mirror combination
   */
  private calculateMirror(d1: number, d2: number, d3: number): string {
    const mirrorDigit = (d: number) => (d + 5) % 10;
    return `${mirrorDigit(d1)}${mirrorDigit(d2)}${mirrorDigit(d3)}`;
  }

  /**
   * Analyze sum distributions and probabilities
   */
  private analyzeSums(): void {
    const sumGroups = new Map<number, Pick3Combination[]>();

    // Group combinations by sum
    this.combinations.forEach(combo => {
      if (!sumGroups.has(combo.sum)) {
        sumGroups.set(combo.sum, []);
      }
      sumGroups.get(combo.sum)!.push(combo);
    });

    // Calculate analysis for each sum
    sumGroups.forEach((combos, sum) => {
      const straightCombinations = combos.map(c => c.straight);
      const boxCombinations = [...new Set(combos.map(c => c.box))];

      const analysis: Pick3SumAnalysis = {
        sum,
        straightCount: straightCombinations.length,
        boxCount: boxCombinations.length,
        straightCombinations,
        boxCombinations,
        probability: straightCombinations.length / 1000,
        odds: 999 / straightCombinations.length
      };

      this.sumAnalysis.set(sum, analysis);
    });
  }

  /**
   * Analyze root sum distributions
   */
  private analyzeRootSums(): void {
    const rootSumGroups = new Map<number, Pick3Combination[]>();

    // Group combinations by root sum
    this.combinations.forEach(combo => {
      if (!rootSumGroups.has(combo.rootSum)) {
        rootSumGroups.set(combo.rootSum, []);
      }
      rootSumGroups.get(combo.rootSum)!.push(combo);
    });

    // Calculate analysis for each root sum
    rootSumGroups.forEach((combos, rootSum) => {
      const straightCombinations = combos.map(c => c.straight);
      const boxCombinations = [...new Set(combos.map(c => c.box))];

      const analysis: Pick3RootSumAnalysis = {
        rootSum,
        straightCount: straightCombinations.length,
        boxCount: boxCombinations.length,
        straightCombinations,
        boxCombinations,
        probability: straightCombinations.length / 1000,
        odds: 999 / straightCombinations.length
      };

      this.rootSumAnalysis.set(rootSum, analysis);
    });
  }

  /**
   * Analyze VTrac combinations and mirrors
   */
  private analyzeVTracs(): void {
    const vtracGroups = new Map<string, Pick3Combination[]>();

    // Group combinations by VTrac
    this.combinations.forEach(combo => {
      if (!vtracGroups.has(combo.vtrac)) {
        vtracGroups.set(combo.vtrac, []);
      }
      vtracGroups.get(combo.vtrac)!.push(combo);
    });

    // Calculate VTrac analysis
    vtracGroups.forEach((combos, vtrac) => {
      const combinations = combos.map(c => c.straight);
      const mirrorCombinations = combos.map(c => c.mirror);

      const analysis: Pick3VTracAnalysis = {
        vtrac,
        combinations,
        mirrorCombinations,
        count: combinations.length
      };

      this.vtracAnalysis.set(vtrac, analysis);
    });
  }

  /**
   * Get all combinations
   */
  getAllCombinations(): Pick3Combination[] {
    return this.combinations;
  }

  /**
   * Get combinations by type
   */
  getCombinationsByType(type: 'single' | 'double' | 'triple'): Pick3Combination[] {
    return this.combinations.filter(combo => {
      switch (type) {
        case 'single': return combo.isSingle;
        case 'double': return combo.isDouble;
        case 'triple': return combo.isTriple;
        default: return false;
      }
    });
  }

  /**
   * Get unique box combinations by type
   */
  getUniqueBoxCombinations(type?: 'single' | 'double' | 'triple'): string[] {
    let combos = this.combinations;

    if (type) {
      combos = this.getCombinationsByType(type);
    }

    return [...new Set(combos.map(c => c.box))];
  }

  /**
   * Get sum analysis
   */
  getSumAnalysis(sum: number): Pick3SumAnalysis | undefined {
    return this.sumAnalysis.get(sum);
  }

  /**
   * Get all sum analyses
   */
  getAllSumAnalyses(): Pick3SumAnalysis[] {
    return Array.from(this.sumAnalysis.values()).sort((a, b) => a.sum - b.sum);
  }

  /**
   * Get root sum analysis
   */
  getRootSumAnalysis(rootSum: number): Pick3RootSumAnalysis | undefined {
    return this.rootSumAnalysis.get(rootSum);
  }

  /**
   * Get all root sum analyses
   */
  getAllRootSumAnalyses(): Pick3RootSumAnalysis[] {
    return Array.from(this.rootSumAnalysis.values()).sort((a, b) => a.rootSum - b.rootSum);
  }

  /**
   * Get VTrac analysis
   */
  getVTracAnalysis(vtrac: string): Pick3VTracAnalysis | undefined {
    return this.vtracAnalysis.get(vtrac);
  }

  /**
   * Get all VTrac analyses
   */
  getAllVTracAnalyses(): Pick3VTracAnalysis[] {
    return Array.from(this.vtracAnalysis.values()).sort((a, b) => a.vtrac.localeCompare(b.vtrac));
  }

  /**
   * Calculate odds for different bet types
   */
  calculateOdds(combination: string, betType: 'straight' | 'box'): { odds: number; probability: number } {
    const digits = combination.split('').map(Number);
    const uniqueDigits = new Set(digits);

    if (betType === 'straight') {
      return {
        odds: 999,
        probability: 1/1000
      };
    }

    // Box odds depend on digit uniqueness
    if (uniqueDigits.size === 1) {
      // Triple
      return {
        odds: 999,
        probability: 1/1000
      };
    } else if (uniqueDigits.size === 2) {
      // Double
      return {
        odds: 333,
        probability: 1/334
      };
    } else {
      // Single
      return {
        odds: 166,
        probability: 1/167
      };
    }
  }

  /**
   * Find combinations by sum
   */
  findCombinationsBySum(sum: number): Pick3Combination[] {
    return this.combinations.filter(combo => combo.sum === sum);
  }

  /**
   * Find combinations by root sum
   */
  findCombinationsByRootSum(rootSum: number): Pick3Combination[] {
    return this.combinations.filter(combo => combo.rootSum === rootSum);
  }

  /**
   * Find combinations by sum last digit
   */
  findCombinationsBySumLastDigit(lastDigit: number): Pick3Combination[] {
    return this.combinations.filter(combo => combo.sumLastDigit === lastDigit);
  }

  /**
   * Get sum last digit analysis
   */
  getSumLastDigitAnalysis(lastDigit: number): { combinations: string[]; count: number; probability: number } {
    const combos = this.findCombinationsBySumLastDigit(lastDigit);
    return {
      combinations: combos.map(c => c.straight),
      count: combos.length,
      probability: combos.length / 1000
    };
  }

  /**
   * Get all sum last digit analyses
   */
  getAllSumLastDigitAnalyses(): Array<{ lastDigit: number; combinations: string[]; count: number; probability: number }> {
    const analyses = [];
    for (let i = 0; i < 10; i++) {
      analyses.push({
        lastDigit: i,
        ...this.getSumLastDigitAnalysis(i)
      });
    }
    return analyses;
  }
}

// Singleton instance
export const pick3Analyzer = new Pick3Analyzer();

// Utility functions
export const getPick3Combinations = () => pick3Analyzer.getAllCombinations();
export const getPick3Singles = () => pick3Analyzer.getCombinationsByType('single');
export const getPick3Doubles = () => pick3Analyzer.getCombinationsByType('double');
export const getPick3Triples = () => pick3Analyzer.getCombinationsByType('triple');
export const getPick3SumAnalysis = (sum: number) => pick3Analyzer.getSumAnalysis(sum);
export const getPick3RootSumAnalysis = (rootSum: number) => pick3Analyzer.getRootSumAnalysis(rootSum);
export const calculatePick3Odds = (combination: string, betType: 'straight' | 'box') =>
  pick3Analyzer.calculateOdds(combination, betType);
