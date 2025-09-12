import React, { useState } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';
import type { Pick3RootSumAnalysis } from '../utils/pick3Analyzer';

interface RootSumsAnalysisProps {
  className?: string;
}

const RootSumsAnalysis: React.FC<RootSumsAnalysisProps> = ({ className = '' }) => {
  const [selectedRootSum, setSelectedRootSum] = useState<number | null>(null);
  const rootSumAnalyses = pick3Analyzer.getAllRootSumAnalyses();
  const selectedAnalysis = selectedRootSum ? rootSumAnalyses.find(a => a.rootSum === selectedRootSum) : null;

  return (
    <div className={`rootsums-analysis ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Pick 3 Root Sums Analysis</h2>
        <p className="text-gray-600">
          Analysis of digital root sums (0-9) with their straight and box combinations, plus winning odds.
          The digital root is calculated by summing digits repeatedly until a single digit is obtained.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {rootSumAnalyses.map(analysis => (
          <div
            key={analysis.rootSum}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedRootSum === analysis.rootSum
                ? 'bg-green-100 border-green-500'
                : 'bg-white border-gray-300 hover:border-green-300'
            }`}
            onClick={() => setSelectedRootSum(selectedRootSum === analysis.rootSum ? null : analysis.rootSum)}
          >
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{analysis.rootSum}</div>
              <div className="text-sm text-gray-600">Straight: {analysis.straightCount}</div>
              <div className="text-sm text-gray-600">Box: {analysis.boxCount}</div>
              <div className="text-xs text-gray-500">Odds: {analysis.odds.toFixed(1)}:1</div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnalysis && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Root Sum {selectedAnalysis.rootSum} Details</h3>
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
              <div className="text-lg font-semibold text-purple-600">{(selectedAnalysis.probability * 100).toFixed(2)}%</div>
              <div className="text-sm text-gray-600">Probability</div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-orange-600">{selectedAnalysis.rootSum}</div>
              <div className="text-sm text-gray-600">Root Sum</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RootSumsAnalysis;
