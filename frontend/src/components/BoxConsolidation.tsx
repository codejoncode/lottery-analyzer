import React, { useState, useMemo } from 'react';

interface Combination {
  straight: string;
  box: string;
  sum: number;
  rootSum: number;
  parityPattern: string;
  highLowPattern: string;
}

const BoxConsolidation: React.FC = () => {
  const [inputCombinations, setInputCombinations] = useState<string>('');

  const parsedCombinations = useMemo(() => {
    if (!inputCombinations.trim()) return [];

    const lines = inputCombinations.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      const sum = digits.reduce((a, b) => a + b, 0);
      const rootSum = sum % 9 || 9;
      const parityPattern = digits.map(d => d % 2 === 0 ? 'E' : 'O').join('');
      const highLowPattern = digits.map(d => d >= 5 ? 'H' : 'L').join('');
      const box = [...digits].sort().join('');

      return {
        straight: digits.join(''),
        box,
        sum,
        rootSum,
        parityPattern,
        highLowPattern
      } as Combination;
    }).filter(Boolean) as Combination[];
  }, [inputCombinations]);

  const uniqueBoxCombinations = useMemo(() => {
    const boxMap = new Map<string, Combination>();

    parsedCombinations.forEach(combo => {
      if (!boxMap.has(combo.box)) {
        boxMap.set(combo.box, combo);
      }
    });

    return Array.from(boxMap.values());
  }, [parsedCombinations]);

  const consolidationStats = useMemo(() => {
    const originalCount = parsedCombinations.length;
    const uniqueCount = uniqueBoxCombinations.length;
    const reduction = originalCount - uniqueCount;
    const reductionPercent = originalCount > 0 ? (reduction / originalCount * 100).toFixed(1) : '0.0';

    return {
      original: originalCount,
      unique: uniqueCount,
      reduction,
      reductionPercent
    };
  }, [parsedCombinations, uniqueBoxCombinations]);

  const typeBreakdown = useMemo(() => {
    const breakdown = {
      singles: 0,
      doubles: 0,
      triples: 0
    };

    uniqueBoxCombinations.forEach(combo => {
      const sorted = combo.box.split('');
      if (sorted[0] === sorted[1] && sorted[1] === sorted[2]) {
        breakdown.triples++;
      } else if (sorted[0] === sorted[1] || sorted[1] === sorted[2] || sorted[0] === sorted[2]) {
        breakdown.doubles++;
      } else {
        breakdown.singles++;
      }
    });

    return breakdown;
  }, [uniqueBoxCombinations]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">📦 Box Consolidation</h3>
        <p className="text-gray-600">Convert straight combinations to unique box combinations and analyze consolidation efficiency</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Combinations
            </label>
            <textarea
              value={inputCombinations}
              onChange={(e) => setInputCombinations(e.target.value)}
              placeholder="Enter Pick 3 combinations, one per line (e.g. 123, 456, 789)&#10;Non-numeric characters will be ignored"
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{consolidationStats.original}</div>
              <div className="text-sm text-blue-800">Original Combinations</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{consolidationStats.unique}</div>
              <div className="text-sm text-green-800">Unique Boxes</div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">
              {consolidationStats.reduction} combinations removed ({consolidationStats.reductionPercent}% reduction)
            </div>
            <div className="text-sm text-yellow-800">Consolidation Efficiency</div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Type Breakdown</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-600">{typeBreakdown.singles}</div>
                <div className="text-xs text-purple-800">Singles (6-way)</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-orange-600">{typeBreakdown.doubles}</div>
                <div className="text-xs text-orange-800">Doubles (3-way)</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-red-600">{typeBreakdown.triples}</div>
                <div className="text-xs text-red-800">Triples (1-way)</div>
              </div>
            </div>
          </div>

          {/* Sample Combinations */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Consolidated Combinations</h4>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {uniqueBoxCombinations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Enter combinations to see consolidation results
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {uniqueBoxCombinations.slice(0, 20).map((combo, index) => (
                    <div key={index} className="p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="font-mono text-lg font-bold text-gray-800">
                          {combo.straight}
                        </div>
                        <div className="text-sm text-gray-600">
                          Box: {combo.box}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span>Sum: {combo.sum}</span>
                        <span>Root: {combo.rootSum}</span>
                        <span>{combo.parityPattern}</span>
                        <span>{combo.highLowPattern}</span>
                      </div>
                    </div>
                  ))}
                  {uniqueBoxCombinations.length > 20 && (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      ... and {uniqueBoxCombinations.length - 20} more combinations
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxConsolidation;
