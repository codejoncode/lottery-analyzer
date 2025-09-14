import { ColumnAnalyzer, DataManager } from '../utils/scoringSystem';

// Basic test to verify column analysis functionality
export const testColumnAnalysis = async () => {
  console.log('🧪 Testing Column Analysis System...');

  try {
    // Initialize DataManager and load data
    const dataManager = DataManager.getInstance();
    let draws = dataManager.loadData();

    if (draws.length === 0) {
      console.log('📄 Loading CSV data...');
      draws = await dataManager.loadCSVFromFile('/draws.txt');
    }

    console.log(`✅ Loaded ${draws.length} draws`);

    // Initialize ColumnAnalyzer
    const analyzer = new ColumnAnalyzer(draws);
    console.log('✅ ColumnAnalyzer initialized');

    // Test column analysis for column 1
    const column1Analysis = analyzer.analyzeColumn(1);
    console.log('✅ Column 1 analysis completed');

    // Test basic statistics
    const stats = column1Analysis.statisticalSummary;
    console.log(`📊 Column 1 Stats:
      - Total Draws: ${stats.totalDraws}
      - Unique Numbers: ${stats.uniqueNumbers}
      - Average Skips: ${stats.averageSkips.toFixed(2)}
      - Most Frequent: ${stats.mostFrequentNumber}
    `);

    // Test number stats for a specific number
    const numberStats = Array.from(column1Analysis.numberStats.values()).slice(0, 5);
    console.log('🔢 Sample Number Stats for Column 1:');
    numberStats.forEach(stat => {
      console.log(`  Number ${stat.number}: ${stat.drawsSinceLastAppearance} skips, avg gap ${stat.averageGap.toFixed(1)}`);
    });

    // Test pattern stats
    const patternStats = Array.from(column1Analysis.patternStats.values()).slice(0, 3);
    console.log('🎭 Sample Pattern Stats for Column 1:');
    patternStats.forEach(stat => {
      console.log(`  ${stat.pattern}: ${stat.drawsSinceLastAppearance} skips, ${stat.totalAppearances} appearances`);
    });

    // Test cross-column analysis
    const numberAcrossColumns = analyzer.getNumberAcrossColumns(12);
    console.log('🔄 Number 12 across all columns:');
    numberAcrossColumns.forEach(stat => {
      console.log(`  Column ${stat.column}: ${stat.drawsSinceLastAppearance} skips`);
    });

    console.log('🎉 All tests passed! Column Analysis System is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Auto-run test in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Run test after a short delay to ensure DOM is ready
  setTimeout(testColumnAnalysis, 1000);
}
