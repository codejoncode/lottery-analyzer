import { ColumnAnalyzer, type Draw } from './scoringSystem';

export interface UserAcceptanceTest {
  id: string;
  name: string;
  description: string;
  category: 'functionality' | 'performance' | 'usability' | 'accuracy';
  testFunction: () => Promise<UserAcceptanceTestResult>;
}

export interface UserAcceptanceTestResult {
  testId: string;
  passed: boolean;
  score: number; // 0-100
  duration: number;
  details: string;
  recommendations?: string[];
  metrics?: Record<string, unknown>;
}

export interface UserAcceptanceTestSummary {
  totalTests: number;
  passedTests: number;
  averageScore: number;
  totalDuration: number;
}

export class UserAcceptanceTestingFramework {
  private tests: UserAcceptanceTest[] = [];
  private testData: Draw[] = [];

  constructor(testData: Draw[] = []) {
    this.testData = testData;
    this.initializeTests();
  }

  private initializeTests(): void {
    // Functionality Tests
    this.addTest({
      id: 'column-analysis-basic',
      name: 'Basic Column Analysis',
      description: 'Test that column analysis produces expected results',
      category: 'functionality',
      testFunction: async () => {
        const analyzer = new ColumnAnalyzer(this.testData);
        const startTime = performance.now();

        const analysis = analyzer.analyzeColumn(1);
        const duration = performance.now() - startTime;

        const passed = analysis && analysis.numberStats.size > 0;
        const score = passed ? 95 : 0;

        return {
          testId: 'column-analysis-basic',
          passed,
          score,
          duration,
          details: passed ? 'Column analysis completed successfully' : 'Column analysis failed',
          metrics: {
            numberStatsCount: analysis?.numberStats.size || 0,
            patternStatsCount: analysis?.patternStats.size || 0
          }
        };
      }
    });

    this.addTest({
      id: 'correlation-analysis',
      name: 'Column Correlation Analysis',
      description: 'Test correlation analysis between columns',
      category: 'functionality',
      testFunction: async () => {
        const analyzer = new ColumnAnalyzer(this.testData);
        const startTime = performance.now();

        const correlations = analyzer.calculateAllColumnCorrelations();
        const duration = performance.now() - startTime;

        const passed = correlations.length > 0;
        const score = passed ? Math.min(100, correlations.length * 10) : 0;

        return {
          testId: 'correlation-analysis',
          passed,
          score,
          duration,
          details: `Found ${correlations.length} column correlations`,
          metrics: {
            correlationCount: correlations.length,
            avgCorrelation: correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length
          }
        };
      }
    });

    // Performance Tests
    this.addTest({
      id: 'analysis-performance',
      name: 'Analysis Performance',
      description: 'Test that analysis completes within acceptable time limits',
      category: 'performance',
      testFunction: async () => {
        const analyzer = new ColumnAnalyzer(this.testData);
        const startTime = performance.now();

        // Analyze all columns
        for (let col = 1; col <= 6; col++) {
          analyzer.analyzeColumn(col);
        }

        const duration = performance.now() - startTime;
        const targetTime = 2000; // 2 seconds
        const passed = duration < targetTime;
        const score = Math.max(0, 100 - (duration - targetTime) / 10);

        return {
          testId: 'analysis-performance',
          passed,
          score: Math.max(0, score),
          duration,
          details: `Analysis completed in ${duration.toFixed(2)}ms`,
          recommendations: passed ? undefined : ['Consider optimizing analysis algorithms for better performance']
        };
      }
    });

    // Accuracy Tests
    this.addTest({
      id: 'prediction-accuracy',
      name: 'Prediction Accuracy Validation',
      description: 'Test prediction accuracy against historical data',
      category: 'accuracy',
      testFunction: async () => {
        if (this.testData.length < 10) {
          return {
            testId: 'prediction-accuracy',
            passed: false,
            score: 0,
            duration: 0,
            details: 'Insufficient test data for accuracy validation'
          };
        }

        const analyzer = new ColumnAnalyzer(this.testData);
        const predictions = [5, 15, 25, 35, 45]; // Mock predictions
        const actuals = this.testData[this.testData.length - 1].white_balls.slice(0, 5);

        const accuracy = analyzer.trackPredictionAccuracy(1, predictions, actuals);

        const score = accuracy.accuracy * 100;

        return {
          testId: 'prediction-accuracy',
          passed: accuracy.accuracy > 0,
          score,
          duration: 0,
          details: `Prediction accuracy: ${(accuracy.accuracy * 100).toFixed(1)}%`,
          metrics: {
            totalPredictions: accuracy.totalPredictions,
            correctPredictions: accuracy.correctPredictions,
            accuracy: accuracy.accuracy
          }
        };
      }
    });

    // Usability Tests
    this.addTest({
      id: 'data-export-import',
      name: 'Data Export/Import Usability',
      description: 'Test that data can be exported and imported successfully',
      category: 'usability',
      testFunction: async () => {
        const analyzer = new ColumnAnalyzer(this.testData);
        const startTime = performance.now();

        // Export data
        const jsonData = analyzer.exportColumnData();
        const csvData = analyzer.exportColumnDataCSV();

        // Import data
        const newAnalyzer = new ColumnAnalyzer();
        const importSuccess = newAnalyzer.importColumnData(jsonData);

        const duration = performance.now() - startTime;
        const passed = importSuccess && jsonData.length > 0 && csvData.length > 0;
        const score = passed ? 90 : 0;

        return {
          testId: 'data-export-import',
          passed,
          score,
          duration,
          details: passed ? 'Data export/import successful' : 'Data export/import failed',
          metrics: {
            jsonDataSize: jsonData.length,
            csvDataSize: csvData.length,
            importSuccess
          }
        };
      }
    });
  }

  addTest(test: UserAcceptanceTest): void {
    this.tests.push(test);
  }

  async runAllTests(): Promise<{
    results: UserAcceptanceTestResult[];
    summary: {
      totalTests: number;
      passedTests: number;
      averageScore: number;
      totalDuration: number;
    };
  }> {
    console.log('🚀 Running User Acceptance Tests...');

    const results: UserAcceptanceTestResult[] = [];

    for (const test of this.tests) {
      try {
        console.log(`📋 Running test: ${test.name}`);
        const result = await test.testFunction();
        results.push(result);
        console.log(`✅ ${test.name}: ${result.passed ? 'PASSED' : 'FAILED'} (${result.score.toFixed(1)}%)`);
      } catch (error) {
        console.error(`❌ ${test.name}: ERROR - ${error}`);
        results.push({
          testId: test.id,
          passed: false,
          score: 0,
          duration: 0,
          details: `Test error: ${error}`
        });
      }
    }

    const summary = {
      totalTests: results.length,
      passedTests: results.filter(r => r.passed).length,
      averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    };

    return { results, summary };
  }

  async runTestById(testId: string): Promise<UserAcceptanceTestResult | null> {
    const test = this.tests.find(t => t.id === testId);
    if (!test) return null;

    return await test.testFunction();
  }

  getAvailableTests(): UserAcceptanceTest[] {
    return [...this.tests];
  }

  generateReport(results: UserAcceptanceTestResult[], summary: UserAcceptanceTestSummary): string {
    const report = [
      '📊 User Acceptance Testing Report',
      '=' .repeat(50),
      '',
      `Total Tests: ${summary.totalTests}`,
      `Passed: ${summary.passedTests}`,
      `Failed: ${summary.totalTests - summary.passedTests}`,
      `Average Score: ${summary.averageScore.toFixed(1)}%`,
      `Total Duration: ${summary.totalDuration.toFixed(2)}ms`,
      '',
      'Detailed Results:',
      ...results.map(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        return `${status} ${result.testId}: ${result.score.toFixed(1)}% - ${result.details}`;
      }),
      '',
      'Recommendations:',
      ...this.generateRecommendations(results),
      '',
      '=' .repeat(50)
    ];

    return report.join('\n');
  }

  private generateRecommendations(results: UserAcceptanceTestResult[]): string[] {
    const recommendations: string[] = [];

    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      recommendations.push(`- ${failedTests.length} tests failed and need attention`);
    }

    const lowScoreTests = results.filter(r => r.score < 70);
    if (lowScoreTests.length > 0) {
      recommendations.push(`- ${lowScoreTests.length} tests have low scores and may need optimization`);
    }

    const slowTests = results.filter(r => r.duration > 1000);
    if (slowTests.length > 0) {
      recommendations.push(`- ${slowTests.length} tests are slow and may need performance optimization`);
    }

    if (recommendations.length === 0) {
      recommendations.push('- All tests passed successfully! System is ready for production.');
    }

    return recommendations;
  }
}
