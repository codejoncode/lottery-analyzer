import React, { useState } from 'react';

interface ScoringFactor {
  name: string;
  weight: number;
  description: string;
  calculation: string;
  importance: 'high' | 'medium' | 'low';
  example: string;
}

const ScoreBreakdown: React.FC = () => {
  const [selectedFactor, setSelectedFactor] = useState<ScoringFactor | null>(null);

  const scoringFactors: ScoringFactor[] = [
    {
      name: "Column Prediction",
      weight: 0.20,
      description: "Analyzes digit transition probabilities between positions",
      calculation: "Weighted average of position-specific transition scores",
      importance: "high",
      example: "Position 1→2 transition: 85% | Position 2→3 transition: 72%"
    },
    {
      name: "Skip Analysis",
      weight: 0.18,
      description: "Evaluates current skip patterns against historical averages",
      calculation: "Deviation from mean skip count × pattern consistency",
      importance: "high",
      example: "Current skip: 12 draws | Historical average: 8.5 draws"
    },
    {
      name: "Pair Coverage",
      weight: 0.15,
      description: "Assesses coverage of hot pairs and combination patterns",
      calculation: "Sum of pair frequencies × coverage coefficient",
      importance: "medium",
      example: "Front pair (1,2): Hot | Back pair (2,3): Warm | Split pair (1,3): Cold"
    },
    {
      name: "Pattern Recognition",
      weight: 0.12,
      description: "Matches current patterns with historical classifications",
      calculation: "Pattern similarity score × historical success rate",
      importance: "medium",
      example: "Pattern: Even-High | Historical frequency: 23.4% | Success rate: 68%"
    },
    {
      name: "Sum Optimization",
      weight: 0.10,
      description: "Positions sum within optimal statistical ranges",
      calculation: "Distance from optimal sum range × range preference",
      importance: "low",
      example: "Sum: 14 | Optimal range: 10-16 | Position score: 95%"
    },
    {
      name: "VTrac Alignment",
      weight: 0.10,
      description: "Consistency with VTrac pattern sequences",
      calculation: "VTrac sequence match × pattern strength",
      importance: "low",
      example: "VTrac: 1-2-3 | Pattern strength: 78% | Sequence match: 92%"
    },
    {
      name: "Deflate Efficiency",
      weight: 0.15,
      description: "Filter efficiency and combination coverage after filtering",
      calculation: "Filter pass rate × coverage optimization",
      importance: "high",
      example: "Filters passed: 7/8 | Coverage maintained: 89% | Efficiency: 94%"
    }
  ];

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 0.15) return 'text-purple-600';
    if (weight >= 0.10) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">📊 Score Breakdown</h2>
        <p className="text-gray-600 mb-4">
          Detailed analysis of how each scoring factor contributes to final predictions
        </p>
      </div>

      {/* Scoring Overview */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-4">Scoring System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">7</div>
            <div className="text-sm text-gray-600">Active Factors</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">100%</div>
            <div className="text-sm text-gray-600">Total Weight</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">95%</div>
            <div className="text-sm text-gray-600">Max Confidence</div>
          </div>
        </div>

        <div className="text-sm text-gray-700">
          <p className="mb-2">
            <strong>Formula:</strong> Total Score = Σ(Factor Score × Factor Weight)
          </p>
          <p className="mb-2">
            <strong>Confidence:</strong> Min(Score × 100, 95%)
          </p>
          <p>
            <strong>Risk Assessment:</strong> Low (&gt;70%), Medium (40-70%), High (&lt;40%)
          </p>
        </div>
      </div>

      {/* Scoring Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {scoringFactors.map((factor, index) => (
          <div
            key={index}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedFactor(factor)}
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-sm">{factor.name}</h4>
              <div className="text-right">
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${getImportanceColor(factor.importance)}`}>
                  {factor.importance.toUpperCase()}
                </div>
                <div className={`text-sm font-bold ${getWeightColor(factor.weight)}`}>
                  {(factor.weight * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">{factor.description}</p>

            <div className="text-xs text-gray-500">
              <div className="font-medium mb-1">Calculation:</div>
              <div className="italic">{factor.calculation}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Weight Distribution Chart */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Factor Weight Distribution</h3>
        <div className="space-y-3">
          {scoringFactors
            .sort((a, b) => b.weight - a.weight)
            .map((factor, index) => (
            <div key={index} className="flex items-center">
              <div className="w-32 text-sm font-medium truncate">{factor.name}</div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${factor.weight * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className={`text-sm font-bold w-12 text-right ${getWeightColor(factor.weight)}`}>
                {(factor.weight * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Factor Detail Modal */}
      {selectedFactor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{selectedFactor.name}</h3>
                <button
                  onClick={() => setSelectedFactor(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-600 mb-1">Weight</div>
                    <div className={`text-2xl font-bold ${getWeightColor(selectedFactor.weight)}`}>
                      {(selectedFactor.weight * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-600 mb-1">Importance</div>
                    <div className={`text-2xl font-bold ${getImportanceColor(selectedFactor.importance)}`}>
                      {selectedFactor.importance.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{selectedFactor.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Calculation Method</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedFactor.calculation}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Example</h4>
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-blue-800">{selectedFactor.example}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded">
                  <h4 className="font-semibold mb-2 text-yellow-800">Impact on Final Score</h4>
                  <p className="text-yellow-800 text-sm">
                    This factor contributes up to {(selectedFactor.weight * 100).toFixed(1)}% to the total score.
                    {selectedFactor.importance === 'high' && ' It has significant influence on final predictions.'}
                    {selectedFactor.importance === 'medium' && ' It provides moderate influence on scoring.'}
                    {selectedFactor.importance === 'low' && ' It provides supplementary scoring information.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoring Tips */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">Scoring Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2 text-blue-800">High-Impact Factors</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Column Prediction (20%): Focus on position transitions</li>
              <li>• Skip Analysis (18%): Monitor skip patterns closely</li>
              <li>• Deflate Efficiency (15%): Optimize filter combinations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-blue-800">Optimization Strategies</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Balance all factors for best results</li>
              <li>• Monitor factor weights regularly</li>
              <li>• Adjust strategies based on performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;
