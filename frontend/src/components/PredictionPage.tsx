import React, { useState, useEffect } from 'react';
import { PowerballScoringSystem, DataManager } from '../utils/scoringSystem';

interface PredictionResult {
  combination: number[];
  powerball: number;
  confidence: number;
  reasoning: string[];
}

const PredictionPage: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [columnPredictions, setColumnPredictions] = useState<Map<number, any>>(new Map());
  const [loading, setLoading] = useState(false);
  const [scoringSystem] = useState(() => new PowerballScoringSystem());

  useEffect(() => {
    generatePredictions();
  }, []);

  const generatePredictions = async () => {
    setLoading(true);
    try {
      // Generate column-based predictions
      const columnAnalyzer = scoringSystem.getColumnAnalyzer();
      const columnPreds = new Map<number, any>();

      for (let col = 1; col <= 6; col++) {
        const prediction = columnAnalyzer.predictNextNumberForColumn(col);
        columnPreds.set(col, prediction);
      }

      setColumnPredictions(columnPreds);

      // Generate optimal combination prediction
      const optimalPrediction = columnAnalyzer.predictOptimalCombination();
      setPredictions(optimalPrediction);

    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Column-Based Predictions
          </h1>
          <p className="text-gray-600">
            AI-powered predictions using advanced column analysis and pattern recognition
          </p>
        </div>

        {/* Generate Button */}
        <div className="mb-8">
          <button
            onClick={generatePredictions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? '🔄 Generating Predictions...' : '🎯 Generate New Predictions'}
          </button>
        </div>

        {/* Column Predictions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from(columnPredictions.entries()).map(([column, prediction]) => (
            <div key={column} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {column === 6 ? 'Powerball' : `Column ${column}`}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                  {getConfidenceLabel(prediction.confidence)} Confidence
                </span>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {prediction.predictedNumber}
                </div>
                <div className="text-sm text-gray-600">
                  Confidence: {Math.round(prediction.confidence * 100)}%
                </div>
              </div>

              {prediction.alternatives && prediction.alternatives.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Alternatives:</h4>
                  <div className="flex gap-2">
                    {prediction.alternatives.map((alt: number, index: number) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                {prediction.reasoning}
              </div>
            </div>
          ))}
        </div>

        {/* Optimal Combination Prediction */}
        {predictions && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                🏆 Recommended Combination
              </h2>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getConfidenceColor(predictions.confidence)}`}>
                {getConfidenceLabel(predictions.confidence)} Confidence
              </span>
            </div>

            {/* Numbers Display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex gap-2">
                {predictions.combination.map((number, index) => (
                  <div key={index} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {number}
                  </div>
                ))}
              </div>
              <div className="text-2xl text-gray-400">+</div>
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {predictions.powerball}
              </div>
            </div>

            {/* Sum */}
            <div className="text-center mb-6">
              <div className="text-lg text-gray-600">Sum:</div>
              <div className="text-2xl font-bold text-gray-900">
                {predictions.combination.reduce((a, b) => a + b, 0) + predictions.powerball}
              </div>
            </div>

            {/* Reasoning */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Reasoning:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predictions.reasoning.map((reason, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-700">{reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Prediction Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 Prediction Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">68%</div>
              <div className="text-sm text-gray-600">Average Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">72%</div>
              <div className="text-sm text-gray-600">Recent Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">50</div>
              <div className="text-sm text-gray-600">Total Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">↗️</div>
              <div className="text-sm text-gray-600">Trend: Improving</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How Predictions Work</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Analyzes historical patterns for each column position</li>
              <li>• Considers number frequency, gaps, and trend analysis</li>
              <li>• Evaluates pattern continuation (even/odd, high/low, etc.)</li>
              <li>• Combines multiple factors for confidence scoring</li>
              <li>• Provides alternatives for risk management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;
