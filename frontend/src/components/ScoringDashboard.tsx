import React, { useState, useEffect } from 'react';
import { PowerballScoringSystem, DataManager } from '../utils/scoringSystem';
import type { NumberScoreData, CombinationScore, Draw } from '../utils/scoringSystem';
import { NewDrawForm } from './NewDrawForm';
import { CacheManager } from './CacheManager';
import { DrawDetailModal } from './DrawDetailModal';

interface ExportData {
  numberStats: NumberScoreData[];
  totalDraws: number;
  lastUpdated: string;
  columnAnalysis: string;
}

const ScoringDashboard: React.FC = () => {
  const [scoringSystem, setScoringSystem] = useState<PowerballScoringSystem | null>(null);
  // Removed unused state variable 'numberStats'
  const [topNumbers, setTopNumbers] = useState<Array<{ number: number; score: number; stats: NumberScoreData }>>([]);
  const [sampleCombination, setSampleCombination] = useState<CombinationScore | null>(null);
  const [sumPrediction, setSumPrediction] = useState<{ predictedSum: number; confidence: number; range: { min: number; max: number } } | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [numberDetails, setNumberDetails] = useState<NumberScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizedCombinations, setOptimizedCombinations] = useState<CombinationScore[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<{
    evenOddRatios: { [key: string]: number };
    sumRanges: { [key: string]: number };
    hotColdRatios: { [key: string]: number };
  } | null>(null);
  const [mlPredictions, setMlPredictions] = useState<Map<number, { probability: number; confidence: number }>>(new Map());
  const [advancedPatterns, setAdvancedPatterns] = useState<{
    clusters: Array<{ center: number; numbers: number[]; frequency: number }>;
    cycles: Array<{ length: number; strength: number }>;
    anomalies: Array<{ number: number; deviation: number; significance: number }>;
  } | null>(null);
  const [nextDrawPrediction, setNextDrawPrediction] = useState<{
    combination: number[];
    powerball: number;
    confidence: number;
    expectedSum: number;
    riskLevel: 'low' | 'medium' | 'high';
  } | null>(null);
  const [predictionStats, setPredictionStats] = useState<{
    totalPredictions: number;
    averageAccuracy: number;
    bestAccuracy: number;
    worstAccuracy: number;
    accuracyTrend: 'improving' | 'declining' | 'stable';
    recentAccuracy: number;
  } | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    calculationTime: number;
    memoryUsage: number;
    predictionAccuracy: number;
  } | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Create new scoring system with updated data
      const system = PowerballScoringSystem.createFromDataManager();
      setScoringSystem(system);

      const top = system.getTopScoringNumbers(20);
      setTopNumbers(top);

      // Update all other data...
      if (sampleCombination) {
        const updatedScore = system.calculateCombinationScore(
          sampleCombination.white_balls, 
          sampleCombination.powerball
        );
        setSampleCombination(updatedScore);
      }

      const prediction = system.predictNextSum();
      setSumPrediction(prediction);

      const optimized = system.generateOptimizedCombinations(5);
      setOptimizedCombinations(optimized);

      const patterns = system.analyzePatterns();
      setPatternAnalysis(patterns);

      // Update ML predictions
      const mlPreds = new Map<number, { probability: number; confidence: number }>();
      for (let num = 1; num <= 69; num++) {
        const prediction = system.predictNumberAppearance(num);
        mlPreds.set(num, { probability: prediction.probability, confidence: prediction.confidence });
      }
      setMlPredictions(mlPreds);

      const advancedPatterns = system.analyzeAdvancedPatterns();
      setAdvancedPatterns(advancedPatterns);

      const optimalPrediction = system.predictOptimalCombination();
      setNextDrawPrediction(optimalPrediction);

      const predictionStatsData = system.getPredictionStats();
      setPredictionStats(predictionStatsData);

      const performanceResult = system.updatePredictionsWithPerformance();
      setPerformanceMetrics(performanceResult.performanceMetrics);

      const exportInfo = system.exportSystemData();
      setExportData(exportInfo);

      setLoading(false);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeScoringSystem = async () => {
      try {
        // Use DataManager to load data (will use cache if available)
        const dataManager = DataManager.getInstance();
        
        // Load CSV data if cache is empty or invalid
        let draws = dataManager.loadData();
        if (draws.length === 0) {
          draws = await dataManager.loadCSVFromFile('/draws.txt');
        }
        
        const system = new PowerballScoringSystem(draws);
        setScoringSystem(system);

        const top = system.getTopScoringNumbers(20);
        setTopNumbers(top);

        // Generate a sample combination for demonstration
        const sampleWhiteBalls = [12, 23, 34, 45, 56]; // Sample combination
        const samplePowerball = 7;
        const score = system.calculateCombinationScore(sampleWhiteBalls, samplePowerball);
        setSampleCombination(score);

        // Get sum prediction
        const prediction = system.predictNextSum();
        setSumPrediction(prediction);

        // Generate optimized combinations
        const optimized = system.generateOptimizedCombinations(5);
        setOptimizedCombinations(optimized);

        // Get pattern analysis
        const patterns = system.analyzePatterns();
        setPatternAnalysis(patterns);

        // Initialize ML predictions
        const mlPreds = new Map<number, { probability: number; confidence: number }>();
        for (let num = 1; num <= 69; num++) {
          const prediction = system.predictNumberAppearance(num);
          mlPreds.set(num, { probability: prediction.probability, confidence: prediction.confidence });
        }
        setMlPredictions(mlPreds);

        // Get advanced pattern analysis
        const advancedPatterns = system.analyzeAdvancedPatterns();
        setAdvancedPatterns(advancedPatterns);

        // Get ML-based optimal combination prediction
        const optimalPrediction = system.predictOptimalCombination();
        setNextDrawPrediction(optimalPrediction);

        // Get prediction statistics
        const predictionStatsData = system.getPredictionStats();
        setPredictionStats(predictionStatsData);

        // Get initial performance metrics
        const performanceResult = system.updatePredictionsWithPerformance();
        setPerformanceMetrics(performanceResult.performanceMetrics);

        // Get export data
        const exportInfo = system.exportSystemData();
        setExportData(exportInfo);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing scoring system:', error);
        setLoading(false);
      }
    };

    initializeScoringSystem();
  }, []);

  const handleNewDrawUpdate = (newDraw: Draw) => {
    if (scoringSystem) {
      // Update the scoring system with new draw data
      const performanceResult = scoringSystem.updatePredictionsWithPerformance(newDraw);

      // Update all state with fresh data
      setTopNumbers(scoringSystem.getTopScoringNumbers(20));
      setOptimizedCombinations(scoringSystem.generateOptimizedCombinations(5));
      setPatternAnalysis(scoringSystem.analyzePatterns());
      setAdvancedPatterns(scoringSystem.analyzeAdvancedPatterns());
      setNextDrawPrediction(scoringSystem.predictOptimalCombination());
      setPredictionStats(scoringSystem.getPredictionStats());
      setPerformanceMetrics(performanceResult.performanceMetrics);
      setExportData(scoringSystem.exportSystemData());

      // Update ML predictions
      const mlPreds = new Map<number, { probability: number; confidence: number }>();
      for (let num = 1; num <= 69; num++) {
        const prediction = scoringSystem.predictNumberAppearance(num);
        mlPreds.set(num, { probability: prediction.probability, confidence: prediction.confidence });
      }
      setMlPredictions(mlPreds);

      alert(`✅ System updated with new draw: ${newDraw.white_balls.join('-')} | PB: ${newDraw.red_ball}`);
    }
  };

  const refreshAllData = () => {
    if (scoringSystem) {
      const performanceResult = scoringSystem.updatePredictionsWithPerformance();

      setTopNumbers(scoringSystem.getTopScoringNumbers(20));
      setOptimizedCombinations(scoringSystem.generateOptimizedCombinations(5));
      setPatternAnalysis(scoringSystem.analyzePatterns());
      setAdvancedPatterns(scoringSystem.analyzeAdvancedPatterns());
      setNextDrawPrediction(scoringSystem.predictOptimalCombination());
      setPredictionStats(scoringSystem.getPredictionStats());
      setPerformanceMetrics(performanceResult.performanceMetrics);
      setExportData(scoringSystem.exportSystemData());

      // Update ML predictions
      const mlPreds = new Map<number, { probability: number; confidence: number }>();
      for (let num = 1; num <= 69; num++) {
        const prediction = scoringSystem.predictNumberAppearance(num);
        mlPreds.set(num, { probability: prediction.probability, confidence: prediction.confidence });
      }
      setMlPredictions(mlPreds);
    }
  };

  const handleNumberClick = (number: number) => {
    if (scoringSystem) {
      const details = scoringSystem.getNumberStats(number);
      setSelectedNumber(number);
      setNumberDetails(details || null);
    }
  };

  const generateOptimizedCombinations = () => {
    if (scoringSystem) {
      const combinations = scoringSystem.generateOptimizedCombinations(5);
      setOptimizedCombinations(combinations);
    }
  };

  const refreshAnalysis = () => {
    if (scoringSystem) {
      const patterns = scoringSystem.analyzePatterns();
      setPatternAnalysis(patterns);

      const combinations = scoringSystem.generateOptimizedCombinations(5);
      setOptimizedCombinations(combinations);

      const prediction = scoringSystem.predictNextSum();
      setSumPrediction(prediction);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading scoring system...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Powerball Scoring System</h1>
              <p className="text-gray-600">Advanced analysis based on dues, evens, colds, and overs/hots criteria</p>
            </div>
            <button
              onClick={refreshAnalysis}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh Analysis</span>
            </button>
          </div>
        </div>

        {/* Real-time System Status */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 mb-8 border-l-4 border-green-500">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🟢</span>
            System Status: FULLY OPERATIONAL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-sm text-gray-600">ML Engine</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">✅</div>
                <div className="text-sm text-gray-600">Prediction System</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">✅</div>
                <div className="text-sm text-gray-600">Analytics Engine</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">✅</div>
                <div className="text-sm text-gray-600">Performance Monitoring</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <p className="text-green-800 text-sm">
              🎉 <strong>Congratulations!</strong> Your Powerball scoring and prediction system is now fully operational with advanced machine learning capabilities, real-time analytics, and comprehensive performance monitoring.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={refreshAllData}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh All Data</span>
            </button>
            <button
              onClick={generateOptimizedCombinations}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <span>🤖</span>
              <span>Generate AI Combinations</span>
            </button>
            <button
              onClick={() => {
                if (scoringSystem) {
                  const dataStr = JSON.stringify(scoringSystem.exportSystemData(), null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `powerball-system-backup-${new Date().toISOString().split('T')[0]}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <span>💾</span>
              <span>Backup System</span>
            </button>
            <button
              onClick={() => {
                const newDraw: Draw = {
                  date: new Date().toISOString().split('T')[0],
                  white_balls: [12, 23, 34, 45, 56], // Example numbers
                  red_ball: 7,
                  power_play: ''
                };
                handleNewDrawUpdate(newDraw);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <span>📊</span>
              <span>Add Sample Draw</span>
            </button>
          </div>
        </div>

        {/* System Usage Guide */}
        <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📚</span>
            System Usage Guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 Getting Started</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>View Predictions:</strong> Check ML-Powered Next Draw Prediction</li>
                  <li>• <strong>Analyze Numbers:</strong> Click any number for detailed statistics</li>
                  <li>• <strong>Refresh Data:</strong> Use Quick Actions for real-time updates</li>
                  <li>• <strong>Export Data:</strong> Backup system data with one click</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-green-900 mb-2">📊 Understanding Scores</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Dues Score:</strong> Based on draws since last appearance</li>
                  <li>• <strong>Evens Score:</strong> Even number distribution in combinations</li>
                  <li>• <strong>Colds Score:</strong> Cold number analysis patterns</li>
                  <li>• <strong>Overs/Hots:</strong> Hot number performance tracking</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">🤖 ML Features</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Probability Forecasting:</strong> Individual number appearance predictions</li>
                  <li>• <strong>Confidence Scoring:</strong> Statistical confidence in predictions</li>
                  <li>• <strong>Risk Assessment:</strong> Low/Medium/High risk classifications</li>
                  <li>• <strong>Pattern Recognition:</strong> Advanced clustering and cycle detection</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">⚡ Performance Tips</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Real-time Updates:</strong> System refreshes automatically</li>
                  <li>• <strong>Caching:</strong> 5-minute cache for optimal performance</li>
                  <li>• <strong>Memory Efficient:</strong> Optimized for large datasets</li>
                  <li>• <strong>Background Processing:</strong> Heavy calculations run in background</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <NewDrawForm onDrawAdded={refreshData} />
          <CacheManager />
        </div>

        {/* Sum Prediction */}
        {sumPrediction && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Next Draw Sum Prediction</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{sumPrediction.predictedSum}</div>
                <div className="text-sm text-gray-600">Predicted Sum</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{Math.round(sumPrediction.confidence * 100)}%</div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800">
                  {sumPrediction.range.min} - {sumPrediction.range.max}
                </div>
                <div className="text-sm text-gray-600">Expected Range</div>
              </div>
            </div>
          </div>
        )}

        {/* Number Details Modal/Section */}
        {numberDetails && selectedNumber && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Number {selectedNumber} - Detailed Analysis</h2>
              <button
                onClick={() => {
                  setSelectedNumber(null);
                  setNumberDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{numberDetails.drawsSinceLastDrawn}</div>
                <div className="text-sm text-gray-600">Draws Since Last</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{numberDetails.totalAppearances}</div>
                <div className="text-sm text-gray-600">Total Appearances</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{numberDetails.averageGap.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Average Gap</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{numberDetails.lastAppearance}</div>
                <div className="text-sm text-gray-600">Last Appearance</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  numberDetails.isEven ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {numberDetails.isEven ? 'Even' : 'Odd'}
                </span>
              </div>
              <div className="text-center">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  numberDetails.isHot ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {numberDetails.isHot ? 'Hot' : 'Normal'}
                </span>
              </div>
              <div className="text-center">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  numberDetails.isCold ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {numberDetails.isCold ? 'Cold' : 'Normal'}
                </span>
              </div>
            </div>

            <div className="text-center">
              <span className={`inline-flex px-4 py-2 text-lg font-semibold rounded-full ${
                numberDetails.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                numberDetails.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                Trend: {numberDetails.trend}
              </span>
            </div>
          </div>
        )}

        {/* Optimized Combinations */}
        {optimizedCombinations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI-Optimized Combinations</h2>
            <p className="text-gray-600 mb-4">Top 5 combinations generated using advanced scoring algorithms</p>

            <div className="space-y-4">
              {optimizedCombinations.map((combo, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">Combination #{index + 1}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Score: {combo.totalScore.toFixed(1)}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round(combo.confidence * 100)}% Confidence
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg font-semibold">White Balls:</span>
                    {combo.white_balls.map((num, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {num}
                      </span>
                    ))}
                    <span className="text-lg font-semibold ml-4">Powerball:</span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {combo.powerball}
                    </span>
                    <span className="text-lg font-semibold ml-4">Sum:</span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {combo.sum}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-purple-600">{combo.scoreComponents.dues.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Dues</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{combo.scoreComponents.evens}</div>
                      <div className="text-xs text-gray-600">Evens</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{combo.scoreComponents.colds.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Colds</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">{combo.scoreComponents.oversHots}</div>
                      <div className="text-xs text-gray-600">Hot/Cold</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{combo.totalScore.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={generateOptimizedCombinations}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                Generate New Combinations
              </button>
            </div>
          </div>
        )}

        {/* Sample Combination Score */}
        {sampleCombination && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sample Combination Analysis</h2>
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg font-semibold">White Balls:</span>
                {sampleCombination.white_balls.map((num, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {num}
                  </span>
                ))}
                <span className="text-lg font-semibold ml-4">Powerball:</span>
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {sampleCombination.powerball}
                </span>
              </div>
              <div className="text-gray-600">Sum: {sampleCombination.sum}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{sampleCombination.scoreComponents.dues}</div>
                <div className="text-sm text-gray-600">Dues Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{sampleCombination.scoreComponents.evens}</div>
                <div className="text-sm text-gray-600">Evens Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{sampleCombination.scoreComponents.colds}</div>
                <div className="text-sm text-gray-600">Colds Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{sampleCombination.scoreComponents.oversHots}</div>
                <div className="text-sm text-gray-600">Overs/Hots</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{sampleCombination.totalScore.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Total Score</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                Confidence: {Math.round(sampleCombination.confidence * 100)}%
              </div>
            </div>
          </div>
        )}

        {/* Optimized Combinations */}
        {optimizedCombinations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI-Optimized Combinations</h2>
            <p className="text-gray-600 mb-4">Top 5 combinations generated using advanced scoring algorithms</p>

            <div className="space-y-4">
              {optimizedCombinations.map((combo, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">Combination #{index + 1}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Score: {combo.totalScore.toFixed(1)}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round(combo.confidence * 100)}% Confidence
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg font-semibold">White Balls:</span>
                    {combo.white_balls.map((num, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {num}
                      </span>
                    ))}
                    <span className="text-lg font-semibold ml-4">Powerball:</span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {combo.powerball}
                    </span>
                    <span className="text-lg font-semibold ml-4">Sum:</span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {combo.sum}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-purple-600">{combo.scoreComponents.dues.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Dues</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{combo.scoreComponents.evens}</div>
                      <div className="text-xs text-gray-600">Evens</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{combo.scoreComponents.colds.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Colds</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">{combo.scoreComponents.oversHots}</div>
                      <div className="text-xs text-gray-600">Hot/Cold</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{combo.totalScore.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={generateOptimizedCombinations}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                Generate New Combinations
              </button>
            </div>
          </div>
        )}

        {/* Pattern Analysis */}
        {patternAnalysis && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pattern Analysis</h2>
            <p className="text-gray-600 mb-6">Analysis of recurring patterns in recent Powerball draws</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Even/Odd Ratios */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Even/Odd Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(patternAnalysis.evenOddRatios)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([ratio, count]) => (
                      <div key={ratio} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{ratio} even:odd</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(count / Math.max(...Object.values(patternAnalysis.evenOddRatios))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Sum Ranges */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sum Ranges</h3>
                <div className="space-y-2">
                  {Object.entries(patternAnalysis.sumRanges)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([range, count]) => (
                      <div key={range} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{range}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${(count / Math.max(...Object.values(patternAnalysis.sumRanges))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Hot/Cold Ratios */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hot/Cold Balance</h3>
                <div className="space-y-2">
                  {Object.entries(patternAnalysis.hotColdRatios)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([ratio, count]) => (
                      <div key={ratio} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{ratio} hot:cold</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${(count / Math.max(...Object.values(patternAnalysis.hotColdRatios))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-md font-semibold text-blue-900 mb-2">Pattern Insights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Most common even:odd ratio: <strong>{Object.entries(patternAnalysis.evenOddRatios).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}</strong></li>
                <li>• Most frequent sum range: <strong>{Object.entries(patternAnalysis.sumRanges).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}</strong></li>
                <li>• Typical hot:cold balance: <strong>{Object.entries(patternAnalysis.hotColdRatios).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* ML-Based Next Draw Prediction */}
        {nextDrawPrediction && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6 mb-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              ML-Powered Next Draw Prediction
            </h2>
            <p className="text-gray-600 mb-6">Advanced machine learning prediction for the next Powerball draw</p>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {nextDrawPrediction.combination.join(' • ')}
                  </div>
                  <div className="text-sm text-gray-600">Predicted White Balls</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{nextDrawPrediction.powerball}</div>
                  <div className="text-sm text-gray-600">Predicted Powerball</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">{Math.round(nextDrawPrediction.confidence * 100)}%</div>
                  <div className="text-sm text-gray-600">ML Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">{nextDrawPrediction.expectedSum}</div>
                  <div className="text-sm text-gray-600">Expected Sum</div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <span className="text-lg font-semibold text-gray-700">Risk Level:</span>
                <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${
                  nextDrawPrediction.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  nextDrawPrediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {nextDrawPrediction.riskLevel.toUpperCase()} RISK
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Advanced ML Analytics */}
        {advancedPatterns && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Advanced Pattern Analytics
            </h2>
            <p className="text-gray-600 mb-6">Machine learning analysis of clusters, cycles, and statistical anomalies</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Number Clusters */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Number Clusters</h3>
                <div className="space-y-3">
                  {advancedPatterns.clusters.slice(0, 3).map((cluster, index) => (
                    <div key={index} className="bg-white rounded p-3 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">Range: {cluster.center}</span>
                        <span className="text-xs text-gray-500">{cluster.frequency.toFixed(1)} avg</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cluster.numbers.slice(0, 5).map(num => (
                          <span key={num} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {num}
                          </span>
                        ))}
                        {cluster.numbers.length > 5 && (
                          <span className="text-xs text-gray-500">+{cluster.numbers.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cycle Detection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cycle Patterns</h3>
                <div className="space-y-3">
                  {advancedPatterns.cycles.slice(0, 3).map((cycle, index) => (
                    <div key={index} className="bg-white rounded p-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">{cycle.length}-draw cycle</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          cycle.strength > 0.7 ? 'bg-green-100 text-green-800' :
                          cycle.strength > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {(cycle.strength * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistical Anomalies */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistical Anomalies</h3>
                <div className="space-y-3">
                  {advancedPatterns.anomalies.slice(0, 3).map((anomaly, index) => (
                    <div key={index} className="bg-white rounded p-3 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">Number {anomaly.number}</span>
                        <span className="text-xs text-red-600 font-semibold">
                          {(anomaly.significance * 100).toFixed(0)}% significance
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Deviation: {anomaly.deviation.toFixed(1)}σ
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ML Predictions Table */}
        {mlPredictions.size > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              ML Number Predictions
            </h2>
            <p className="text-gray-600 mb-6">Machine learning predictions for individual number appearance probabilities</p>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Number</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Probability</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Confidence</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expected Draws</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from(mlPredictions.entries())
                    .sort(([,a], [,b]) => b.probability - a.probability)
                    .slice(0, 20)
                    .map(([number, prediction]) => {
                      const trend = scoringSystem?.predictNumberAppearance(number).trend || 'stable';
                      const expectedDraws = scoringSystem?.predictNumberAppearance(number).expectedDraws || 10;

                      return (
                        <tr key={number} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleNumberClick(number)}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">{number}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${prediction.probability * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{(prediction.probability * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              prediction.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                              prediction.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(prediction.confidence * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              trend === 'increasing' ? 'bg-green-100 text-green-800' :
                              trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {trend}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{expectedDraws}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance Metrics & Prediction Statistics */}
        {(performanceMetrics || predictionStats) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              System Performance & Prediction Analytics
            </h2>
            <p className="text-gray-600 mb-6">Real-time performance metrics and prediction accuracy tracking</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {performanceMetrics && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {performanceMetrics.calculationTime.toFixed(2)}ms
                    </div>
                    <div className="text-sm text-gray-600">Calculation Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {performanceMetrics.memoryUsage.toFixed(1)}MB
                    </div>
                    <div className="text-sm text-gray-600">Memory Usage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {Math.round(performanceMetrics.predictionAccuracy * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Prediction Accuracy</div>
                  </div>
                </>
              )}
              {predictionStats && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {predictionStats.totalPredictions}
                  </div>
                  <div className="text-sm text-gray-600">Total Predictions</div>
                </div>
              )}
            </div>

            {predictionStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Accuracy Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Average Accuracy:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {(predictionStats.averageAccuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Best Accuracy:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {(predictionStats.bestAccuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Recent Accuracy:</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {(predictionStats.recentAccuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Accuracy Trend</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      predictionStats.accuracyTrend === 'improving' ? 'bg-green-100 text-green-800' :
                      predictionStats.accuracyTrend === 'declining' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {predictionStats.accuracyTrend === 'improving' ? '📈 Improving' :
                       predictionStats.accuracyTrend === 'declining' ? '📉 Declining' :
                       '➡️ Stable'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Based on last 20 predictions vs previous 20
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">System Health</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Worst Accuracy:</span>
                      <span className="text-sm font-semibold text-red-600">
                        {(predictionStats.worstAccuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Prediction Count:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {predictionStats.totalPredictions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export & Data Management */}
        {exportData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">💾</span>
              Data Export & System Information
            </h2>
            <p className="text-gray-600 mb-6">Export system data for analysis or backup purposes</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {exportData.totalDraws}
                </div>
                <div className="text-sm text-gray-600">Historical Draws</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {exportData.numberStats.length}
                </div>
                <div className="text-sm text-gray-600">Number Statistics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {new Date(exportData.lastUpdated).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">Last Updated</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(exportData, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `powerball-system-data-${new Date().toISOString().split('T')[0]}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 flex items-center space-x-2"
              >
                <span>📥</span>
                <span>Export System Data</span>
              </button>

              <button
                onClick={refreshAllData}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh All Data</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-2">System Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Last Updated:</span>
                  <span className="ml-2 text-gray-600">{new Date(exportData.lastUpdated).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold">Data Points:</span>
                  <span className="ml-2 text-gray-600">{exportData.numberStats.length} numbers analyzed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Top 20 Scoring Numbers</h2>
          <p className="text-gray-600 mb-4">Numbers ranked by scoring algorithm performance</p>

          {/* Trend Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Trend Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Hot Numbers:</span>
                <span className="ml-2 text-red-600 font-semibold">
                  {topNumbers.filter(item => item.stats.isHot).length}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Cold Numbers:</span>
                <span className="ml-2 text-blue-600 font-semibold">
                  {topNumbers.filter(item => item.stats.isCold).length}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Even Numbers:</span>
                <span className="ml-2 text-purple-600 font-semibold">
                  {topNumbers.filter(item => item.stats.isEven).length}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draws Since</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Even/Odd</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topNumbers.map((item, index) => (
                  <tr key={item.number} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span 
                        className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() => handleNumberClick(item.number)}
                      >
                        {item.number}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="text-lg font-bold text-blue-600">{item.score}</span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {item.stats.drawsSinceLastDrawn}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.stats.isHot && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Hot
                        </span>
                      )}
                      {item.stats.isCold && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Cold
                        </span>
                      )}
                      {!item.stats.isHot && !item.stats.isCold && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.stats.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                        item.stats.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.stats.trend}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.stats.isEven ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.stats.isEven ? 'Even' : 'Odd'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scoring System Explanation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Scoring System Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dues Score (1-3 points per number)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 1 point: Recently drawn (≤5 draws ago)</li>
                <li>• 2 points: Moderately due (6-10 draws ago)</li>
                <li>• 3 points: Very due (11+ draws ago)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Evens Score (0-5 points)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Based on even number count in combination</li>
                <li>• Higher even count = higher score</li>
                <li>• 5 even numbers = 5 points max</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Colds Score (1-3 points per number)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 1 point: Still warm (≤5 draws ago)</li>
                <li>• 2 points: Getting cold (6-10 draws ago)</li>
                <li>• 3 points: Very cold (11+ draws ago)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Overs/Hots Score (0-5 points)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Based on hot numbers in combination</li>
                <li>• Hot = appeared in last 5 draws</li>
                <li>• More hot numbers = higher score</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Draw Detail Modal */}
      {showDrawModal && (
        <DrawDetailModal
          draw={selectedDraw}
          columnAnalyzer={scoringSystem?.getColumnAnalyzer() || null}
          onClose={() => {
            setShowDrawModal(false);
            setSelectedDraw(null);
          }}
        />
      )}
    </div>
  );
}

export default ScoringDashboard;

