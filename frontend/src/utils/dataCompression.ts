import { type Draw } from './scoringSystem';

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  decompressionTime: number;
}

export interface RunLengthPair {
  value: number;
  count: number;
}

export type RunLengthEncodedData = RunLengthPair[][];

export interface DeltaEncodedData {
  type: 'delta';
  firstDraw: Draw;
  deltas: number[][];
  dates: string[];
  powerPlays: string[];
}

export class DataCompressionManager {
  /**
   * Compress draw data using run-length encoding for repeated patterns
   */
  static compressDraws(draws: Draw[]): { compressed: RunLengthEncodedData, stats: CompressionStats } {
    const startTime = performance.now();

    // Convert draws to a more compressible format
    const drawNumbers = draws.map(draw => [...draw.white_balls, draw.red_ball]);

    // Apply run-length encoding to the number sequences
    const compressed = this.runLengthEncode(drawNumbers);

    const compressionTime = performance.now() - startTime;

    const originalSize = JSON.stringify(draws).length;
    const compressedSize = JSON.stringify(compressed).length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      compressed,
      stats: {
        originalSize,
        compressedSize,
        compressionRatio,
        compressionTime,
        decompressionTime: 0 // Will be set during decompression
      }
    };
  }

  /**
   * Decompress draw data
   */
  static decompressDraws(compressed: RunLengthEncodedData, originalDates: string[], originalPowerPlays: string[]): { draws: Draw[], stats: CompressionStats } {
    const startTime = performance.now();

    // Decompress the number sequences
    const drawNumbers = this.runLengthDecode(compressed);

    // Reconstruct draws
    const draws: Draw[] = drawNumbers.map((numbers, index) => ({
      date: originalDates[index] || `2023-${String(index + 1).padStart(3, '0')}`,
      white_balls: numbers.slice(0, 5),
      red_ball: numbers[5],
      power_play: originalPowerPlays[index] || '2x'
    }));

    const decompressionTime = performance.now() - startTime;

    const compressedSize = JSON.stringify(compressed).length;
    const originalSize = JSON.stringify(draws).length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      draws,
      stats: {
        originalSize,
        compressedSize,
        compressionRatio,
        compressionTime: 0, // Not measured during decompression
        decompressionTime
      }
    };
  }

  /**
   * Run-length encoding for number sequences
   */
  private static runLengthEncode(data: number[][]): RunLengthEncodedData {
    const encoded: RunLengthEncodedData = [];

    data.forEach(sequence => {
      const encodedSequence: RunLengthPair[] = [];
      let currentValue = sequence[0];
      let count = 1;

      for (let i = 1; i < sequence.length; i++) {
        if (sequence[i] === currentValue) {
          count++;
        } else {
          encodedSequence.push({ value: currentValue, count });
          currentValue = sequence[i];
          count = 1;
        }
      }
      encodedSequence.push({ value: currentValue, count });
      encoded.push(encodedSequence);
    });

    return encoded;
  }

  /**
   * Run-length decoding for number sequences
   */
  private static runLengthDecode(encoded: RunLengthEncodedData): number[][] {
    const decoded: number[][] = [];

    encoded.forEach(encodedSequence => {
      const sequence: number[] = [];
      encodedSequence.forEach((pair: RunLengthPair) => {
        for (let i = 0; i < pair.count; i++) {
          sequence.push(pair.value);
        }
      });
      decoded.push(sequence);
    });

    return decoded;
  }

  /**
   * Compress using delta encoding (store differences instead of absolute values)
   */
  static compressWithDeltaEncoding(draws: Draw[]): { compressed: DeltaEncodedData, stats: CompressionStats } {
    const startTime = performance.now();

    const numbers = draws.map(draw => [...draw.white_balls, draw.red_ball]);
    const deltas: number[][] = [];

    numbers.forEach(sequence => {
      const deltaSequence: number[] = [sequence[0]]; // First value as-is
      for (let i = 1; i < sequence.length; i++) {
        deltaSequence.push(sequence[i] - sequence[i - 1]);
      }
      deltas.push(deltaSequence);
    });

    const compressed: DeltaEncodedData = {
      type: 'delta',
      firstDraw: draws[0],
      deltas,
      dates: draws.map(d => d.date),
      powerPlays: draws.map(d => d.power_play)
    };

    const compressionTime = performance.now() - startTime;
    const originalSize = JSON.stringify(draws).length;
    const compressedSize = JSON.stringify(compressed).length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      compressed,
      stats: {
        originalSize,
        compressedSize,
        compressionRatio,
        compressionTime,
        decompressionTime: 0
      }
    };
  }

  /**
   * Decompress delta-encoded data
   */
  static decompressDeltaEncoding(compressed: DeltaEncodedData): { draws: Draw[], stats: CompressionStats } {
    const startTime = performance.now();

    const { deltas, dates, powerPlays } = compressed;
    const draws: Draw[] = [];

    deltas.forEach((deltaSequence: number[], index: number) => {
      const sequence: number[] = [deltaSequence[0]]; // First value
      for (let i = 1; i < deltaSequence.length; i++) {
        sequence.push(sequence[i - 1] + deltaSequence[i]);
      }

      draws.push({
        date: dates[index],
        white_balls: sequence.slice(0, 5),
        red_ball: sequence[5],
        power_play: powerPlays[index]
      });
    });

    const decompressionTime = performance.now() - startTime;
    const compressedSize = JSON.stringify(compressed).length;
    const originalSize = JSON.stringify(draws).length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      draws,
      stats: {
        originalSize,
        compressedSize,
        compressionRatio,
        compressionTime: 0,
        decompressionTime
      }
    };
  }

  /**
   * Get compression recommendations based on dataset size
   */
  static getCompressionRecommendations(datasetSize: number): {
    recommendedMethod: string;
    expectedCompressionRatio: number;
    useCase: string;
  } {
    if (datasetSize < 1000) {
      return {
        recommendedMethod: 'none',
        expectedCompressionRatio: 0,
        useCase: 'Small datasets don\'t benefit from compression'
      };
    } else if (datasetSize < 10000) {
      return {
        recommendedMethod: 'run-length',
        expectedCompressionRatio: 15,
        useCase: 'Medium datasets benefit from run-length encoding'
      };
    } else {
      return {
        recommendedMethod: 'delta-encoding',
        expectedCompressionRatio: 25,
        useCase: 'Large datasets benefit from delta encoding'
      };
    }
  }

  /**
   * Benchmark different compression methods
   */
  static async benchmarkCompression(draws: Draw[]): Promise<{
    methods: { name: string; stats: CompressionStats }[];
    recommendations: string[];
  }> {
    const methods = [];

    // Test run-length encoding
    try {
      const rlResult = this.compressDraws(draws);
      methods.push({ name: 'Run-Length Encoding', stats: rlResult.stats });
    } catch (error) {
      console.error('Run-length encoding failed:', error);
    }

    // Test delta encoding
    try {
      const deltaResult = this.compressWithDeltaEncoding(draws);
      methods.push({ name: 'Delta Encoding', stats: deltaResult.stats });
    } catch (error) {
      console.error('Delta encoding failed:', error);
    }

    const recommendations = [
      `Dataset size: ${draws.length} draws`,
      `Original size: ${(JSON.stringify(draws).length / 1024).toFixed(2)} KB`,
      ...methods.map(m =>
        `${m.name}: ${(m.stats.compressionRatio).toFixed(1)}% compression, ${(m.stats.compressionTime).toFixed(2)}ms`
      )
    ];

    const bestMethod = methods.reduce((best, current) =>
      current.stats.compressionRatio > best.stats.compressionRatio ? current : best
    );

    if (bestMethod) {
      recommendations.push(`Recommended: ${bestMethod.name} (${bestMethod.stats.compressionRatio.toFixed(1)}% compression)`);
    }

    return { methods, recommendations };
  }
}
