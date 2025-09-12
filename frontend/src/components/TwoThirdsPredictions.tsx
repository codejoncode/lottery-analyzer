import React, { useState, useMemo } from 'react';

interface Prediction {
  position: number;
  predictedDigits: number[];
  confidence: number;
  basedOn: string;
  recentPattern: number[];
  expectedHits: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const TwoThirdsPredictions: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [predictionMethod, setPredictionMethod] = useState<'recent' | 'frequency' | 'pattern'>('recent');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(60);

  // Generate mock prediction data
  const predictions = useMemo(() => {
    const data: Prediction[] = [];
    for (let position = 0; position < 3; position++) {
      const predictedDigits = [];
      const numDigits = Math.floor(Math.random() * 3) + 3; // 3-5 digits

      // Generate unique digits
      const availableDigits = Array.from({ length: 10 }, (_, i) => i);
      for (let i = 0; i < numDigits; i++) {
        const randomIndex = Math.floor(Math.random() * availableDigits.length);
        predictedDigits.push(availableDigits.splice(randomIndex, 1)[0]);
      }

      const confidence = Math.floor(Math.random() * 40) + confidenceThreshold;
      const recentPattern = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10));
      const expectedHits = Math.floor(Math.random() * 3) + 1;

      let riskLevel: 'low' | 'medium' | 'high';
      if (confidence > 80) riskLevel = 'low';
      else if (confidence > 65) riskLevel = 'medium';
      else riskLevel = 'high';

      let basedOn: string;
      switch (predictionMethod) {
        case 'recent':
          basedOn = 'Recent draw patterns';
          break;
        case 'frequency':
          basedOn = 'Frequency analysis';
          break;
        case 'pattern':
          basedOn = 'Pattern recognition';
          break;
        default:
          basedOn = 'Mixed analysis';
      }

      data.push({
        position,
        predictedDigits: predictedDigits.sort((a, b) => a - b),
        confidence,
        basedOn,
        recentPattern,
        expectedHits,
        riskLevel
      });
    }
    return data;
  }, [predictionMethod, confidenceThreshold]);

  const filteredPredictions = useMemo(() => {
    let filtered = predictions.filter(p => p.confidence >= confidenceThreshold);

    if (selectedPosition !== null) {
      filtered = filtered.filter(p => p.position === selectedPosition);
    }

    return filtered.sort((a, b) => b.confidence - a.confidence);
  }, [predictions, confidenceThreshold, selectedPosition]);

  const statistics = useMemo(() => {
    const total = filteredPredictions.length;
    const avgConfidence = filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / total;
    const lowRisk = filteredPredictions.filter(p => p.riskLevel === 'low').length;
    const mediumRisk = filteredPredictions.filter(p => p.riskLevel === 'medium').length;
    const highRisk = filteredPredictions.filter(p => p.riskLevel === 'high').length;
    const totalExpectedHits = filteredPredictions.reduce((sum, p) => sum + p.expectedHits, 0);

    return {
      total,
      avgConfidence: avgConfidence.toFixed(1),
      lowRisk,
      mediumRisk,
      highRisk,
      totalExpectedHits
    };
  }, [filteredPredictions]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 80) return 'bg-green-500 text-white';
    if (confidence > 65) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">🎯 Two-Thirds Predictions</h3>
        <p className="text-gray-600">Predict digits based on the two-thirds rule and recent patterns</p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Prediction Method:</label>
            <select
              value={predictionMethod}
              onChange={(e) => setPredictionMethod(e.target.value as typeof predictionMethod)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="recent">Recent Patterns</option>
              <option value="frequency">Frequency Analysis</option>
              <option value="pattern">Pattern Recognition</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Position:</label>
            <select
              value={selectedPosition || ''}
              onChange={(e) => setSelectedPosition(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Positions</option>
              <option value={0}>Position 1</option>
              <option value={1}>Position 2</option>
              <option value={2}>Position 3</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Min Confidence:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{statistics.total}</div>
            <div className="text-xs text-blue-800">Predictions</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{statistics.avgConfidence}%</div>
            <div className="text-xs text-green-800">Avg Confidence</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{statistics.totalExpectedHits}</div>
            <div className="text-xs text-purple-800">Expected Hits</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{statistics.lowRisk}</div>
            <div className="text-xs text-orange-800">Low Risk</div>
          </div>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Position Predictions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPredictions.map((prediction) => (
            <div key={prediction.position} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-800">Position {prediction.position + 1}</h5>
                <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(prediction.riskLevel)}`}>
                  {prediction.riskLevel} risk
                </span>
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Predicted Digits:</div>
                <div className="flex flex-wrap gap-1">
                  {prediction.predictedDigits.map((digit) => (
                    <span
                      key={digit}
                      className="inline-flex items-center px-2 py-1 text-sm font-mono bg-blue-100 text-blue-800 rounded"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className={`font-medium ${getConfidenceColor(prediction.confidence)} px-2 py-1 rounded text-xs`}>
                    {prediction.confidence}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Hits:</span>
                  <span className="font-medium">{prediction.expectedHits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Based on:</span>
                  <span className="font-medium text-right">{prediction.basedOn}</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm text-gray-600 mb-1">Recent Pattern:</div>
                <div className="flex gap-1">
                  {prediction.recentPattern.map((digit, index) => (
                    <span
                      key={index}
                      className="w-6 h-6 flex items-center justify-center text-xs font-mono bg-gray-100 rounded"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Detailed Prediction Analysis</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Digits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Hits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Based On</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPredictions.map((prediction) => (
                <tr key={prediction.position}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    Position {prediction.position + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">
                    {prediction.predictedDigits.join(', ')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConfidenceColor(prediction.confidence)}`}>
                      {prediction.confidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(prediction.riskLevel)}`}>
                      {prediction.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {prediction.expectedHits}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {prediction.basedOn}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Risk Analysis Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2">Low Risk Predictions</h5>
            <div className="text-2xl font-bold text-green-600 mb-1">{statistics.lowRisk}</div>
            <div className="text-sm text-green-700">
              High confidence (&gt;80%) predictions with strong pattern support
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">Medium Risk Predictions</h5>
            <div className="text-2xl font-bold text-yellow-600 mb-1">{statistics.mediumRisk}</div>
            <div className="text-sm text-yellow-700">
              Moderate confidence (65-80%) with mixed signal support
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <h5 className="font-medium text-red-800 mb-2">High Risk Predictions</h5>
            <div className="text-2xl font-bold text-red-600 mb-1">{statistics.highRisk}</div>
            <div className="text-sm text-red-700">
              Lower confidence (&lt;65%) predictions requiring careful consideration
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>High Confidence (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Confidence (65-80%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Low Confidence (&lt;65%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Low Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoThirdsPredictions;
