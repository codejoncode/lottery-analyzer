import React, { useState } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface SumsAnalysisProps {
  className?: string;
}

const SumsAnalysis: React.FC<SumsAnalysisProps> = ({ className = '' }) => {
  const [selectedSum, setSelectedSum] = useState<number | null>(null);
  const sumAnalyses = pick3Analyzer.getAllSumAnalyses();
  const selectedAnalysis = selectedSum ? sumAnalyses.find(a => a.sum === selectedSum) : null;

  return (
    <div className={`sums-analysis ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Pick 3 Sums Analysis</h2>
        <p className="text-gray-600">
          Analysis of all possible sums (0-27) with their straight and box combinations, plus winning odds.
        </p>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 mb-8">
        {sumAnalyses.map(analysis => (
          <div
            key={analysis.sum}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedSum === analysis.sum
                ? 'bg-blue-100 border-blue-500'
                : 'bg-white border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => setSelectedSum(selectedSum === analysis.sum ? null : analysis.sum)}
          >
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{analysis.sum}</div>
              <div className="text-sm text-gray-600">Straight: {analysis.straightCount}</div>
              <div className="text-sm text-gray-600">Box: {analysis.boxCount}</div>
              <div className="text-xs text-gray-500">Odds: {analysis.odds.toFixed(1)}:1</div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnalysis && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Sum {selectedAnalysis.sum} Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Straight Combinations ({selectedAnalysis.straightCount})</h4>
              <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                <div className="grid grid-cols-6 gap-2 text-sm">
                  {selectedAnalysis.straightCombinations.slice(0, 60).map((combo, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded text-center">
                      {combo}
                    </span>
                  ))}
                  {selectedAnalysis.straightCombinations.length > 60 && (
                    <span className="col-span-6 text-center text-gray-500">
                      ... and {selectedAnalysis.straightCombinations.length - 60} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Box Combinations ({selectedAnalysis.boxCount})</h4>
              <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                <div className="grid grid-cols-6 gap-2 text-sm">
                  {selectedAnalysis.boxCombinations.slice(0, 60).map((combo, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded text-center">
                      {combo}
                    </span>
                  ))}
                  {selectedAnalysis.boxCombinations.length > 60 && (
                    <span className="col-span-6 text-center text-gray-500">
                      ... and {selectedAnalysis.boxCombinations.length - 60} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-green-600">{selectedAnalysis.odds.toFixed(1)}:1</div>
              <div className="text-sm text-gray-600">Straight Odds</div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-blue-600">{(1000 / selectedAnalysis.straightCount).toFixed(1)}:1</div>
              <div className="text-sm text-gray-600">Box Odds</div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-purple-600">{(selectedAnalysis.straightCount / 1000 * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Probability</div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-orange-600">{selectedAnalysis.sum}</div>
              <div className="text-sm text-gray-600">Sum Value</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SumsAnalysis;
