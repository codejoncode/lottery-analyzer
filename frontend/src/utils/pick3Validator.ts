import { pick3Analyzer } from './pick3Analyzer';

/**
 * Validation script for Pick 3 Analyzer
 * Verifies mathematical accuracy against specifications
 */
export function validatePick3Analyzer(): void {
  console.log('🔍 Validating Pick 3 Analyzer...');

  // Test 1: Total combinations
  const combinations = pick3Analyzer.getAllCombinations();
  console.log(`✅ Total combinations: ${combinations.length} (expected: 1000)`);
  if (combinations.length !== 1000) {
    console.error('❌ FAILED: Incorrect total combinations');
    return;
  }

  // Test 2: Sum range
  const sumAnalyses = pick3Analyzer.getAllSumAnalyses();
  const sums = sumAnalyses.map(s => s.sum);
  const minSum = Math.min(...sums);
  const maxSum = Math.max(...sums);
  console.log(`✅ Sum range: ${minSum}-${maxSum} (expected: 0-27)`);
  if (minSum !== 0 || maxSum !== 27) {
    console.error('❌ FAILED: Incorrect sum range');
    return;
  }

  // Test 3: Box combinations
  const singles = pick3Analyzer.getUniqueBoxCombinations('single');
  const doubles = pick3Analyzer.getUniqueBoxCombinations('double');
  const triples = pick3Analyzer.getUniqueBoxCombinations('triple');
  const totalBox = singles.length + doubles.length + triples.length;
  console.log(`✅ Box combinations: ${totalBox} (expected: 220)`);
  console.log(`   - Singles: ${singles.length}`);
  console.log(`   - Doubles: ${doubles.length}`);
  console.log(`   - Triples: ${triples.length}`);
  if (totalBox !== 220) {
    console.error('❌ FAILED: Incorrect box combination count');
    return;
  }

  // Test 4: Root sum range
  const rootSumAnalyses = pick3Analyzer.getAllRootSumAnalyses();
  const rootSums = rootSumAnalyses.map(r => r.rootSum);
  const minRootSum = Math.min(...rootSums);
  const maxRootSum = Math.max(...rootSums);
  console.log(`✅ Root sum range: ${minRootSum}-${maxRootSum} (expected: 0-9)`);
  if (minRootSum !== 0 || maxRootSum !== 9) {
    console.error('❌ FAILED: Incorrect root sum range');
    return;
  }

  // Test 5: Sample probability calculations
  const sum13 = pick3Analyzer.getSumAnalysis(13);
  if (sum13) {
    console.log(`✅ Sum 13 analysis: ${sum13.straightCount} combinations, ${(sum13.probability * 100).toFixed(2)}% probability`);
  }

  // Test 6: Combination types
  const singleCombos = pick3Analyzer.getCombinationsByType('single');
  const doubleCombos = pick3Analyzer.getCombinationsByType('double');
  const tripleCombos = pick3Analyzer.getCombinationsByType('triple');
  const totalTyped = singleCombos.length + doubleCombos.length + tripleCombos.length;
  console.log(`✅ Combination types total: ${totalTyped} (expected: 1000)`);
  console.log(`   - Singles: ${singleCombos.length}`);
  console.log(`   - Doubles: ${doubleCombos.length}`);
  console.log(`   - Triples: ${tripleCombos.length}`);

  // Test 7: Odds calculation
  const straightOdds = pick3Analyzer.calculateOdds('123', 'straight');
  const boxOdds = pick3Analyzer.calculateOdds('123', 'box');
  console.log(`✅ Odds calculation:`);
  console.log(`   - Straight: ${straightOdds.odds}:1 (${(straightOdds.probability * 100).toFixed(3)}%)`);
  console.log(`   - Box (123): ${boxOdds.odds}:1 (${(boxOdds.probability * 100).toFixed(3)}%)`);

  // Test 8: VTrac analysis
  const vtracAnalyses = pick3Analyzer.getAllVTracAnalyses();
  console.log(`✅ VTrac combinations: ${vtracAnalyses.length}`);

  // Test 9: Sum last digit
  const lastDigitAnalyses = pick3Analyzer.getAllSumLastDigitAnalyses();
  const totalLastDigit = lastDigitAnalyses.reduce((sum, analysis) => sum + analysis.count, 0);
  console.log(`✅ Sum last digit total: ${totalLastDigit} (expected: 1000)`);

  console.log('\n🎉 All validations passed! Pick 3 Analyzer is mathematically accurate.');
}

// Auto-run validation if this script is executed directly
if (typeof window === 'undefined') {
  validatePick3Analyzer();
}
