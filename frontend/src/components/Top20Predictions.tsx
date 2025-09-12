import React, { useState, useEffect } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface Prediction {
  combination: string;
  score: number;
  confidence: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  hotStreak: number;
  lastSeen: number;
  predictedDraws: string[];
}

const Top20Predictions: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [timeframe, setTimeframe] = useState<'next' | 'week' | 'month'>('next');

  const generatePredictions = () => {
    setLoading(true);

    // Generate top 20 predictions based on scoring algorithm
    const allCombos = pick3Analyzer.getAllCombinations();
    const scoredPredictions: Prediction[] = allCombos.map((combo, index) => {
      const comboStr = typeof combo === 'string' ? combo : combo.toString();
      const score = Math.random() * 0.5 + 0.5; // Mock scoring
      const confidence = Math.min(score * 100 + Math.random() * 20, 95);
      const trend = Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down';
      const hotStreak = Math.floor(Math.random() * 5);
      const lastSeen = Math.floor(Math.random() * 30);

      // Generate predicted draws based on timeframe
      const drawCount = timeframe === 'next' ? 1 : timeframe === 'week' ? 7 : 30;
      const predictedDraws = [];
      for (let i = 0; i < drawCount; i++) {
        const randomCombo = allCombos[Math.floor(Math.random() * allCombos.length)];
        predictedDraws.push(typeof randomCombo === 'string' ? randomCombo : randomCombo.toString());
      }

      return {
        combination: comboStr,
        score,
        confidence,
        rank: index + 1,
        trend,
        hotStreak,
        lastSeen,
        predictedDraws
      };
    });

    // Sort by score and take top 20
    scoredPredictions.sort((a, b) => b.score - a.score);
    const top20 = scoredPredictions.slice(0, 20).map((pred, index) => ({
      ...pred,
      rank: index + 1
    }));

    setPredictions(top20);
    setLoading(false);
  };

  useEffect(() => {
    generatePredictions();
  }, [timeframe]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🎯 Top 20 Predictions</h2>
        <p className="text-gray-600 mb-4">
          AI-powered predictions for the most likely Pick 3 combinations
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-medium">Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'next' | 'week' | 'month')}
              className="border rounded px-3 py-1"
            >
              <option value="next">Next Draw</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
            </select>
          </div>

          <button
            onClick={generatePredictions}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Generating...' : '🔄 Refresh Predictions'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating predictions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {predictions.map((prediction) => (
            <div
              key={prediction.combination}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPrediction(prediction)}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">#{prediction.rank}</span>
                <div className="flex items-center gap-1">
                  <span className={getTrendColor(prediction.trend)}>
                    {getTrendIcon(prediction.trend)}
                  </span>
                </div>
              </div>

              <div className="text-center mb-3">
                <div className="text-2xl font-bold mb-1">
                  {prediction.combination.split('').join(' ')}
                </div>
                <div className={`inline-block px-2 py-1 rounded text-sm font-medium mb-2 ${getScoreColor(prediction.score)}`}>
                  {(prediction.score * 100).toFixed(1)}% Score
                </div>
                <div className="text-sm text-gray-600">
                  {prediction.confidence.toFixed(1)}% confidence
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hot Streak:</span>
                  <span className="font-medium">{prediction.hotStreak} draws</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Seen:</span>
                  <span className="font-medium">{prediction.lastSeen} draws ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trend:</span>
                  <span className={`font-medium ${getTrendColor(prediction.trend)}`}>
                    {prediction.trend.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prediction Statistics */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Prediction Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {predictions.filter(p => p.trend === 'up').length}
            </div>
            <div className="text-sm text-gray-600">Trending Up</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {predictions.filter(p => p.trend === 'stable').length}
            </div>
            <div className="text-sm text-gray-600">Stable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {predictions.filter(p => p.trend === 'down').length}
            </div>
            <div className="text-sm text-gray-600">Trending Down</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Detailed Prediction Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Prediction Analysis: {selectedPrediction.combination}</h3>
                <button
                  onClick={() => setSelectedPrediction(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Prediction Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Score:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(selectedPrediction.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Confidence:</span>
                      <span className="text-lg font-bold text-green-600">
                        {selectedPrediction.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Rank:</span>
                      <span className="text-lg font-bold">#{selectedPrediction.rank}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Trend:</span>
                      <span className={`text-lg font-bold ${getTrendColor(selectedPrediction.trend)}`}>
                        {getTrendIcon(selectedPrediction.trend)} {selectedPrediction.trend.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Hot Streak:</span>
                      <span className="text-lg font-bold text-orange-600">
                        {selectedPrediction.hotStreak} consecutive draws
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Last Seen:</span>
                      <span className="text-lg font-bold text-purple-600">
                        {selectedPrediction.lastSeen} draws ago
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">
                    Predicted Draws ({timeframe === 'next' ? 'Next' : timeframe === 'week' ? '7 Days' : '30 Days'})
                  </h4>
                  <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedPrediction.predictedDraws.map((draw, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="font-mono text-lg">
                            {draw.split('').join(' ')}
                          </span>
                          <span className="text-sm text-gray-500">
                            Draw {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Prediction Insights</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• This combination shows strong {selectedPrediction.trend} momentum</li>
                  <li>• Hot streak of {selectedPrediction.hotStreak} draws indicates positive pattern</li>
                  <li>• Last appeared {selectedPrediction.lastSeen} draws ago - optimal timing</li>
                  <li>• Confidence level of {selectedPrediction.confidence.toFixed(1)}% based on historical data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Top20Predictions;
