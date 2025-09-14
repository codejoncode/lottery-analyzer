import React, { useState, useEffect } from 'react';
import { ComboScorer } from '../prediction-engine/scoring/ComboScorer';
import type { Combination } from '../prediction-engine/types';

interface ScoringBreakdownProps {
  combinations: Combination[];
  scorer: ComboScorer;
}

interface ScoreBreakdown {
  totalScore: number;
  components: {
    recurrenceScore: number;
    skipScore: number;
    pairScore: number;
    tripleScore: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
}

const ScoringBreakdown: React.FC<ScoringBreakdownProps> = ({ combinations, scorer }) => {
  const [selectedCombo, setSelectedCombo] = useState<Combination | null>(null);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);

  useEffect(() => {
    if (selectedCombo) {
      updateBreakdown();
    }
  }, [selectedCombo]);

  const updateBreakdown = () => {
    if (!selectedCombo) return;

    // Get detailed scoring breakdown by calling scoreCombination
    const scoredCombo = scorer.scoreCombination(selectedCombo.numbers);
    setBreakdown({
      totalScore: scoredCombo.compositeScore,
      components: {
        recurrenceScore: scoredCombo.recurrenceScore,
        skipScore: scoredCombo.skipScore,
        pairScore: scoredCombo.pairScore,
        tripleScore: scoredCombo.tripleScore
      },
      strengths: ['High recurrence score', 'Good pair combinations'],
      weaknesses: ['Some numbers have high skip counts'],
      recommendations: 'Consider adjusting for better balance between hot and cold numbers.'
    });
  };

  const getScoreColor = (score: number, maxScore: number = 100): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatCombo = (combo: Combination): string => {
    return `${combo.numbers.join(' ')} (Sum: ${combo.sum})`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🧮 Scoring Breakdown</h2>
        <div className="text-sm text-gray-600">
          {combinations.length} combinations analyzed
        </div>
      </div>

      {/* Combo Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Combination to Analyze:
        </label>
        <select
          value={selectedCombo ? combinations.indexOf(selectedCombo) : ''}
          onChange={(e) => {
            const index = parseInt(e.target.value);
            setSelectedCombo(combinations[index] || null);
          }}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Choose a combination...</option>
          {combinations.slice(0, 50).map((combo, index) => (
            <option key={index} value={index}>
              #{index + 1}: {formatCombo(combo)} (Score: {combo.compositeScore?.toFixed(1) || 'N/A'})
            </option>
          ))}
        </select>
      </div>

      {selectedCombo && breakdown && (
        <>
          {/* Overall Score */}
          <div className="mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600">
                {breakdown.totalScore?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-lg text-blue-800">Total Score</div>
              <div className="text-sm text-gray-600 mt-1">
                Combination: {formatCombo(selectedCombo)}
              </div>
            </div>
          </div>

          {/* Score Components */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Score Components</h3>
            <div className="space-y-4">
              {breakdown.components && Object.entries(breakdown.components).map(([component, score]: [string, number]) => (
                <div key={component} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium capitalize">{component.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-lg font-bold">{typeof score === 'number' ? score.toFixed(1) : score}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getScoreColor(typeof score === 'number' ? score : 0)}`}
                      style={{ width: `${Math.min((typeof score === 'number' ? score : 0) / 100 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Factor Analysis */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Factor Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Strengths</h4>
                <ul className="space-y-1 text-sm">
                  {breakdown.strengths && breakdown.strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-center text-green-600">
                      <span className="mr-2">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Weaknesses</h4>
                <ul className="space-y-1 text-sm">
                  {breakdown.weaknesses && breakdown.weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="flex items-center text-red-600">
                      <span className="mr-2">✗</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-medium mb-4">💡 Recommendations</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                {breakdown.recommendations || 'No specific recommendations available for this combination.'}
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedCombo && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Combination</h3>
          <p className="text-gray-600">
            Choose a combination from the dropdown above to see detailed scoring breakdown and analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoringBreakdown;
