import React, { useState } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';
import type { Pick3VTracAnalysis } from '../utils/pick3Analyzer';

interface VTracAnalysisProps {
  className?: string;
}

const VTracAnalysis: React.FC<VTracAnalysisProps> = ({ className = '' }) => {
  const [selectedVTrac, setSelectedVTrac] = useState<string | null>(null);
  const vtracAnalyses = pick3Analyzer.getAllVTracAnalyses();
  const selectedAnalysis = selectedVTrac ? vtracAnalyses.find(a => a.vtrac === selectedVTrac) : null;

  return (
    <div className={`vtrac-analysis ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Pick 3 VTrac Analysis</h2>
        <p className="text-gray-600">
          VTrac analysis shows mirror combinations where each digit is either the same or ±1 from the original.
          VTrac numbers range from 111 to 555, representing the mirrored digit patterns.
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        {vtracAnalyses.map(analysis => (
          <div
            key={analysis.vtrac}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedVTrac === analysis.vtrac
                ? 'bg-red-100 border-red-500'
                : 'bg-white border-gray-300 hover:border-red-300'
            }`}
            onClick={() => setSelectedVTrac(selectedVTrac === analysis.vtrac ? null : analysis.vtrac)}
          >
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{analysis.vtrac}</div>
              <div className="text-sm text-gray-600">Count: {analysis.count}</div>
              <div className="text-xs text-gray-500">Combinations: {analysis.combinations.length}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnalysis && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">VTrac {selectedAnalysis.vtrac} Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">VTrac Combinations ({selectedAnalysis.combinations.length})</h4>
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
              <h4 className="font-medium mb-2">Mirror Combinations ({selectedAnalysis.mirrorCombinations.length})</h4>
              <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                <div className="grid grid-cols-6 gap-2 text-sm">
                  {selectedAnalysis.mirrorCombinations.slice(0, 60).map((combo, index) => (
                    <span key={index} className="bg-red-100 px-2 py-1 rounded text-center">
                      {combo}
                    </span>
                  ))}
                  {selectedAnalysis.mirrorCombinations.length > 60 && (
                    <span className="col-span-6 text-center text-gray-500">
                      ... and {selectedAnalysis.mirrorCombinations.length - 60} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-3">VTrac Pattern Explanation</h4>
            <div className="bg-white p-4 rounded border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-mono font-bold">{selectedAnalysis.vtrac}</div>
                  <div className="text-sm text-gray-600">VTrac Number</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold">
                    {selectedAnalysis.combinations[0] || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Example Combination</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-bold">
                    {selectedAnalysis.mirrorCombinations[0] || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Mirror Combination</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-700">
                <p>
                  <strong>How VTrac works:</strong> Each digit in the VTrac number represents a "mirror" pair.
                  For example, VTrac 1 represents digits 0 and 1, VTrac 2 represents 1 and 2, etc.
                  A combination "belongs" to a VTrac if each of its digits falls within the corresponding mirror pair.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-red-600">{selectedAnalysis.count}</div>
              <div className="text-sm text-gray-600">Total Combinations</div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-blue-600">{selectedAnalysis.combinations.length}</div>
              <div className="text-sm text-gray-600">VTrac Combinations</div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-green-600">{selectedAnalysis.mirrorCombinations.length}</div>
              <div className="text-sm text-gray-600">Mirror Combinations</div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-lg font-semibold text-purple-600">{(selectedAnalysis.count / 1000 * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Probability</div>
            </div>
          </div>
        </div>
      )}

      {!selectedAnalysis && (
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Understanding VTrac</h3>
          <p className="text-gray-700 mb-4">
            VTrac is a lottery system that groups numbers into "mirror" pairs. Each VTrac digit represents
            two possible numbers: the digit itself and the next consecutive digit.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="bg-white p-3 rounded text-center">
              <div className="font-bold text-red-600">V1 = 0,1</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <div className="font-bold text-red-600">V2 = 1,2</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <div className="font-bold text-red-600">V3 = 2,3</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <div className="font-bold text-red-600">V4 = 3,4</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <div className="font-bold text-red-600">V5 = 4,5</div>
            </div>
          </div>
          <p className="text-gray-700 mt-4">
            For example, VTrac 123 represents combinations where the first digit is 0 or 1,
            the second digit is 1 or 2, and the third digit is 2 or 3.
          </p>
        </div>
      )}
    </div>
  );
};

export default VTracAnalysis;
