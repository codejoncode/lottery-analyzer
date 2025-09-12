import React, { useState, useEffect } from 'react';
import { BacktestEngine } from '../backtesting/BacktestEngine';
import { AccuracyTracker } from '../backtesting/AccuracyTracker';
import { ValidationMetrics } from '../backtesting/ValidationMetrics';
import type { Draw } from '../utils/scoringSystem';
import type { BacktestResult } from '../prediction-engine/types';

interface BacktestResultsProps {
  draws: Draw[];
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ draws }) => {
  const [backtestEngine] = useState(() => new BacktestEngine(draws));
  const [accuracyTracker] = useState(() => new AccuracyTracker());
  const [validationMetrics] = useState(() => new ValidationMetrics());

  const [results, setResults] = useState<BacktestResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [testDraws, setTestDraws] = useState(50);
  const [maxPredictions, setMaxPredictions] = useState(100);

  useEffect(() => {
    if (draws.length > 0) {
      runBacktest();
    }
  }, [draws]);

  const runBacktest = async () => {
    if (draws.length < testDraws + 10) {
      alert('Not enough historical draws for backtesting');
      return;
    }

    setLoading(true);
    try {
      console.log(`🔬 Running comprehensive backtest on ${testDraws} draws...`);

      const backtestResults = await backtestEngine.backtestMultipleDraws({
        startDraw: Math.max(0, draws.length - testDraws),
        endDraw: draws.length - 1,
        maxPredictions,
        onProgress: (completed, total) => {
          console.log(`Progress: ${completed}/${total}`);
        }
      });

      setResults(backtestResults);

      // Calculate statistics
      accuracyTracker.addResults(backtestResults);
      const statistics = backtestEngine.getBacktestStatistics(backtestResults);
      setStats(statistics);

      // Run validation
      validationMetrics.setResults(backtestResults);
      const validationResults = validationMetrics.performSignificanceTests();
      setValidation(validationResults);

      console.log('✅ Backtest analysis complete');

    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (results.length === 0) return;

    const csv = backtestEngine.exportResultsToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 0.15) return 'text-green-600 bg-green-100';
    if (accuracy >= 0.10) return 'text-yellow-600 bg-yellow-100';
    if (accuracy >= 0.05) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSignificanceColor = (pValue: number): string => {
    if (pValue < 0.01) return 'text-green-600 bg-green-100';
    if (pValue < 0.05) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🧪 Backtesting Analysis</h2>
        <div className="flex space-x-3">
          <button
            onClick={runBacktest}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Running...' : '🔬 Run Backtest'}
          </button>
          <button
            onClick={exportResults}
            disabled={results.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium mb-3">⚙️ Test Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Test Draws: {testDraws}
            </label>
            <input
              type="range"
              min="10"
              max="200"
              value={testDraws}
              onChange={(e) => setTestDraws(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Max Predictions: {maxPredictions}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={maxPredictions}
              onChange={(e) => setMaxPredictions(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-md">
              <div className="text-3xl font-bold text-blue-600">{stats.totalDraws}</div>
              <div className="text-sm text-blue-800">Draws Tested</div>
            </div>
            <div className={`text-center p-4 rounded-md ${getAccuracyColor(stats.averageAccuracy)}`}>
              <div className="text-3xl font-bold">{(stats.averageAccuracy * 100).toFixed(1)}%</div>
              <div className="text-sm">Average Accuracy</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-md">
              <div className="text-3xl font-bold text-green-600">{stats.averageScore.toFixed(1)}</div>
              <div className="text-sm text-green-800">Average Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-md">
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalHits['3-match'] + stats.totalHits['4-match'] + stats.totalHits['5-match']}
              </div>
              <div className="text-sm text-purple-800">Major Hits (3+)</div>
            </div>
          </div>

          {/* Hit Distribution */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">🎯 Hit Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(stats.totalHits).map(([matchType, count]) => (
                <div key={matchType} className="text-center p-3 bg-gray-50 rounded-md">
                  <div className="text-2xl font-bold text-gray-900">{count as number}</div>
                  <div className="text-sm text-gray-600">{matchType}</div>
                  <div className="text-xs text-gray-500">
                    {((count as number / (stats.totalDraws * maxPredictions)) * 100).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistical Significance */}
          {validation && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">📊 Statistical Significance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-md ${getSignificanceColor(validation.accuracySignificance.pValue)}`}>
                  <div className="text-lg font-bold">
                    p = {validation.accuracySignificance.pValue.toFixed(4)}
                  </div>
                  <div className="text-sm">Accuracy Significance</div>
                  <div className="text-xs mt-1">
                    Effect Size: {validation.accuracySignificance.effectSize.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="text-lg font-bold">
                    {validation.temporalStability.volatility.toFixed(4)}
                  </div>
                  <div className="text-sm">Prediction Volatility</div>
                  <div className="text-xs mt-1">
                    Autocorrelation: {validation.temporalStability.autocorrelation.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Analysis */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">⚡ Performance Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-md">
                <div className="text-xl font-bold text-green-600">
                  {(stats.averageProcessingTime).toFixed(0)}ms
                </div>
                <div className="text-sm text-green-800">Avg Processing Time</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-md">
                <div className="text-xl font-bold text-blue-600">
                  {stats.bestDraw ? (stats.bestDraw.accuracy * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-blue-800">Best Draw Accuracy</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-md">
                <div className="text-xl font-bold text-red-600">
                  {stats.worstDraw ? (stats.worstDraw.accuracy * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-red-800">Worst Draw Accuracy</div>
              </div>
            </div>
          </div>

          {/* Recent Results Table */}
          <div>
            <h3 className="text-lg font-medium mb-3">📋 Recent Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Draw</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hits</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.slice(-10).reverse().map((result, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">#{result.drawId}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{result.drawDate}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${getAccuracyColor(result.accuracy)}`}>
                          {(result.accuracy * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {Object.values(result.hits).reduce((a: number, b: number) => a + b, 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{result.topScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running comprehensive backtest analysis...</p>
        </div>
      )}
    </div>
  );
};

export default BacktestResults;
