import React, { useState, useEffect } from 'react';
import { pick3DataManager } from '../services/Pick3DataManager';

interface Prediction {
  combination: string;
  score: number;
  confidence: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  hotStreak: number;
  lastSeen: number;
  predictedDraws: string[];
  pattern: string;
  frequency: number;
  dueFactor: number;
}

interface HistoricalDraw {
  numbers?: number[];
  midday?: string;
  evening?: string;
  date?: string;
}

interface PatternAnalysis {
  combination: string;
  frequency: number;
  lastSeen: number;
  hotStreak: number;
  dueFactor: number;
  patternType: string;
}

const Top20Predictions: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [timeframe, setTimeframe] = useState<'next' | 'week' | 'month'>('next');
  const [historicalData, setHistoricalData] = useState<HistoricalDraw[]>([]);

  // Load historical data on component mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    try {
      // Get all available historical data
      const allDraws = pick3DataManager.getDraws();
      setHistoricalData(allDraws);
      console.log(`Loaded ${allDraws.length} historical draws for analysis`);
    } catch (error) {
      console.error('Error loading historical data:', error);
      setHistoricalData([]);
    }
  };

  const generatePredictions = () => {
    if (historicalData.length === 0) {
      console.log('No historical data available for predictions');
      return;
    }

    setLoading(true);

    try {
      // Analyze historical patterns and frequencies
      const patternAnalysis = analyzeHistoricalPatterns();
      const scoredPredictions: Prediction[] = patternAnalysis.map((pattern) => {
        const score = calculatePredictionScore(pattern);
        const confidence = calculateConfidence(pattern, historicalData.length);
        const trend = determineTrend(pattern);
        const hotStreak = pattern.hotStreak || 0;
        const lastSeen = pattern.lastSeen || 0;

        // Only include combinations not seen in last 50 draws (user's requirement)
        if (lastSeen < 50) {
          return null; // Skip recently drawn combinations
        }

        return {
          combination: pattern.combination,
          score,
          confidence,
          rank: 0, // Will be set after sorting
          trend,
          hotStreak,
          lastSeen,
          predictedDraws: generatePredictedDraws(pattern, timeframe),
          pattern: pattern.patternType,
          frequency: pattern.frequency,
          dueFactor: pattern.dueFactor
        };
      }).filter(Boolean) as Prediction[]; // Remove null entries

      // Sort by score and take top 20
      scoredPredictions.sort((a, b) => b.score - a.score);
      const top20 = scoredPredictions.slice(0, 20).map((pred, index) => ({
        ...pred,
        rank: index + 1
      }));

      setPredictions(top20);
    } catch (error) {
      console.error('Error generating predictions:', error);
      setPredictions([]);
    }

    setLoading(false);
  };

  const analyzeHistoricalPatterns = (): PatternAnalysis[] => {
    const patterns: PatternAnalysis[] = [];
    const combinationFrequency = new Map<string, number>();
    const lastSeenMap = new Map<string, number>();
    const hotStreaks = new Map<string, number>();

    // Analyze each historical draw
    historicalData.forEach((draw, index) => {
      const combo = Array.isArray(draw.numbers)
        ? draw.numbers.join('')
        : typeof draw.midday === 'string' ? draw.midday : draw.evening || '';

      if (combo) {
        // Update frequency
        combinationFrequency.set(combo, (combinationFrequency.get(combo) || 0) + 1);

        // Update last seen
        lastSeenMap.set(combo, index);

        // Check for hot streaks (consecutive appearances)
        const prevDraw = historicalData[index - 1];
        if (prevDraw) {
          const prevCombo = Array.isArray(prevDraw.numbers)
            ? prevDraw.numbers.join('')
            : typeof prevDraw.midday === 'string' ? prevDraw.midday : prevDraw.evening || '';

          if (prevCombo === combo) {
            hotStreaks.set(combo, (hotStreaks.get(combo) || 0) + 1);
          } else {
            hotStreaks.set(combo, 0);
          }
        }
      }
    });

    // Convert to pattern analysis
    combinationFrequency.forEach((frequency, combination) => {
      const lastSeen = lastSeenMap.get(combination) || 0;
      const hotStreak = hotStreaks.get(combination) || 0;
      const expectedFrequency = historicalData.length / 1000; // Expected frequency for random
      const dueFactor = expectedFrequency / Math.max(frequency, 1); // How "due" it is

      patterns.push({
        combination,
        frequency,
        lastSeen: historicalData.length - lastSeen, // Convert to draws ago
        hotStreak,
        dueFactor,
        patternType: determinePatternType(combination)
      });
    });

    return patterns;
  };

  const determinePatternType = (combination: string): string => {
    const digits = combination.split('').map(Number);
    const uniqueDigits = new Set(digits);

    if (uniqueDigits.size === 1) return 'Triple';
    if (uniqueDigits.size === 2) return 'Double';
    if (uniqueDigits.size === 3) return 'Single';

    // Check for consecutive numbers
    const sorted = [...digits].sort((a, b) => a - b);
    if (sorted[2] - sorted[1] === 1 && sorted[1] - sorted[0] === 1) return 'Consecutive';

    // Check for even/odd patterns
    const evenCount = digits.filter(d => d % 2 === 0).length;
    if (evenCount === 3) return 'All Even';
    if (evenCount === 0) return 'All Odd';
    if (evenCount === 2) return 'Mostly Even';
    if (evenCount === 1) return 'Mostly Odd';

    return 'Mixed';
  };

  const calculatePredictionScore = (pattern: PatternAnalysis): number => {
    let score = 0;

    // Base score from due factor (higher = more due)
    score += Math.min(pattern.dueFactor * 0.3, 0.3);

    // Bonus for longer absence (but not too recent)
    if (pattern.lastSeen > 100) {
      score += 0.2;
    } else if (pattern.lastSeen > 50) {
      score += 0.1;
    }

    // Small bonus for hot streaks (but not too much)
    if (pattern.hotStreak > 0 && pattern.hotStreak <= 3) {
      score += pattern.hotStreak * 0.05;
    }

    // Pattern-based bonuses
    switch (pattern.patternType) {
      case 'Single': score += 0.1; break;
      case 'Double': score += 0.05; break;
      case 'Triple': score += 0.02; break;
      case 'Consecutive': score += 0.08; break;
    }

    return Math.min(score, 0.95); // Cap at 95%
  };

  const calculateConfidence = (pattern: PatternAnalysis, totalDraws: number): number => {
    // Confidence based on historical data size and pattern consistency
    const baseConfidence = Math.min(totalDraws / 1000, 1) * 100;
    const patternConsistency = pattern.frequency / Math.max(pattern.lastSeen / 100, 1);

    return Math.min(baseConfidence * (0.5 + patternConsistency * 0.5), 95);
  };

  const determineTrend = (pattern: PatternAnalysis): 'up' | 'down' | 'stable' => {
    if (pattern.hotStreak > 2) return 'up';
    if (pattern.lastSeen > 200) return 'down';
    return 'stable';
  };

  const generatePredictedDraws = (pattern: PatternAnalysis, timeframe: string): string[] => {
    const drawCount = timeframe === 'next' ? 1 : timeframe === 'week' ? 7 : 30;
    const predictedDraws = [];

    // Generate variations of the pattern for prediction
    for (let i = 0; i < drawCount; i++) {
      // Create slight variations of the combination
      const baseDigits = pattern.combination.split('').map(Number);
      const variation = baseDigits.map((digit: number) =>
        Math.max(0, Math.min(9, digit + Math.floor(Math.random() * 3) - 1))
      );
      predictedDraws.push(variation.join(''));
    }

    return predictedDraws;
  };

  useEffect(() => {
    if (historicalData.length > 0) {
      generatePredictions();
    }
  }, [timeframe, historicalData]);

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
          AI-powered predictions based on {historicalData.length} historical draws
        </p>

        {/* Data Status Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">Prediction Quality</h3>
              <p className="text-sm text-blue-600">
                Using {historicalData.length} historical draws for analysis
                {historicalData.length > 1000 ? ' (Excellent data quality)' :
                 historicalData.length > 500 ? ' (Good data quality)' :
                 historicalData.length > 100 ? ' (Fair data quality)' :
                 ' (Limited data - predictions may be less accurate)'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {historicalData.length > 1000 ? '🟢' :
                 historicalData.length > 500 ? '🟡' :
                 historicalData.length > 100 ? '🟠' : '🔴'}
              </div>
              <div className="text-sm text-blue-600">
                {historicalData.length > 1000 ? 'Excellent' :
                 historicalData.length > 500 ? 'Good' :
                 historicalData.length > 100 ? 'Fair' : 'Limited'}
              </div>
            </div>
          </div>
        </div>

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
                      <span className="font-medium">Pattern:</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {selectedPrediction.pattern}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Historical Frequency:</span>
                      <span className="text-lg font-bold text-teal-600">
                        {selectedPrediction.frequency} times
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Due Factor:</span>
                      <span className="text-lg font-bold text-pink-600">
                        {selectedPrediction.dueFactor.toFixed(2)}x
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
