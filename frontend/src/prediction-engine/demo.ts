import { PredictionEngine } from './PredictionEngine';
import type { Draw } from '../utils/scoringSystem';
import type { Combination, PredictionFilter, PredictionStats } from './types';
import type { FilterConfigUnion } from './filters';

/**
 * Demo/Test file for the Prediction Engine
 * Shows how to use the complete prediction pipeline
 */

// Sample historical draw data for testing
const sampleDraws: Draw[] = [
  {
    date: '2024-01-01',
    white_balls: [5, 12, 23, 34, 45],
    red_ball: 7,
    power_play: '2x'
  },
  {
    date: '2024-01-03',
    white_balls: [3, 15, 27, 38, 52],
    red_ball: 12,
    power_play: '3x'
  },
  {
    date: '2024-01-05',
    white_balls: [7, 18, 29, 41, 56],
    red_ball: 9,
    power_play: '2x'
  },
  {
    date: '2024-01-08',
    white_balls: [2, 14, 26, 39, 48],
    red_ball: 15,
    power_play: '5x'
  },
  {
    date: '2024-01-10',
    white_balls: [9, 21, 33, 44, 58],
    red_ball: 6,
    power_play: '2x'
  }
];

/**
 * Demo function showing prediction engine usage
 */
export async function runPredictionDemo(): Promise<void> {
  console.log('🚀 Starting ApexScoop Prediction Engine Demo');
  console.log('=' .repeat(50));

  // Initialize the prediction engine
  const engine = new PredictionEngine(sampleDraws);

  console.log('📊 Engine initialized with', sampleDraws.length, 'historical draws');

  // Show available filters
  const filters = engine.getAvailableFilters();
  console.log('🔧 Available filters:', filters.map((f: PredictionFilter<FilterConfigUnion>) => f.name));

  // Generate predictions with default settings
  console.log('\n🎯 Generating predictions...');

  const result = await engine.generatePredictions({
    enabledFilters: ['sum-filter', 'parity-filter'],
    maxCombinations: 20,
    minScore: 10
  });

  console.log('\n📈 Prediction Results:');
  console.log('- Total combinations generated:', result.totalGenerated.toLocaleString());
  console.log('- Combinations after filtering:', result.totalFiltered.toLocaleString());
  console.log('- Top predictions returned:', result.combinations.length);
  console.log('- Generation time:', result.generationTime.toFixed(2), 'ms');
  console.log('- Scoring time:', result.scoringTime.toFixed(2), 'ms');

  // Show metadata
  console.log('\n📊 Prediction Metadata:');
  console.log('- Average sum:', result.metadata.averageSum);
  console.log('- Average odd count:', result.metadata.averageOddCount);
  console.log('- Predicted sum range:', result.metadata.predictedSumRange.join('-'));
  console.log('- Average confidence:', result.metadata.confidence);
  console.log('- Hot numbers:', result.metadata.hotNumbers.join(', '));
  console.log('- Cold numbers:', result.metadata.coldNumbers.join(', '));

  // Show top 5 predictions
  console.log('\n🏆 Top 5 Predictions:');
  result.combinations.slice(0, 5).forEach((combo: Combination, index: number) => {
    console.log(`${index + 1}. ${combo.numbers.join(' ')} (Score: ${combo.compositeScore.toFixed(1)}, Confidence: ${combo.confidence.toFixed(2)})`);
    console.log(`   Reasoning: ${combo.reasoning.slice(0, 2).join('; ')}`);
  });

  // Show prediction statistics
  const stats: PredictionStats = engine.getPredictionStats(result.combinations);
  console.log('\n📈 Prediction Statistics:');

  console.log('Score Distribution:');
  stats.scoreDistribution.forEach((dist: { range: string; count: number }) => {
    console.log(`  ${dist.range}: ${dist.count} combinations`);
  });

  console.log('\nTop 5 Most Frequent Numbers:');
  stats.topNumbers.slice(0, 5).forEach((num: { number: number; frequency: number }) => {
    console.log(`  ${num.number}: ${num.frequency} appearances`);
  });

  console.log('\nAverage Metrics:');
  console.log(`  Sum: ${stats.averageMetrics.sum.toFixed(1)}`);
  console.log(`  Odd Count: ${stats.averageMetrics.oddCount.toFixed(1)}`);
  console.log(`  High Count: ${stats.averageMetrics.highCount.toFixed(1)}`);
  console.log(`  Score: ${stats.averageMetrics.score.toFixed(1)}`);
  console.log(`  Confidence: ${stats.averageMetrics.confidence.toFixed(2)}`);

  // Export sample data
  const csvData = engine.exportPredictions(result.combinations.slice(0, 10));
  console.log('\n💾 Sample CSV Export (first 10 predictions):');
  console.log(csvData.split('\n').slice(0, 6).join('\n'));
  console.log('...');

  console.log('\n✅ Demo completed successfully!');
  console.log('=' .repeat(50));
}

/**
 * Advanced demo with custom scoring weights
 */
export async function runAdvancedDemo(): Promise<void> {
  console.log('🔬 Advanced Prediction Demo with Custom Weights');
  console.log('=' .repeat(50));

  const engine = new PredictionEngine(sampleDraws);

  // Custom weights emphasizing different factors
  const customWeights = {
    recurrence: 0.4,        // Higher weight on historical frequency
    skipAlignment: 0.3,     // Higher weight on timing patterns
    pairRecurrence: 0.1,    // Lower weight on number relationships
    tripleRecurrence: 0.05, // Lower weight on triple patterns
    sumProximity: 0.05,     // Lower weight on sum closeness
    hotColdStatus: 0.05,    // Lower weight on hot/cold status
    locationFit: 0.03,      // Lower weight on draw location
    parityBalance: 0.02     // Lower weight on odd/even balance
  };

  console.log('⚖️ Custom Scoring Weights:');
  Object.entries(customWeights).forEach(([key, value]) => {
    console.log(`  ${key}: ${(value * 100).toFixed(0)}%`);
  });

  engine.setScoringWeights(customWeights);

  const result = await engine.generatePredictions({
    enabledFilters: ['sum-filter', 'parity-filter', 'skip-filter'],
    maxCombinations: 15,
    minScore: 15
  });

  console.log('\n🏆 Top Predictions with Custom Weights:');
  result.combinations.slice(0, 5).forEach((combo: Combination, index: number) => {
    console.log(`${index + 1}. ${combo.numbers.join(' ')} (Score: ${combo.compositeScore.toFixed(1)})`);
  });

  console.log('\n✅ Advanced demo completed!');
}

// Export for use in other files
export { sampleDraws };
