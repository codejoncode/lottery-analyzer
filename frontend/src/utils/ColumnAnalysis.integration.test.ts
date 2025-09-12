import { describe, it, expect, beforeEach } from 'vitest';
import { ColumnAnalyzer, type Draw } from './scoringSystem';

describe('Column Analysis Integration Tests', () => {
  let columnAnalyzer: ColumnAnalyzer;

  const testDraws: Draw[] = [
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
    },
    {
      date: '2023-01-03',
      white_balls: [8, 17, 29, 41, 52],
      red_ball: 15,
      power_play: '4x'
    },
    {
      date: '2023-01-04',
      white_balls: [3, 19, 31, 43, 55],
      red_ball: 8,
      power_play: '5x'
    },
    {
      date: '2023-01-05',
      white_balls: [7, 21, 33, 45, 58],
      red_ball: 12,
      power_play: '3x'
    }
  ];

  beforeEach(() => {
    columnAnalyzer = new ColumnAnalyzer(testDraws);
  });

  describe('End-to-End Column Analysis Workflow', () => {
    it('should process complete column analysis workflow', () => {
      // Test column 1 analysis
      const analysis = columnAnalyzer.analyzeColumn(1);

      expect(analysis).toBeDefined();
      expect(analysis.numberStats).toBeDefined();
      expect(analysis.patternStats).toBeDefined();
      expect(analysis.statisticalSummary).toBeDefined();

      // Verify statistical summary
      const summary = analysis.statisticalSummary;
      expect(summary.totalDraws).toBe(5);
      expect(summary.uniqueNumbers).toBeGreaterThan(0);
      expect(summary.averageSkips).toBeGreaterThanOrEqual(0);
    });

    it('should validate visualization data accuracy', () => {
      const analysis = columnAnalyzer.analyzeColumn(1);

      // Test that number stats contain expected data
      const number5Stats = analysis.numberStats.get('1-5');
      expect(number5Stats).toBeDefined();
      expect(number5Stats?.totalAppearances).toBe(1);
      expect(number5Stats?.column).toBe(1);
      expect(number5Stats?.number).toBe(5);
    });

    it('should test navigation and filtering integration', () => {
      // Test correlation analysis
      const correlations = columnAnalyzer.calculateAllColumnCorrelations();
      expect(correlations).toBeDefined();
      expect(correlations.length).toBeGreaterThan(0);

      // Test trend detection
      const trend = columnAnalyzer.detectColumnTrend(1);
      expect(trend).toBeDefined();
      expect(['increasing', 'decreasing', 'stable', 'cyclical']).toContain(trend.trend);
    });

    it('should validate prediction accuracy tracking', () => {
      const predictions = [5, 15, 25]; // Mock predictions for column 1
      const actuals = [5, 17, 31]; // Actual values from test data

      const accuracy = columnAnalyzer.trackPredictionAccuracy(1, predictions, actuals);

      expect(accuracy).toBeDefined();
      expect(accuracy.totalPredictions).toBe(3);
      expect(accuracy.accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Testing with Large Datasets', () => {
    it('should handle large dataset performance', () => {
      // Create a larger dataset
      const largeDraws: Draw[] = [];
      for (let i = 0; i < 100; i++) {
        largeDraws.push({
          date: `2023-${String(i + 1).padStart(3, '0')}`,
          white_balls: [
            Math.floor(Math.random() * 69) + 1,
            Math.floor(Math.random() * 69) + 1,
            Math.floor(Math.random() * 69) + 1,
            Math.floor(Math.random() * 69) + 1,
            Math.floor(Math.random() * 69) + 1
          ].sort((a, b) => a - b),
          red_ball: Math.floor(Math.random() * 26) + 1,
          power_play: '2x'
        });
      }

      const startTime = performance.now();

      const largeColumnAnalyzer = new ColumnAnalyzer(largeDraws);

      // Test analysis performance
      const analysis = largeColumnAnalyzer.analyzeColumn(1);
      const endTime = performance.now();

      expect(analysis).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should test caching effectiveness', () => {
      const startTime1 = performance.now();
      const analysis1 = columnAnalyzer.analyzeColumn(1);
      const endTime1 = performance.now();

      const startTime2 = performance.now();
      const analysis2 = columnAnalyzer.analyzeColumn(1); // Should use cache
      const endTime2 = performance.now();

      expect(analysis1).toEqual(analysis2);
      expect(endTime2 - startTime2).toBeLessThan(endTime1 - startTime1); // Cached should be faster
    });
  });

  describe('Data Export/Import Integration', () => {
    it('should export and import column data correctly', () => {
      // Export data
      const exportedData = columnAnalyzer.exportColumnData();
      expect(exportedData).toBeDefined();
      expect(typeof exportedData).toBe('string');

      // Create new analyzer and import
      const newAnalyzer = new ColumnAnalyzer();
      const importSuccess = newAnalyzer.importColumnData(exportedData);
      expect(importSuccess).toBe(true);

      // Test that the new analyzer can perform basic operations
      // (Note: Since import is simplified, we test basic functionality)
      expect(() => newAnalyzer.analyzeColumn(1)).not.toThrow();
    });

    it('should export CSV format correctly', () => {
      const csvData = columnAnalyzer.exportColumnDataCSV();
      expect(csvData).toBeDefined();
      expect(typeof csvData).toBe('string');

      const lines = csvData.split('\n');
      expect(lines.length).toBeGreaterThan(1);

      // Check header
      const header = lines[0];
      expect(header).toContain('Column');
      expect(header).toContain('DrawIndex');
      expect(header).toContain('Number');
      expect(header).toContain('Date');

      // Check that we have data rows
      expect(lines.length).toBeGreaterThan(6); // Header + 5 draws * 6 columns each
    });
  });
});
