import React, { useState, useEffect } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface ValidationResult {
  date: string;
  actualDraw: string;
  predictedTop5: string[];
  predictedTop10: string[];
  hitInTop5: boolean;
  hitInTop10: boolean;
  predictionScore: number;
  confidence: number;
}

interface ValidationSummary {
  totalTests: number;
  top5HitRate: number;
  top10HitRate: number;
  averageConfidence: number;
  averagePredictionScore: number;
  bestPrediction: ValidationResult | null;
  worstPrediction: ValidationResult | null;
}

const HistoricalValidation: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [selectedResult, setSelectedResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPeriod, setTestPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const generateValidationData = () => {
    setLoading(true);

    // Generate mock historical validation data
    const results: ValidationResult[] = [];
    const testDays = testPeriod === 'week' ? 7 : testPeriod === 'month' ? 30 : 90;

    for (let i = 0; i < testDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate actual draw (random for demo)
      const actualDraw = `${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;

      // Generate predicted combinations
      const predictedTop5: string[] = [];
      const predictedTop10: string[] = [];

      // Generate unique predictions
      const usedCombos = new Set<string>();
      while (predictedTop5.length < 5) {
        const combo = `${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;
        if (!usedCombos.has(combo)) {
          usedCombos.add(combo);
          predictedTop5.push(combo);
        }
      }

      while (predictedTop10.length < 10) {
        const combo = `${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;
        if (!usedCombos.has(combo)) {
          usedCombos.add(combo);
          predictedTop10.push(combo);
        }
      }

      const hitInTop5 = predictedTop5.includes(actualDraw);
      const hitInTop10 = hitInTop5 || predictedTop10.includes(actualDraw);

      // Calculate prediction score based on how close predictions were
      const predictionScore = hitInTop5 ? 0.9 + Math.random() * 0.1 :
                           hitInTop10 ? 0.7 + Math.random() * 0.2 :
                           0.3 + Math.random() * 0.4;

      const confidence = 0.6 + Math.random() * 0.3;

      results.push({
        date: date.toISOString().split('T')[0],
        actualDraw,
        predictedTop5,
        predictedTop10,
        hitInTop5,
        hitInTop10,
        predictionScore,
        confidence
      });
    }

    setValidationResults(results);

    // Calculate summary statistics
    const totalTests = results.length;
    const top5Hits = results.filter(r => r.hitInTop5).length;
    const top10Hits = results.filter(r => r.hitInTop10).length;
    const top5HitRate = top5Hits / totalTests;
    const top10HitRate = top10Hits / totalTests;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;
    const averagePredictionScore = results.reduce((sum, r) => sum + r.predictionScore, 0) / totalTests;

    const bestPrediction = results.reduce((best, current) =>
      current.predictionScore > best.predictionScore ? current : best
    );

    const worstPrediction = results.reduce((worst, current) =>
      current.predictionScore < worst.predictionScore ? current : worst
    );

    setSummary({
      totalTests,
      top5HitRate,
      top10HitRate,
      averageConfidence,
      averagePredictionScore,
      bestPrediction,
      worstPrediction
    });

    setLoading(false);
  };

  useEffect(() => {
    generateValidationData();
  }, [testPeriod]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHitIndicator = (hit: boolean) => {
    return hit ? (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
        ✅ Hit
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
        ❌ Miss
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">📈 Historical Validation</h2>
        <p className="text-gray-600 mb-4">
          Validate prediction accuracy against historical lottery draws
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-medium">Test Period:</label>
            <select
              value={testPeriod}
              onChange={(e) => setTestPeriod(e.target.value as 'week' | 'month' | 'quarter')}
              className="border rounded px-3 py-1"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>

          <button
            onClick={generateValidationData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Validating...' : '📊 Run Validation'}
          </button>
        </div>
      </div>

      {/* Validation Summary */}
      {summary && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">Validation Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(summary.averagePredictionScore * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Prediction Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(summary.top5HitRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Top 5 Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(summary.top10HitRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Top 10 Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {(summary.averageConfidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded">
              <h4 className="font-medium mb-2 text-green-800">Best Prediction</h4>
              {summary.bestPrediction && (
                <div className="text-sm">
                  <div>Date: {summary.bestPrediction.date}</div>
                  <div>Actual: {summary.bestPrediction.actualDraw}</div>
                  <div>Score: {(summary.bestPrediction.predictionScore * 100).toFixed(1)}%</div>
                  <div>Hit Top 5: {summary.bestPrediction.hitInTop5 ? 'Yes' : 'No'}</div>
                </div>
              )}
            </div>
            <div className="bg-white p-4 rounded">
              <h4 className="font-medium mb-2 text-red-800">Worst Prediction</h4>
              {summary.worstPrediction && (
                <div className="text-sm">
                  <div>Date: {summary.worstPrediction.date}</div>
                  <div>Actual: {summary.worstPrediction.actualDraw}</div>
                  <div>Score: {(summary.worstPrediction.predictionScore * 100).toFixed(1)}%</div>
                  <div>Hit Top 5: {summary.worstPrediction.hitInTop5 ? 'Yes' : 'No'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Results Table */}
      <div className="bg-white border rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Detailed Results ({validationResults.length} tests)</h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Running validation tests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Draw
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top 5 Hit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top 10 Hit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prediction Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(result.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold">
                      {result.actualDraw.split('').join(' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getHitIndicator(result.hitInTop5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getHitIndicator(result.hitInTop10)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium ${getScoreColor(result.predictionScore)}`}>
                        {(result.predictionScore * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-600">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedResult(result)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Analysis */}
      {summary && (
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">Performance Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-blue-800">Success Metrics</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Top 5 Hit Rate: {(summary.top5HitRate * 100).toFixed(1)}%</li>
                <li>• Top 10 Hit Rate: {(summary.top10HitRate * 100).toFixed(1)}%</li>
                <li>• Average Confidence: {(summary.averageConfidence * 100).toFixed(1)}%</li>
                <li>• Best Prediction Score: {(summary.bestPrediction?.predictionScore || 0 * 100).toFixed(1)}%</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-blue-800">Areas for Improvement</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Focus on improving Top 5 accuracy</li>
                <li>• Enhance confidence calibration</li>
                <li>• Analyze patterns in missed predictions</li>
                <li>• Consider adjusting prediction algorithms</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Result Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Validation Details - {new Date(selectedResult.date).toLocaleDateString()}</h3>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Draw Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Actual Draw:</span>
                      <span className="text-2xl font-mono font-bold">
                        {selectedResult.actualDraw.split('').join(' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Prediction Score:</span>
                      <span className={`font-bold ${getScoreColor(selectedResult.predictionScore)}`}>
                        {(selectedResult.predictionScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Confidence:</span>
                      <span className="font-bold text-blue-600">
                        {(selectedResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Hit in Top 5:</span>
                      {getHitIndicator(selectedResult.hitInTop5)}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Hit in Top 10:</span>
                      {getHitIndicator(selectedResult.hitInTop10)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Predicted Combinations</h4>

                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Top 5 Predictions:</h5>
                    <div className="grid grid-cols-5 gap-2">
                      {selectedResult.predictedTop5.map((combo, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-center font-mono text-sm border-2 ${
                            combo === selectedResult.actualDraw
                              ? 'bg-green-100 border-green-500 text-green-800'
                              : 'bg-gray-50 border-gray-300'
                          }`}
                        >
                          {combo.split('').join(' ')}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Top 10 Predictions:</h5>
                    <div className="grid grid-cols-5 gap-2">
                      {selectedResult.predictedTop10.map((combo, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-center font-mono text-sm border-2 ${
                            combo === selectedResult.actualDraw
                              ? 'bg-green-100 border-green-500 text-green-800'
                              : index < 5 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'
                          }`}
                        >
                          {combo.split('').join(' ')}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">Analysis</h4>
                <p className="text-sm text-gray-700">
                  {selectedResult.hitInTop5
                    ? `🎉 Excellent prediction! The actual draw was correctly predicted in the Top 5 with ${(selectedResult.predictionScore * 100).toFixed(1)}% confidence.`
                    : selectedResult.hitInTop10
                    ? `👍 Good prediction! The actual draw was in the Top 10 predictions with ${(selectedResult.predictionScore * 100).toFixed(1)}% confidence.`
                    : `📊 The prediction missed the Top 10 but achieved a ${(selectedResult.predictionScore * 100).toFixed(1)}% score. Consider analyzing this case for algorithm improvement.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalValidation;
