import type { Pick3Draw } from './Pick3DataManager';

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

  private generatePredictions(columns: ColumnData[], patterns: any): {
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
}
