import { describe, it, expect } from 'vitest';
import { ColumnAnalyzer, type Draw } from './scoringSystem';

describe('ColumnAnalyzer', () => {
  const mockDraws: Draw[] = [
    {
      date: '2023-01-01',
      white_balls: [5, 12, 23, 34, 45],
      red_ball: 10,
      power_play: '2x'
    },
    {
      date: '2023-01-02',
      white_balls: [1, 15, 28, 39, 50],
      red_ball: 5,
      power_play: '3x'
    }
  ];

  it('should initialize with draws', () => {
    const analyzer = new ColumnAnalyzer(mockDraws);
    expect(analyzer).toBeDefined();
  });

  it('should analyze column 1', () => {
    const analyzer = new ColumnAnalyzer(mockDraws);
    const analysis = analyzer.analyzeColumn(1);
    expect(analysis).toBeDefined();
    expect(analysis.numberStats).toBeDefined();
  });

  it('should return correct number stats for column 1', () => {
    const analyzer = new ColumnAnalyzer(mockDraws);
    const analysis = analyzer.analyzeColumn(1);
    const stats = analysis.numberStats.get('1-5'); // number 5 in column 1
    expect(stats).toBeDefined();
    expect(stats?.totalAppearances).toBe(1);
  });
});
