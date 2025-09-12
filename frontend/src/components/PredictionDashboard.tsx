import React, { useState, useEffect } from 'react';
import { PredictionEngine } from '../prediction-engine/PredictionEngine';
import { BacktestEngine } from '../backtesting/BacktestEngine';
import { CacheManager } from '../caching/CacheManager';
import type { Draw } from '../utils/scoringSystem';
import type { PredictionResult } from '../prediction-engine/types';

interface FilterOption {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

const PredictionDashboard: React.FC = () => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [predictionEngine, setPredictionEngine] = useState<PredictionEngine | null>(null);
  const [backtestEngine, setBacktestEngine] = useState<BacktestEngine | null>(null);
  const [cacheManager, setCacheManager] = useState<CacheManager | null>(null);

  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [backtesting, setBacktesting] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOption[]>([
    { id: 'sum-filter', name: 'Sum Range', enabled: true, description: 'Filter by total sum (120-180)' },
    { id: 'parity-filter', name: 'Odd/Even Balance', enabled: true, description: 'Balance odd/even numbers (2-4 odds)' },
    { id: 'skip-filter', name: 'Skip Count', enabled: false, description: 'Filter by skip counts (0-3 skips)' },
    { id: 'digit-filter', name: 'First Digit', enabled: false, description: 'Filter by first digit pattern' },
    { id: 'high-low-filter', name: 'High/Low Split', enabled: false, description: 'Balance high/low numbers' }
  ]);

  // Prediction options
  const [maxCombinations, setMaxCombinations] = useState(50);
  const [minScore, setMinScore] = useState(0);

  // Backtesting options
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [backtestDraws, setBacktestDraws] = useState(20);

  // Cache stats
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    try {
      // Load historical draws
      const { parseCSV } = await import('../utils/dataLoader');
      const loadedDraws = await parseCSV();
      setDraws(loadedDraws);

      // Initialize engines
      const engine = new PredictionEngine(loadedDraws);
      const backtest = new BacktestEngine(loadedDraws);
      const cache = new CacheManager();

      setPredictionEngine(engine);
      setBacktestEngine(backtest);
      setCacheManager(cache);

      // Load cache stats
      setCacheStats(cache.getStats());

      console.log(`✅ System initialized with ${loadedDraws.length} historical draws`);
    } catch (error) {
      console.error('Failed to initialize system:', error);
    }
  };

  const handleFilterToggle = (filterId: string) => {
    setFilters(prev => prev.map(filter =>
      filter.id === filterId
        ? { ...filter, enabled: !filter.enabled }
        : filter
    ));
  };

  const generatePredictions = async () => {
    if (!predictionEngine) return;

    setLoading(true);
    try {
      const enabledFilters = filters.filter(f => f.enabled).map(f => f.id);

      // Check cache first
      const cacheKey = { enabledFilters, maxCombinations, minScore };
      let result = cacheManager?.getPrediction(cacheKey);

      if (!result) {
        console.log('🔄 Generating new predictions...');
        result = await predictionEngine.generatePredictions({
          enabledFilters,
          maxCombinations,
          minScore
        });

        // Cache the result
        cacheManager?.setPrediction(cacheKey, result);
      } else {
        console.log('✅ Using cached predictions');
      }

      setPredictions(result);

      // Update cache stats
      setCacheStats(cacheManager?.getStats());

    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBacktest = async () => {
    if (!backtestEngine || !draws.length) return;

    setBacktesting(true);
    try {
      const enabledFilters = filters.filter(f => f.enabled).map(f => f.id);

      console.log(`🔬 Running backtest on last ${backtestDraws} draws...`);

      const results = await backtestEngine.backtestMultipleDraws({
        startDraw: Math.max(0, draws.length - backtestDraws),
        endDraw: draws.length - 1,
        maxPredictions: maxCombinations,
        enabledFilters,
        minScore,
        onProgress: (completed, total) => {
          console.log(`Backtest progress: ${completed}/${total}`);
        }
      });

      const stats = backtestEngine.getBacktestStatistics(results);
      setBacktestResults(stats);

      console.log('✅ Backtest completed');

    } catch (error) {
      console.error('Error running backtest:', error);
    } finally {
      setBacktesting(false);
    }
  };

  const clearCache = () => {
    cacheManager?.clearAll();
    setCacheStats(cacheManager?.getStats());
    console.log('🗑️ Cache cleared');
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 ApexScoop Prediction Dashboard
          </h1>
          <p className="text-gray-600">
            Advanced lottery prediction system with backtesting and caching
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🎛️ Prediction Controls</h2>

              {/* Filters */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Filters</h3>
                <div className="space-y-2">
                  {filters.map(filter => (
                    <label key={filter.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filter.enabled}
                        onChange={() => handleFilterToggle(filter.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium">{filter.name}</span>
                        <p className="text-xs text-gray-500">{filter.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prediction Options */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Options</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Max Combinations: {maxCombinations}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={maxCombinations}
                      onChange={(e) => setMaxCombinations(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Min Score: {minScore}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={generatePredictions}
                  disabled={loading || !predictionEngine}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '🔄 Generating...' : '🎯 Generate Predictions'}
                </button>

                <button
                  onClick={runBacktest}
                  disabled={backtesting || !backtestEngine}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {backtesting ? '🔬 Backtesting...' : '🧪 Run Backtest'}
                </button>

                <button
                  onClick={clearCache}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  🗑️ Clear Cache
                </button>
              </div>

              {/* Cache Stats */}
              {cacheStats && (
                <div className="mt-6 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium mb-2">💾 Cache Status</h4>
                  <div className="text-xs space-y-1">
                    <div>Predictions: {cacheStats.predictionCache.size}/{cacheStats.predictionCache.maxSize}</div>
                    <div>Results: {cacheStats.resultCache.size}/{cacheStats.resultCache.maxSize}</div>
                    <div>Memory: {(cacheStats.resultCache.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
                    <div>Hit Rate: {(cacheStats.overall.hitRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {/* Predictions */}
            {predictions && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">🎯 Top Predictions</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <div className="text-2xl font-bold text-blue-600">{predictions.combinations.length}</div>
                    <div className="text-sm text-blue-800">Predictions Generated</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <div className="text-2xl font-bold text-green-600">
                      {(predictions.metadata.averageSum).toFixed(0)}
                    </div>
                    <div className="text-sm text-green-800">Average Sum</div>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {predictions.combinations.slice(0, 10).map((combo, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                        <span className="font-mono text-lg">
                          {combo.numbers.join(' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(combo.compositeScore)}`}>
                          {combo.compositeScore.toFixed(0)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(combo.confidence)}`}>
                          {(combo.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Backtest Results */}
            {backtestResults && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">🧪 Backtest Results</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <div className="text-2xl font-bold text-blue-600">{backtestResults.totalDraws}</div>
                    <div className="text-sm text-blue-800">Draws Tested</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <div className="text-2xl font-bold text-green-600">
                      {(backtestResults.averageAccuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-800">Avg Accuracy</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-md">
                    <div className="text-2xl font-bold text-yellow-600">
                      {(backtestResults.averageScore).toFixed(1)}
                    </div>
                    <div className="text-sm text-yellow-800">Avg Score</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-md">
                    <div className="text-2xl font-bold text-purple-600">
                      {backtestResults.totalHits['3-match'] + backtestResults.totalHits['4-match'] + backtestResults.totalHits['5-match']}
                    </div>
                    <div className="text-sm text-purple-800">Major Hits</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(backtestResults.totalHits).map(([matchType, count]) => (
                    <div key={matchType} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold">{count as number}</div>
                      <div className="text-xs text-gray-600">{matchType}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading States */}
            {loading && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating predictions...</p>
              </div>
            )}

            {backtesting && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Running backtest analysis...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionDashboard;
