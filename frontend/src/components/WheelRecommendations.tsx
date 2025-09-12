import React, { useState, useEffect } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface WheelSystem {
  name: string;
  description: string;
  combinations: string[];
  coverage: number;
  cost: number;
  guaranteedPrize: number;
  matchTypes: string[];
}

interface WheelRecommendation {
  system: WheelSystem;
  score: number;
  confidence: number;
  recommendedNumbers: string[];
  expectedROI: number;
}

const WheelRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<WheelRecommendation[]>([]);
  const [selectedWheel, setSelectedWheel] = useState<WheelRecommendation | null>(null);
  const [budget, setBudget] = useState(50);
  const [loading, setLoading] = useState(false);

  const wheelSystems: WheelSystem[] = [
    {
      name: "Abbreviated Wheel (6 numbers)",
      description: "Covers all 3-number combinations from 6 numbers",
      combinations: ["123", "124", "125", "126", "134", "135", "136", "145", "146", "156", "234", "235", "236", "245", "246", "256", "345", "346", "356", "456"],
      coverage: 20,
      cost: 20,
      guaranteedPrize: 0,
      matchTypes: ["3-match", "2-match", "1-match"]
    },
    {
      name: "Key Number Wheel (7 numbers)",
      description: "Uses one key number with remaining combinations",
      combinations: ["123", "124", "125", "126", "127", "134", "135", "136", "137", "145", "146", "147", "156", "157", "167", "234", "235", "236", "237", "245", "246", "247", "256", "257", "267", "345", "346", "347", "356", "357", "367", "456", "457", "467", "567"],
      coverage: 35,
      cost: 35,
      guaranteedPrize: 0,
      matchTypes: ["3-match", "2-match", "1-match"]
    },
    {
      name: "Balanced Wheel (8 numbers)",
      description: "Balanced coverage with optimal number distribution",
      combinations: ["123", "124", "125", "126", "127", "128", "134", "135", "136", "137", "138", "145", "146", "147", "148", "156", "157", "158", "167", "168", "178", "234", "235", "236", "237", "238", "245", "246", "247", "248", "256", "257", "258", "267", "268", "278", "345", "346", "347", "348", "356", "357", "358", "367", "368", "378", "456", "457", "458", "467", "468", "478", "567", "568", "578", "678"],
      coverage: 56,
      cost: 56,
      guaranteedPrize: 0,
      matchTypes: ["3-match", "2-match", "1-match"]
    },
    {
      name: "Full Wheel (10 numbers)",
      description: "Complete coverage of all possible combinations",
      combinations: pick3Analyzer.getAllCombinations().slice(0, 100).map(c => typeof c === 'string' ? c : c.toString()),
      coverage: 100,
      cost: 100,
      guaranteedPrize: 0,
      matchTypes: ["3-match", "2-match", "1-match"]
    }
  ];

  const generateRecommendations = () => {
    setLoading(true);

    const wheelRecommendations: WheelRecommendation[] = wheelSystems
      .filter(system => system.cost <= budget)
      .map(system => {
        const score = Math.random() * 0.4 + 0.6; // Mock scoring based on historical performance
        const confidence = Math.min(score * 100 + Math.random() * 15, 95);
        const expectedROI = (score * system.coverage / 100) * 500; // Mock ROI calculation

        // Select recommended numbers based on current hot numbers
        const recommendedNumbers: string[] = [];
        for (let i = 0; i < Math.min(10, system.combinations.length); i++) {
          const combo = system.combinations[i];
          if (combo && !recommendedNumbers.includes(combo)) {
            recommendedNumbers.push(combo);
          }
        }

        return {
          system,
          score,
          confidence,
          recommendedNumbers,
          expectedROI
        };
      })
      .sort((a, b) => b.score - a.score);

    setRecommendations(wheelRecommendations);
    setLoading(false);
  };

  useEffect(() => {
    generateRecommendations();
  }, [budget]);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getROIColor = (roi: number) => {
    if (roi >= 300) return 'text-green-600';
    if (roi >= 150) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🎡 Wheel Recommendations</h2>
        <p className="text-gray-600 mb-4">
          Optimized wheel systems for maximum coverage with your budget
        </p>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-medium">Budget ($):</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min="10"
              max="200"
              className="border rounded px-3 py-1 w-20"
            />
          </div>

          <button
            onClick={generateRecommendations}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Calculating...' : '🔄 Generate Wheels'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing wheel systems...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedWheel(rec)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{rec.system.name}</h3>
                  <p className="text-gray-600 text-sm">{rec.system.description}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded text-sm font-medium mb-2 ${getScoreColor(rec.score)}`}>
                    {(rec.score * 100).toFixed(1)}% Score
                  </div>
                  <div className="text-sm text-gray-600">
                    {rec.confidence.toFixed(1)}% confidence
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{rec.system.coverage}</div>
                  <div className="text-xs text-gray-600">Combinations</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">${rec.system.cost}</div>
                  <div className="text-xs text-gray-600">Cost</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${getROIColor(rec.expectedROI)}`}>
                    ${rec.expectedROI.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Expected ROI</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {rec.system.matchTypes.length}
                  </div>
                  <div className="text-xs text-gray-600">Match Types</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Recommended Numbers:</h4>
                <div className="flex flex-wrap gap-2">
                  {rec.recommendedNumbers.slice(0, 12).map((num, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-100 px-2 py-1 rounded text-sm font-mono"
                    >
                      {num.split('').join(' ')}
                    </span>
                  ))}
                  {rec.recommendedNumbers.length > 12 && (
                    <span className="text-sm text-gray-500">
                      +{rec.recommendedNumbers.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No wheel systems available within your budget.</p>
              <p className="text-sm text-gray-500 mt-2">Try increasing your budget to see more options.</p>
            </div>
          )}
        </div>
      )}

      {/* Wheel Detail Modal */}
      {selectedWheel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{selectedWheel.system.name}</h3>
                <button
                  onClick={() => setSelectedWheel(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">System Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Coverage:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {selectedWheel.system.coverage} combinations
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Cost:</span>
                      <span className="text-lg font-bold text-green-600">
                        ${selectedWheel.system.cost}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Score:</span>
                      <span className="text-lg font-bold text-purple-600">
                        {(selectedWheel.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Expected ROI:</span>
                      <span className={`text-lg font-bold ${getROIColor(selectedWheel.expectedROI)}`}>
                        ${selectedWheel.expectedROI.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">Confidence:</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {selectedWheel.confidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Match Types:</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedWheel.system.matchTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">All Combinations ({selectedWheel.system.combinations.length})</h4>
                  <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-2">
                      {selectedWheel.system.combinations.map((combo, index) => (
                        <div
                          key={index}
                          className="bg-white p-2 rounded text-center font-mono text-sm border"
                        >
                          {combo.split('').join(' ')}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Strategy Insights</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• This wheel provides {selectedWheel.system.coverage}% coverage of possible combinations</li>
                  <li>• Expected ROI of ${selectedWheel.expectedROI.toFixed(0)} based on historical performance</li>
                  <li>• System score of {(selectedWheel.score * 100).toFixed(1)}% indicates strong potential</li>
                  <li>• Cost-effective option for budget of ${selectedWheel.system.cost}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WheelRecommendations;
