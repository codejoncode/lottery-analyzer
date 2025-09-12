import React, { useState, useCallback } from 'react';
import {
  PredictionValidator,
  type ValidationResult,
  type CrossValidationResult,
  type PredictionTest
} from '../utils/predictionValidator';
import { PredictionEngine } from '../prediction-engine/PredictionEngine';
import type { Draw } from '../utils/scoringSystem';

interface PredictionValidationDashboardProps {
  draws: Draw[];
  predictionEngine: PredictionEngine;
}

const PredictionValidationDashboard: React.FC<PredictionValidationDashboardProps> = ({
  draws,
  predictionEngine
}) => {
  const [validator] = useState(() => new PredictionValidator(draws));
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [crossValidationResult, setCrossValidationResult] = useState<CrossValidationResult | null>(null);
  const [testHistory, setTestHistory] = useState<PredictionTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<PredictionTest | null>(null);

  const runValidation = useCallback(async () => {
    setIsValidating(true);
    try {
      // Generate predictions for validation
      const predictionResult = await predictionEngine.generatePredictions({
        maxCombinations: 100,
        minScore: 0
      });

      // Use recent draws for validation (last 10 draws)
      const recentDraws = draws.slice(-10);

      const mockPredictions = predictionResult.combinations.map(pred => ({
        combination: pred.numbers,
        confidence: pred.confidence,
        expectedHits: Math.floor(pred.compositeScore / 20) // Rough estimate based on score
      }));

      const result = validator.validatePredictions(mockPredictions, recentDraws);
      setValidationResult(result);

      // Add to test history
      const test: PredictionTest = {
        id: Date.now().toString(),
        name: `Validation Test ${new Date().toLocaleString()}`,
        predictions: mockPredictions,
        actualDraw: recentDraws[recentDraws.length - 1],
        timestamp: new Date()
      };

      setTestHistory(prev => [test, ...prev.slice(0, 9)]); // Keep last 10 tests

    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  }, [validator, predictionEngine, draws]);

  const runCrossValidation = useCallback(async () => {
    setIsValidating(true);
    try {
      const result = await validator.performCrossValidation(
        async (trainData, testSize) => {
          // Create a temporary prediction engine with training data
          const tempEngine = new PredictionEngine(trainData);

          const predictionResult = await tempEngine.generatePredictions({
            maxCombinations: Math.min(50, testSize),
            minScore: 0
          });

          return predictionResult.combinations.map(pred => ({
            combination: pred.numbers,
            confidence: pred.confidence,
            expectedHits: Math.floor(pred.compositeScore / 20)
          }));
        },
        5 // 5-fold cross-validation
      );

      setCrossValidationResult(result);
    } catch (error) {
      console.error('Cross-validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  }, [validator]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.1) return 'text-green-600 bg-green-100';
    if (accuracy >= 0.01) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🔬 Prediction Validation</h2>
        <div className="flex space-x-3">
          <button
            onClick={runValidation}
            disabled={isValidating}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isValidating ? '🔍 Validating...' : '🔍 Run Validation'}
          </button>
          <button
            onClick={runCrossValidation}
            disabled={isValidating}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {isValidating ? '🔄 Cross-Validating...' : '🔄 Cross-Validate'}
          </button>
        </div>
      </div>

      {/* Current Validation Results */}
      {validationResult && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">📊 Current Validation Results</h3>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${getConfidenceColor(validationResult.confidence)}`}>
              <div className="text-2xl font-bold">
                {(validationResult.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm">Confidence</div>
            </div>
            <div className={`p-4 rounded-lg ${getAccuracyColor(validationResult.accuracy)}`}>
              <div className="text-2xl font-bold">
                {(validationResult.accuracy * 100).toFixed(3)}%
              </div>
              <div className="text-sm">Accuracy</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {validationResult.details.totalPredictions.toLocaleString()}
              </div>
              <div className="text-sm text-blue-800">Total Predictions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {validationResult.details.correctPredictions.toLocaleString()}
              </div>
              <div className="text-sm text-green-800">Correct Predictions</div>
            </div>
          </div>

          {/* Hit Rates */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">🎯 Hit Rates</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(validationResult.details.hitRates).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">
                    {(value * 100).toFixed(4)}%
                  </div>
                  <div className="text-sm text-gray-600">{key} matches</div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistical Significance */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">📈 Statistical Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Confidence Interval</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    validationResult.details.statisticalSignificance.isSignificant
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {validationResult.details.statisticalSignificance.isSignificant ? 'Significant' : 'Not Significant'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {(validationResult.details.confidenceInterval.lower * 100).toFixed(2)}% - {(validationResult.details.confidenceInterval.upper * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  p-value: {validationResult.details.statisticalSignificance.pValue.toFixed(4)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Performance vs Random</div>
                <div className="text-lg font-bold text-gray-900">
                  {validationResult.accuracy > 1/292201338
                    ? `${((validationResult.accuracy / (1/292201338)) * 100).toFixed(0)}x better`
                    : 'Worse than random'
                  }
                </div>
                <div className="text-xs text-gray-500">
                  Random chance: {(1/292201338 * 100).toFixed(8)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Validation Results */}
      {crossValidationResult && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">🔄 Cross-Validation Results (5-fold)</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {(crossValidationResult.averageAccuracy * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-blue-800">Average Accuracy</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {(crossValidationResult.standardDeviation * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-green-800">Standard Deviation</div>
            </div>
            <div className={`p-4 rounded-lg ${getConfidenceColor(crossValidationResult.overallConfidence)}`}>
              <div className="text-2xl font-bold">
                {(crossValidationResult.overallConfidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm">Overall Confidence</div>
            </div>
          </div>

          {/* Fold Results */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">📋 Individual Fold Results</h4>
            <div className="space-y-2">
              {crossValidationResult.foldResults.map((fold, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                      index === crossValidationResult.bestFold ? 'bg-green-500 text-white' :
                      index === crossValidationResult.worstFold ? 'bg-red-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium">Fold {index + 1}</span>
                    {index === crossValidationResult.bestFold && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Best</span>
                    )}
                    {index === crossValidationResult.worstFold && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Worst</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {(fold.accuracy * 100).toFixed(3)}% accuracy
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getConfidenceColor(fold.confidence)}`}>
                      {(fold.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test History */}
      {testHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">📚 Test History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {testHistory.map((test) => (
              <div
                key={test.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTest?.id === test.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedTest(test)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-600">
                      {test.timestamp.toLocaleString()} • {test.predictions.length} predictions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Actual: {test.actualDraw.white_balls.join('-')} + {test.actualDraw.red_ball}
                    </div>
                    <div className="text-xs text-gray-500">{test.actualDraw.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Validation Methodology</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• <strong>Validation:</strong> Tests predictions against recent historical draws</li>
          <li>• <strong>Cross-Validation:</strong> 5-fold validation to ensure model stability</li>
          <li>• <strong>Statistical Significance:</strong> Determines if results are better than random chance</li>
          <li>• <strong>Confidence Intervals:</strong> Provides range of expected performance</li>
          <li>• <strong>Hit Rates:</strong> Measures success across different match levels (1+, 2+, 3+, etc.)</li>
        </ul>
      </div>
    </div>
  );
};

export default PredictionValidationDashboard;
