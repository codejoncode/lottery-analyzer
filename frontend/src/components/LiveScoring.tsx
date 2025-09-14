import React, { useState, useEffect } from 'react';

interface ScoringFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
  details: string;
}

interface CombinationScore {
  combination: string;
  totalScore: number;
  factors: ScoringFactor[];
  rank: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const LiveScoring: React.FC = () => {
  const [topCombinations, setTopCombinations] = useState<CombinationScore[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<CombinationScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [targetDraws, setTargetDraws] = useState(10);

  // Scoring factors with their weights
  const SCORING_FACTORS = [
    { name: 'Column Prediction', weight: 0.20, description: 'Based on column transition probabilities' },
    { name: 'Skip Analysis', weight: 0.18, description: 'Current skip patterns vs historical averages' },
    { name: 'Pair Coverage', weight: 0.15, description: 'Coverage of hot pairs and combinations' },
    { name: 'Pattern Recognition', weight: 0.12, description: 'Matches current pattern classifications' },
    { name: 'Sum Optimization', weight: 0.10, description: 'Optimal sum range positioning' },
    { name: 'VTrac Alignment', weight: 0.10, description: 'VTrac pattern consistency' },
    { name: 'Deflate Efficiency', weight: 0.15, description: 'Filter efficiency and coverage' }
  ];

  // Mock scoring functions (would integrate with actual components)
  const calculateColumnScore = (combo: string): number => {
    const digits = combo.split('').map(Number);
    let score = 0;
    digits.forEach((digit, pos) => {
      const positionBonus = [0.8, 0.9, 0.7][pos] || 0.5;
      score += (digit / 9) * positionBonus;
    });
    return Math.min(score / 3, 1);
  };

  const calculateSkipScore = (combo: string): number => {
    const digits = combo.split('').map(Number);
    let score = 0;
    digits.forEach(_digit => {
      const skipFactor = Math.random() * 0.5 + 0.5;
      score += skipFactor;
    });
    return Math.min(score / 3, 1);
  };

  const calculatePairScore = (combo: string): number => {
    const pairs = [
      combo.slice(0, 2),
      combo.slice(1, 3),
      combo[0] + combo[2]
    ];
    let score = 0;
    pairs.forEach(_pair => {
      const pairFrequency = Math.random() * 0.7 + 0.3;
      score += pairFrequency;
    });
    return Math.min(score / 3, 1);
  };

  const calculatePatternScore = (combo: string): number => {
    const digits = combo.split('').map(Number);
    const sum = digits.reduce((a, b) => a + b, 0);
    const isEven = digits.filter(d => d % 2 === 0).length;
    const isHigh = digits.filter(d => d >= 5).length;

    let patternScore = 0;
    if (sum >= 10 && sum <= 16) patternScore += 0.4;
    if (isEven >= 1 && isEven <= 2) patternScore += 0.3;
    if (isHigh >= 1 && isHigh <= 2) patternScore += 0.3;
    return Math.min(patternScore, 1);
  };

  const calculateSumScore = (combo: string): number => {
    const digits = combo.split('').map(Number);
    const sum = digits.reduce((a, b) => a + b, 0);
    if (sum >= 10 && sum <= 16) return 1.0;
    if (sum >= 7 && sum <= 19) return 0.7;
    return 0.3;
  };

  const calculateVTracScore = (combo: string): number => {
    const digits = combo.split('').map(Number);
    const vtracSum = digits.map(d => d + 5).reduce((a, b) => a + b, 0);
    if (vtracSum >= 15 && vtracSum <= 21) return 1.0;
    if (vtracSum >= 12 && vtracSum <= 24) return 0.7;
    return 0.4;
  };

  const calculateDeflateScore = (combo: string): number => {
    const digits = combo.split('').map(Number);
    const uniqueDigits = new Set(digits).size;
    let filterScore = 0.5;
    if (uniqueDigits >= 2) filterScore += 0.2;
    if (digits.some(d => d >= 5)) filterScore += 0.15;
    if (digits.some(d => d <= 4)) filterScore += 0.15;
    return Math.min(filterScore, 1);
  };

  const calculateCombinationScore = (combo: string): CombinationScore => {
    const factors: ScoringFactor[] = [
      {
        name: 'Column Prediction',
        weight: 0.20,
        score: calculateColumnScore(combo),
        description: 'Based on column transition probabilities',
        details: `Score: ${(calculateColumnScore(combo) * 100).toFixed(1)}%`
      },
      {
        name: 'Skip Analysis',
        weight: 0.18,
        score: calculateSkipScore(combo),
        description: 'Current skip patterns vs historical averages',
        details: `Score: ${(calculateSkipScore(combo) * 100).toFixed(1)}%`
      },
      {
        name: 'Pair Coverage',
        weight: 0.15,
        score: calculatePairScore(combo),
        description: 'Coverage of hot pairs and combinations',
        details: `Score: ${(calculatePairScore(combo) * 100).toFixed(1)}%`
      },
      {
        name: 'Pattern Recognition',
        weight: 0.12,
        score: calculatePatternScore(combo),
        description: 'Matches current pattern classifications',
        details: `Score: ${(calculatePatternScore(combo) * 100).toFixed(1)}%`
      },
      {
        name: 'Sum Optimization',
        weight: 0.10,
        score: calculateSumScore(combo),
        description: 'Optimal sum range positioning',
        details: `Score: ${(calculateSumScore(combo) * 100).toFixed(1)}%`
      },
      {
        name: 'VTrac Alignment',
        weight: 0.10,
        score: calculateVTracScore(combo),
        description: 'VTrac pattern consistency',
        details: `Score: ${(calculateVTracScore(combo) * 100).toFixed(1)}%`
      },
      {
        name: 'Deflate Efficiency',
        weight: 0.15,
        score: calculateDeflateScore(combo),
        description: 'Filter efficiency and coverage',
        details: `Score: ${(calculateDeflateScore(combo) * 100).toFixed(1)}%`
      }
    ];

    const totalScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
    const confidence = Math.min(totalScore * 100, 95);

    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (totalScore >= 0.7) riskLevel = 'low';
    else if (totalScore <= 0.4) riskLevel = 'high';

    return {
      combination: combo,
      totalScore,
      factors,
      rank: 0,
      confidence,
      riskLevel
    };
  };

  const generateTopCombinations = () => {
    setLoading(true);

    const allCombos: CombinationScore[] = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        for (let k = 0; k < 10; k++) {
          const combo = `${i}${j}${k}`;
          const score = calculateCombinationScore(combo);
          allCombos.push(score);
        }
      }
    }

    allCombos.sort((a, b) => b.totalScore - a.totalScore);
    const top = allCombos.slice(0, targetDraws).map((combo, index) => ({
      ...combo,
      rank: index + 1
    }));

    setTopCombinations(top);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    generateTopCombinations();
  }, [targetDraws]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">⚡ Live Scoring</h2>
        <p className="text-gray-600 mb-4">
          Real-time scoring of all Pick 3 combinations using advanced algorithms
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Last updated: {lastUpdated.toLocaleString()}</span>
          <div className="flex items-center gap-2">
            <label htmlFor="targetDraws" className="font-medium">Show top:</label>
            <select
              id="targetDraws"
              value={targetDraws}
              onChange={(e) => setTargetDraws(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scoring Factors Overview */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Active Scoring Factors</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {SCORING_FACTORS.map((factor, index) => (
            <div key={index} className="bg-white p-3 rounded border">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{factor.name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {(factor.weight * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-600">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Combinations */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Top {targetDraws} Combinations</h3>
          <button
            onClick={generateTopCombinations}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Calculating...' : '🔄 Refresh Scores'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Calculating optimal combinations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {topCombinations.map((combo) => (
              <div
                key={combo.combination}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCombination(combo)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">#{combo.rank}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(combo.riskLevel)}`}>
                    {combo.riskLevel.toUpperCase()}
                  </span>
                </div>

                <div className="text-center mb-3">
                  <div className="text-2xl font-bold mb-1">
                    {combo.combination.split('').join(' ')}
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {(combo.totalScore * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {combo.confidence.toFixed(1)}% confidence
                  </div>
                </div>

                <div className="space-y-1">
                  {combo.factors.slice(0, 3).map((factor, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-600">{factor.name}:</span>
                      <span className="font-medium">{(factor.score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedCombination && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Combination {selectedCombination.combination}</h3>
                <button
                  onClick={() => setSelectedCombination(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {selectedCombination.combination.split('').join(' ')}
                  </div>
                  <div className="text-lg text-gray-600 mb-4">Rank #{selectedCombination.rank}</div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Score:</span>
                      <span className="font-bold">{(selectedCombination.totalScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-bold">{selectedCombination.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getRiskColor(selectedCombination.riskLevel)}`}>
                        {selectedCombination.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Factor Analysis</h4>
                  <div className="space-y-2">
                    {selectedCombination.factors.map((factor, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{factor.name}:</span>
                        <div className="text-right">
                          <div className="font-medium">{(factor.score * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">×{(factor.weight * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    ))}
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

export default LiveScoring;
