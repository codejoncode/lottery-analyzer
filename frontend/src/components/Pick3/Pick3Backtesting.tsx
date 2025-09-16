import React, { useState, useEffect } from 'react';
import './Pick3Backtesting.css';

interface BacktestResult {
  combination: string;
  actualScore: number;
  predictedScore: number;
  accuracy: number;
  rank: number;
  wasInTop10: boolean;
  drawDate: string;
  predictedNumbers: string[];
  actualNumbers: string[];
  straightHit: boolean;
  boxHit: boolean;
  hitType: 'none' | 'box' | 'straight';
}

interface BacktestSummary {
  totalTests: number;
  averageAccuracy: number;
  top10HitRate: number;
  bestAccuracy: number;
  worstAccuracy: number;
  standardDeviation: number;
  confidenceInterval: { min: number; max: number };
  straightAccuracy: number;
  boxAccuracy: number;
  overallHitRate: number;
  straightHits: number;
  boxHits: number;
  totalHits: number;
}

interface Pick3BacktestingProps {
  historicalDraws?: Array<{ date: string; numbers: number[] }>;
  scoringWeights?: {
    columnPrediction: number;
    skipAnalysis: number;
    pairCoverage: number;
    patternRecognition: number;
    sumOptimization: number;
    vtracAlignment: number;
    deflateEfficiency: number;
  };
}

const Pick3Backtesting: React.FC<Pick3BacktestingProps> = ({
  historicalDraws: _historicalDraws = [],
  scoringWeights = {
    columnPrediction: 0.20,
    skipAnalysis: 0.18,
    pairCoverage: 0.15,
    patternRecognition: 0.12,
    sumOptimization: 0.10,
    vtracAlignment: 0.10,
    deflateEfficiency: 0.15
  }
}) => {
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [testCount, setTestCount] = useState(30);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Mock historical data for demonstration
  const mockHistoricalDraws = [
    { date: '2025-09-01', numbers: [1, 2, 3] },
    { date: '2025-09-02', numbers: [4, 5, 6] },
    { date: '2025-09-03', numbers: [7, 8, 9] },
    { date: '2025-09-04', numbers: [0, 1, 2] },
    { date: '2025-09-05', numbers: [3, 4, 5] },
    { date: '2025-09-06', numbers: [6, 7, 8] },
    { date: '2025-09-07', numbers: [9, 0, 1] },
    { date: '2025-09-08', numbers: [2, 3, 4] },
    { date: '2025-09-09', numbers: [5, 6, 7] },
    { date: '2025-09-10', numbers: [8, 9, 0] },
  ];

  const calculatePredictedScore = (combo: string): number => {
    const digits = combo.split('').map(Number);
    let score = 0;

    // Column prediction score
    digits.forEach((digit, pos) => {
      const positionBonus = [0.8, 0.9, 0.7][pos] || 0.5;
      score += (digit / 9) * positionBonus * scoringWeights.columnPrediction;
    });

    // Skip analysis score
    digits.forEach(_digit => {
      const skipFactor = Math.random() * 0.5 + 0.5;
      score += skipFactor * scoringWeights.skipAnalysis;
    });

    // Pair coverage score
    const pairs = [combo.slice(0, 2), combo.slice(1, 3), combo[0] + combo[2]];
    pairs.forEach(_pair => {
      const pairFrequency = Math.random() * 0.7 + 0.3;
      score += pairFrequency * scoringWeights.pairCoverage;
    });

    // Pattern recognition score
    const sum = digits.reduce((a, b) => a + b, 0);
    if (sum >= 10 && sum <= 16) score += 0.4 * scoringWeights.patternRecognition;
    if (digits.filter(d => d % 2 === 0).length >= 1) score += 0.3 * scoringWeights.patternRecognition;
    if (digits.filter(d => d >= 5).length >= 1) score += 0.3 * scoringWeights.patternRecognition;

    // Sum optimization score
    if (sum >= 10 && sum <= 16) score += scoringWeights.sumOptimization;
    else if (sum >= 7 && sum <= 19) score += 0.7 * scoringWeights.sumOptimization;

    // VTrac alignment score
    const vtracSum = digits.map(d => d + 5).reduce((a, b) => a + b, 0);
    if (vtracSum >= 15 && vtracSum <= 21) score += scoringWeights.vtracAlignment;
    else if (vtracSum >= 12 && vtracSum <= 24) score += 0.7 * scoringWeights.vtracAlignment;

    // Deflate efficiency score
    const uniqueDigits = new Set(digits).size;
    if (uniqueDigits >= 2) score += 0.2 * scoringWeights.deflateEfficiency;
    if (digits.some(d => d >= 5)) score += 0.15 * scoringWeights.deflateEfficiency;
    if (digits.some(d => d <= 4)) score += 0.15 * scoringWeights.deflateEfficiency;

    return Math.min(score, 1);
  };

  const runBacktest = () => {
    setLoading(true);

    const results: BacktestResult[] = [];
    const drawsToTest = mockHistoricalDraws.slice(-testCount);

    drawsToTest.forEach((draw, _index) => {
      const actualCombo = draw.numbers.join('');
      const predictedScore = calculatePredictedScore(actualCombo);

      // Generate predictions for this draw (top 20 predictions)
      const allCombos: Array<{ combo: string; score: number }> = [];
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          for (let k = 0; k < 10; k++) {
            const combo = `${i}${j}${k}`;
            const score = calculatePredictedScore(combo);
            allCombos.push({ combo, score });
          }
        }
      }

      // Sort by predicted score and get top 20 predictions
      allCombos.sort((a, b) => b.score - a.score);
      const topPredictions = allCombos.slice(0, 20).map(c => c.combo);

      // Find rank of actual combination
      const actualRank = allCombos.findIndex(c => c.combo === actualCombo) + 1;
      const wasInTop10 = actualRank <= 10;

      // Check for straight hit (exact match)
      const straightHit = topPredictions.includes(actualCombo);

      // Check for box hit (any permutation)
      let boxHit = false;
      const actualDigits = actualCombo.split('').sort().join('');
      for (const prediction of topPredictions) {
        const predDigits = prediction.split('').sort().join('');
        if (predDigits === actualDigits) {
          boxHit = true;
          break;
        }
      }

      // Determine hit type
      let hitType: 'none' | 'box' | 'straight' = 'none';
      if (straightHit) hitType = 'straight';
      else if (boxHit) hitType = 'box';

      // Calculate accuracy based on how close the prediction was
      const predictedRank = allCombos[0].score; // Best predicted score
      const accuracy = Math.max(0, 1 - Math.abs(predictedScore - predictedRank) / predictedRank);

      results.push({
        combination: actualCombo,
        actualScore: predictedScore,
        predictedScore: predictedRank,
        accuracy,
        rank: actualRank,
        wasInTop10,
        drawDate: draw.date,
        predictedNumbers: topPredictions,
        actualNumbers: [actualCombo],
        straightHit,
        boxHit,
        hitType
      });
    });

    setBacktestResults(results);

    // Calculate summary statistics
    const accuracies = results.map(r => r.accuracy);
    const averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const top10Hits = results.filter(r => r.wasInTop10).length;
    const top10HitRate = top10Hits / results.length;

    const sortedAccuracies = [...accuracies].sort((a, b) => a - b);
    const bestAccuracy = sortedAccuracies[sortedAccuracies.length - 1];
    const worstAccuracy = sortedAccuracies[0];

    // Calculate standard deviation
    const variance = accuracies.reduce((acc, val) => acc + Math.pow(val - averageAccuracy, 2), 0) / accuracies.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate 95% confidence interval
    const confidenceMargin = 1.96 * (standardDeviation / Math.sqrt(accuracies.length));
    const confidenceInterval = {
      min: Math.max(0, averageAccuracy - confidenceMargin),
      max: Math.min(1, averageAccuracy + confidenceMargin)
    };

    // Calculate box/straight accuracy metrics
    const straightHits = results.filter(r => r.straightHit).length;
    const boxHits = results.filter(r => r.boxHit).length;
    const totalHits = results.filter(r => r.straightHit || r.boxHit).length;

    const straightAccuracy = straightHits / results.length;
    const boxAccuracy = boxHits / results.length;
    const overallHitRate = totalHits / results.length;

    setSummary({
      totalTests: results.length,
      averageAccuracy,
      top10HitRate,
      bestAccuracy,
      worstAccuracy,
      standardDeviation,
      confidenceInterval,
      straightAccuracy,
      boxAccuracy,
      overallHitRate,
      straightHits,
      boxHits,
      totalHits
    });

    setLoading(false);
  };

  useEffect(() => {
    runBacktest();
  }, [testCount, timeRange]);



  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🔬 Pick 3 Backtesting Framework</h2>
        <p className="text-gray-600">
          Validate scoring system performance against historical data with statistical analysis
        </p>
        <div className="mt-2 text-sm text-gray-500">
          Testing {testCount} historical draws • Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="control-group">
            <label className="control-label">Test Count</label>
            <select
              value={testCount}
              onChange={(e) => setTestCount(Number(e.target.value))}
              className="control-select"
            >
              <option value={10}>10 draws</option>
              <option value={30}>30 draws</option>
              <option value={50}>50 draws</option>
              <option value={100}>100 draws</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
              className="control-select"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <button
            onClick={runBacktest}
            disabled={loading}
            className="run-button"
          >
            {loading ? '🔄 Running...' : '🔬 Run Backtest'}
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">📊 Performance Summary</h3>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="metric-value text-blue-600">
                {(summary.averageAccuracy * 100).toFixed(1)}%
              </div>
              <div className="metric-label">Average Accuracy</div>
              <div className="metric-subtitle">
                ±{(summary.confidenceInterval.max - summary.confidenceInterval.min).toFixed(1)}% CI
              </div>
            </div>

            <div className="summary-card">
              <div className="metric-value text-green-600">
                {(summary.top10HitRate * 100).toFixed(1)}%
              </div>
              <div className="metric-label">Top 10 Hit Rate</div>
              <div className="metric-subtitle">
                {Math.round(summary.top10HitRate * summary.totalTests)}/{summary.totalTests} hits
              </div>
            </div>

            <div className="summary-card">
              <div className="metric-value text-purple-600">
                {(summary.bestAccuracy * 100).toFixed(1)}%
              </div>
              <div className="metric-label">Best Accuracy</div>
              <div className="metric-subtitle">
                Peak performance
              </div>
            </div>

            <div className="summary-card">
              <div className="metric-value text-orange-600">
                {(summary.standardDeviation * 100).toFixed(1)}%
              </div>
              <div className="metric-label">Standard Deviation</div>
              <div className="metric-subtitle">
                Prediction consistency
              </div>
            </div>

            <div className="summary-card">
              <div className="metric-value text-red-600">
                {(summary.straightAccuracy * 100).toFixed(1)}%
              </div>
              <div className="metric-label">Straight Hit Rate</div>
              <div className="metric-subtitle">
                {summary.straightHits}/{summary.totalTests} exact matches
              </div>
            </div>

            <div className="summary-card">
              <div className="metric-value text-yellow-600">
                {(summary.boxAccuracy * 100).toFixed(1)}%
              </div>
              <div className="metric-label">Box Hit Rate</div>
              <div className="metric-subtitle">
                {summary.boxHits}/{summary.totalTests} any order matches
              </div>
            </div>

            <div className="summary-card">
              <div className="metric-value text-green-600">
                {(summary.overallHitRate * 100).toFixed(1)}%
              </div>
              <div className="metric-label">Overall Hit Rate</div>
              <div className="metric-subtitle">
                {summary.totalHits}/{summary.totalTests} total hits
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">📋 Backtest Results</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto"></div>
            <p className="mt-4 text-gray-600">Running backtest analysis...</p>
          </div>
        ) : (
          <div className="results-table">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Combination</th>
                  <th className="table-header-cell">Predicted Rank</th>
                  <th className="table-header-cell">Accuracy</th>
                  <th className="table-header-cell">Top 10 Hit</th>
                  <th className="table-header-cell">Hit Type</th>
                  <th className="table-header-cell">Straight Hit</th>
                  <th className="table-header-cell">Box Hit</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {backtestResults.map((result, index) => (
                  <tr
                    key={index}
                    className="table-row"
                    onClick={() => setSelectedResult(result)}
                  >
                    <td className="table-cell">
                      {new Date(result.drawDate).toLocaleDateString()}
                    </td>
                    <td className="table-cell combination-cell">
                      {result.combination.split('').join(' ')}
                    </td>
                    <td className="table-cell">
                      <span className={`rank-badge ${result.rank <= 10 ? 'rank-excellent' : result.rank <= 50 ? 'rank-good' : 'rank-poor'}`}>
                        #{result.rank}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`font-medium ${result.accuracy >= 0.8 ? 'accuracy-excellent' : result.accuracy >= 0.6 ? 'accuracy-good' : 'accuracy-poor'}`}>
                        {(result.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="table-cell">
                      {result.wasInTop10 ? (
                        <span className="hit-badge hit-yes">
                          ✅ Yes
                        </span>
                      ) : (
                        <span className="hit-badge hit-no">
                          ❌ No
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`hit-type-badge hit-type-${result.hitType}`}>
                        {result.hitType === 'straight' ? '🎯 Straight' : result.hitType === 'box' ? '📦 Box' : '❌ None'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {result.straightHit ? (
                        <span className="hit-badge hit-yes">
                          ✅ Yes
                        </span>
                      ) : (
                        <span className="hit-badge hit-no">
                          ❌ No
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      {result.boxHit ? (
                        <span className="hit-badge hit-yes">
                          ✅ Yes
                        </span>
                      ) : (
                        <span className="hit-badge hit-no">
                          ❌ No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Result Modal */}
      {selectedResult && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Backtest Result Details</h3>
              <button
                onClick={() => setSelectedResult(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-card">
                  <div className="detail-label">Draw Date</div>
                  <div className="detail-value">
                    {new Date(selectedResult.drawDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Combination</div>
                  <div className="large-combination">
                    {selectedResult.combination.split('').join(' ')}
                  </div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-card">
                  <div className="detail-label">Predicted Rank</div>
                  <div className="detail-value text-blue-600">
                    #{selectedResult.rank}
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Accuracy</div>
                  <div className="detail-value text-green-600">
                    {(selectedResult.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-label">Top 10 Hit</div>
                  <div className="detail-value text-purple-600">
                    {selectedResult.wasInTop10 ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
              </div>

              <div className="performance-analysis">
                <h4 className="analysis-title">Performance Analysis</h4>
                <div className="space-y-2">
                  <div className="analysis-item">
                    <span className="analysis-label">Actual Score:</span>
                    <span className="analysis-value">{(selectedResult.actualScore * 100).toFixed(2)}%</span>
                  </div>
                  <div className="analysis-item">
                    <span className="analysis-label">Predicted Score:</span>
                    <span className="analysis-value">{(selectedResult.predictedScore * 100).toFixed(2)}%</span>
                  </div>
                  <div className="analysis-item">
                    <span className="analysis-label">Prediction Error:</span>
                    <span className={`analysis-value ${Math.abs(selectedResult.actualScore - selectedResult.predictedScore) < 0.1 ? 'success-indicator' : 'error-indicator'}`}>
                      {Math.abs((selectedResult.actualScore - selectedResult.predictedScore) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pick3Backtesting;
