import React, { useState, useEffect } from 'react';
import './Pick3ScoringEngine.css';

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

interface Pick3ScoringEngineProps {
  _historicalDraws?: string[];
  targetDraws?: number;
}

const Pick3ScoringEngine: React.FC<Pick3ScoringEngineProps> = ({
  _historicalDraws = [],
  targetDraws = 10
}) => {
  // Removed unused 'analyzer' variable
  const [topCombinations, setTopCombinations] = useState<CombinationScore[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<CombinationScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
    // Simulate column engine prediction score
    const digits = combo.split('').map(Number);
    let score = 0;
    digits.forEach((digit, pos) => {
      // Higher score for digits in optimal column positions
      const positionBonus = [0.8, 0.9, 0.7][pos] || 0.5;
      score += (digit / 9) * positionBonus;
    });
    return Math.min(score / 3, 1);
  };

  const calculateSkipScore = (combo: string): number => {
    // Simulate skip tracker analysis
    const digits = combo.split('').map(Number);
    let score = 0;
    digits.forEach(_digit => {
      // Prefer digits that are "due" (higher skip counts)
      const skipFactor = Math.random() * 0.5 + 0.5; // Mock skip analysis
      score += skipFactor;
    });
    return Math.min(score / 3, 1);
  };

  const calculatePairScore = (combo: string): number => {
    // Simulate pairs analysis coverage
    const pairs = [
      combo.slice(0, 2), // Front pair
      combo.slice(1, 3), // Back pair
      combo[0] + combo[2]  // Split pair
    ];
    let score = 0;
    pairs.forEach(_pair => {
      // Higher score for pairs that appear frequently
      const pairFrequency = Math.random() * 0.7 + 0.3;
      score += pairFrequency;
    });
    return Math.min(score / 3, 1);
  };

  const calculatePatternScore = (combo: string): number => {
    // Simulate Inspector3 pattern matching
    const digits = combo.split('').map(Number);
    const sum = digits.reduce((a, b) => a + b, 0);
    const isEven = digits.filter(d => d % 2 === 0).length;
    const isHigh = digits.filter(d => d >= 5).length;

    // Score based on pattern consistency
    let patternScore = 0;
    if (sum >= 10 && sum <= 16) patternScore += 0.4; // Good sum range
    if (isEven >= 1 && isEven <= 2) patternScore += 0.3; // Balanced even/odd
    if (isHigh >= 1 && isHigh <= 2) patternScore += 0.3; // Balanced high/low

    return Math.min(patternScore, 1);
  };

  const calculateSumScore = (combo: string): number => {
    const digits = combo.split('').map(Number);
    const sum = digits.reduce((a, b) => a + b, 0);
    // Optimal sum ranges: 10-16 for Pick 3
    if (sum >= 10 && sum <= 16) return 1.0;
    if (sum >= 7 && sum <= 19) return 0.7;
    return 0.3;
  };

  const calculateVTracScore = (combo: string): number => {
    // VTrac scoring based on pattern consistency
    const digits = combo.split('').map(Number);
    const vtracSum = digits.map(d => d + 5).reduce((a, b) => a + b, 0);
    // Prefer VTrac sums in optimal ranges
    if (vtracSum >= 15 && vtracSum <= 21) return 1.0;
    if (vtracSum >= 12 && vtracSum <= 24) return 0.7;
    return 0.4;
  };

  const calculateDeflateScore = (combo: string): number => {
    // Simulate deflate filter efficiency
    const digits = combo.split('').map(Number);
    const uniqueDigits = new Set(digits).size;
    // Prefer combinations that pass multiple filters
    let filterScore = 0.5; // Base score
    if (uniqueDigits >= 2) filterScore += 0.2; // Passes duplicate filter
    if (digits.some(d => d >= 5)) filterScore += 0.15; // Has high digits
    if (digits.some(d => d <= 4)) filterScore += 0.15; // Has low digits
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
    const confidence = Math.min(totalScore * 100, 95); // Max 95% confidence

    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (totalScore >= 0.7) riskLevel = 'low';
    else if (totalScore <= 0.4) riskLevel = 'high';

    return {
      combination: combo,
      totalScore,
      factors,
      rank: 0, // Will be set after sorting
      confidence,
      riskLevel
    };
  };

  const generateTopCombinations = () => {
    setLoading(true);

    // Generate all possible combinations and score them
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

    // Sort by total score and take top combinations
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

  return (
    <div className="scoring-engine-container max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="page-title">🎯 Pick 3 Scoring Engine</h2>
        <p className="page-subtitle">
          Advanced composite scoring system combining 7 weighted factors for optimal combination prediction
        </p>
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      </div>

      {/* Scoring Factors Overview */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Scoring Factors</h3>
        <div className="scoring-factors-grid">
          {SCORING_FACTORS.map((factor, index) => (
            <div key={index} className="factor-card">
              <div className="factor-header">
                <h4 className="factor-name">{factor.name}</h4>
                <span className="factor-weight">{(factor.weight * 100).toFixed(0)}%</span>
              </div>
              <p className="factor-description">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Combinations */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Top {targetDraws} Combinations</h3>
          <button
            onClick={generateTopCombinations}
            disabled={loading}
            className="refresh-button"
          >
            {loading ? '🔄 Calculating...' : '🔄 Refresh Scores'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto"></div>
            <p className="mt-4 text-gray-600">Calculating optimal combinations...</p>
          </div>
        ) : (
          <div className="combinations-grid">
            {topCombinations.map((combo) => (
              <div
                key={combo.combination}
                className="combination-card"
                onClick={() => setSelectedCombination(combo)}
              >
                <div className="combination-rank">#{combo.rank}</div>
                <div className="flex justify-between items-center mb-2">
                  <span></span>
                  <span className={`risk-badge risk-${combo.riskLevel}`}>
                    {combo.riskLevel.toUpperCase()} RISK
                  </span>
                </div>

                <div className="text-center mb-3">
                  <div className="combination-digits">
                    {combo.combination.split('').join(' ')}
                  </div>
                  <div className={`score-display score-${combo.totalScore >= 0.7 ? 'high' : combo.totalScore >= 0.5 ? 'medium' : 'low'}`}>
                    {(combo.totalScore * 100).toFixed(1)}% Score
                  </div>
                  <div className="confidence-display">
                    {combo.confidence.toFixed(1)}% Confidence
                  </div>
                </div>

                <div className="factor-breakdown">
                  {combo.factors.slice(0, 3).map((factor, idx) => (
                    <div key={idx} className="factor-item">
                      <span className="factor-label">{factor.name}:</span>
                      <span className="factor-value">{(factor.score * 100).toFixed(0)}%</span>
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Combination {selectedCombination.combination}</h3>
              <button
                onClick={() => setSelectedCombination(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="analysis-grid">
                <div>
                  <div className="text-center mb-4">
                    <div className="large-digits">
                      {selectedCombination.combination.split('').join(' ')}
                    </div>
                    <div className="text-xl font-semibold text-gray-800">
                      Rank #{selectedCombination.rank}
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Total Score:</span>
                      <span className="stat-value">{(selectedCombination.totalScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Confidence:</span>
                      <span className="stat-value">{selectedCombination.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Risk Level:</span>
                      <span className={`risk-badge risk-${selectedCombination.riskLevel}`}>
                        {selectedCombination.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Analysis Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedCombination.factors.map((factor, idx) => (
                      <div key={idx} className="flex justify-between items-center">
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

              <div className="scoring-breakdown">
                <h4 className="font-semibold mb-2">Scoring Breakdown</h4>
                <div className="space-y-2">
                  {selectedCombination.factors.map((factor, idx) => (
                    <div key={idx} className="breakdown-item">
                      <div className="breakdown-header">
                        <span className="breakdown-name">{factor.name}</span>
                        <span className="breakdown-score">{factor.details}</span>
                      </div>
                      <p className="breakdown-description">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pick3ScoringEngine;
