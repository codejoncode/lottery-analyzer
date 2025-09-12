import React, { useState } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface SumLastDigitAnalysisProps {
  className?: string;
}

const SumLastDigitAnalysis: React.FC<SumLastDigitAnalysisProps> = ({ className = '' }) => {
  const [selectedLastDigit, setSelectedLastDigit] = useState<number | null>(null);
  const sumLastDigitAnalyses = pick3Analyzer.getAllSumLastDigitAnalyses();
  const selectedAnalysis = selectedLastDigit !== null ? sumLastDigitAnalyses.find(a => a.lastDigit === selectedLastDigit) : null;

  return (
    <div className={`sum-last-digit-analysis ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Pick 3 Sum Last Digit Analysis</h2>
        <p className="text-gray-600">
          Analysis of sum last digits (0-9) showing the final digit when the sum of three numbers is calculated.
          This reveals patterns in how sums distribute across the decimal system.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {sumLastDigitAnalyses.map(analysis => (
          <div
            key={analysis.lastDigit}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedLastDigit === analysis.lastDigit
                ? 'bg-purple-100 border-purple-500'
                : 'bg-white border-gray-300 hover:border-purple-300'
            }`}
            onClick={() => setSelectedLastDigit(selectedLastDigit === analysis.lastDigit ? null : analysis.lastDigit)}
          >
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{analysis.lastDigit}</div>
              <div className="text-sm text-gray-600">Count: {analysis.count}</div>
              <div className="text-xs text-gray-500">Prob: {(analysis.probability * 100).toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnalysis && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Sum Last Digit {selectedAnalysis.lastDigit} Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Sample Combinations ({selectedAnalysis.count})</h4>
              <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                <div className="grid grid-cols-6 gap-2 text-sm">
                  {selectedAnalysis.combinations.slice(0, 60).map((combo, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded text-center">
                      {combo}
                    </span>
                  ))}
                  {selectedAnalysis.combinations.length > 60 && (
                    <span className="col-span-6 text-center text-gray-500">
                      ... and {selectedAnalysis.combinations.length - 60} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Statistics</h4>
              <div className="bg-white p-4 rounded border">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Combinations:</span>
                    <span className="font-semibold">{selectedAnalysis.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Probability:</span>
                    <span className="font-semibold">{(selectedAnalysis.probability * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Odds:</span>
                    <span className="font-semibold">{(999 / selectedAnalysis.count).toFixed(1)}:1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Frequency:</span>
                    <span className="font-semibold">{(selectedAnalysis.count / 10).toFixed(1)} per digit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-3">Pattern Examples</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedAnalysis.combinations.slice(0, 8).map((combo, index) => {
                const [a, b, c] = combo.split('').map(Number);
                const sum = a + b + c;
                return (
                  <div key={index} className="bg-white p-3 rounded border text-center">
                    <div className="text-lg font-mono">{combo}</div>
                    <div className="text-sm text-gray-600">{a} + {b} + {c} = {sum}</div>
                    <div className="text-xs text-purple-600">Last digit: {sum % 10}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!selectedAnalysis && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">How Sum Last Digit Works</h3>
          <p className="text-gray-700 mb-4">
            The sum last digit is the final digit of the sum of the three numbers in a Pick 3 combination.
            For example, 1+2+3=6, so the last digit is 6. This analysis shows how these last digits are distributed.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded">
              <div className="font-semibold">Most Common</div>
              <div className="text-gray-600">Digits 0, 5, 6 appear most frequently</div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="font-semibold">Least Common</div>
              <div className="text-gray-600">Digits 1, 4 appear least frequently</div>
            </div>
            <div className="bg-white p-3 rounded">
              <div className="font-semibold">Perfect Distribution</div>
              <div className="text-gray-600">Would be ~100 combinations per digit</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SumLastDigitAnalysis;
