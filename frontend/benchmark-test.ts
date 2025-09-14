// Quick performance benchmark test
import { PerformanceBenchmark } from './performanceBenchmark';
import { ColumnAnalyzer, type Draw } from './scoringSystem';

// Create test data
const testDraws: Draw[] = [];
for (let i = 0; i < 50; i++) {
  testDraws.push({
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

const benchmark = new PerformanceBenchmark(testDraws);
benchmark.runComprehensiveBenchmark().then(result => {
  console.log('🚀 Performance Benchmark Results:');
  console.log('📊 Averages:', result.averages);
  console.log('💡 Recommendations:', result.recommendations);
}).catch(console.error);
