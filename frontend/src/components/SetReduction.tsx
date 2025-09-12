import React, { useState } from 'react';

interface Combination {
  straight: string;
  box: string;
  sum: number;
  rootSum: number;
  parityPattern: string;
  highLowPattern: string;
}

interface SetReductionProps {
  combinations: Combination[];
}

const SetReduction: React.FC<SetReductionProps> = ({ combinations }) => {
  const [sortBy, setSortBy] = useState<'straight' | 'box' | 'sum' | 'rootSum'>('straight');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDetails, setShowDetails] = useState(false);

  const sortedCombinations = React.useMemo(() => {
    return [...combinations].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'straight':
          aValue = a.straight;
          bValue = b.straight;
          break;
        case 'box':
          aValue = a.box;
          bValue = b.box;
          break;
        case 'sum':
          aValue = a.sum;
          bValue = b.sum;
          break;
        case 'rootSum':
          aValue = a.rootSum;
          bValue = b.rootSum;
          break;
        default:
          aValue = a.straight;
          bValue = b.straight;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  }, [combinations, sortBy, sortOrder]);

  const statistics = React.useMemo(() => {
    if (combinations.length === 0) return null;

    const sums = combinations.map(c => c.sum);
    const rootSums = combinations.map(c => c.rootSum);

    return {
      count: combinations.length,
      sumRange: {
        min: Math.min(...sums),
        max: Math.max(...sums),
        avg: (sums.reduce((a, b) => a + b, 0) / sums.length).toFixed(1)
      },
      rootSumDistribution: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(root => ({
        root,
        count: rootSums.filter(r => r === root).length,
        percentage: ((rootSums.filter(r => r === root).length / combinations.length) * 100).toFixed(1)
      })),
      typeBreakdown: {
        singles: combinations.filter(c => {
          const sorted = c.box.split('');
          return sorted[0] !== sorted[1] && sorted[1] !== sorted[2] && sorted[0] !== sorted[2];
        }).length,
        doubles: combinations.filter(c => {
          const sorted = c.box.split('');
          return (sorted[0] === sorted[1] && sorted[1] !== sorted[2]) ||
                 (sorted[1] === sorted[2] && sorted[0] !== sorted[1]) ||
                 (sorted[0] === sorted[2] && sorted[0] !== sorted[1]);
        }).length,
        triples: combinations.filter(c => {
          const sorted = c.box.split('');
          return sorted[0] === sorted[1] && sorted[1] === sorted[2];
        }).length
      }
    };
  }, [combinations]);

  const exportResults = () => {
    const data = sortedCombinations.map(combo => combo.straight).join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reduced-combinations.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (combinations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Set Reduction</h3>
          <p className="text-gray-600">No combinations to display. Apply filters or add combinations first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">📊 Set Reduction</h3>
        <p className="text-gray-600">View and export your filtered combination set with detailed statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Statistics Cards */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{statistics?.count}</div>
          <div className="text-sm text-blue-800">Total Combinations</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {statistics?.sumRange.min} - {statistics?.sumRange.max}
          </div>
          <div className="text-sm text-green-800">Sum Range (Avg: {statistics?.sumRange.avg})</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-xl font-bold text-purple-600">
            {statistics ? statistics.typeBreakdown.singles + statistics.typeBreakdown.doubles + statistics.typeBreakdown.triples : 0}
          </div>
          <div className="text-sm text-purple-800">Unique Combinations</div>
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Combination Types</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-purple-600">{statistics?.typeBreakdown.singles}</div>
            <div className="text-xs text-purple-800">Singles (6-way)</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-orange-600">{statistics?.typeBreakdown.doubles}</div>
            <div className="text-xs text-orange-800">Doubles (3-way)</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">{statistics?.typeBreakdown.triples}</div>
            <div className="text-xs text-red-800">Triples (1-way)</div>
          </div>
        </div>
      </div>

      {/* Root Sum Distribution */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Root Sum Distribution</h4>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {statistics?.rootSumDistribution.map(({ root, count, percentage }) => (
            <div key={root} className="bg-gray-50 p-2 rounded text-center">
              <div className="text-sm font-bold text-gray-700">{root}</div>
              <div className="text-xs text-gray-600">{count} ({percentage}%)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="straight">Straight</option>
            <option value="box">Box</option>
            <option value="sum">Sum</option>
            <option value="rootSum">Root Sum</option>
          </select>
        </div>

        <button
          onClick={() => toggleSort(sortBy)}
          className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showDetails}
            onChange={(e) => setShowDetails(e.target.checked)}
          />
          <span className="text-sm text-gray-700">Show Details</span>
        </label>

        <button
          onClick={exportResults}
          className="px-4 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
        >
          Export Results
        </button>
      </div>

      {/* Combinations Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {sortedCombinations.map((combo, index) => (
              <div key={index} className="p-3 hover:bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-mono text-lg font-bold text-gray-800">
                    {combo.straight}
                  </div>
                  <div className="text-sm text-gray-600">
                    Box: {combo.box}
                  </div>
                </div>

                {showDetails && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                    <div className="bg-blue-50 px-2 py-1 rounded">
                      <span className="font-medium">Sum:</span> {combo.sum}
                    </div>
                    <div className="bg-green-50 px-2 py-1 rounded">
                      <span className="font-medium">Root:</span> {combo.rootSum}
                    </div>
                    <div className="bg-purple-50 px-2 py-1 rounded font-mono">
                      <span className="font-medium">Parity:</span> {combo.parityPattern}
                    </div>
                    <div className="bg-orange-50 px-2 py-1 rounded font-mono">
                      <span className="font-medium">H/L:</span> {combo.highLowPattern}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {sortedCombinations.length > 50 && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Showing all {sortedCombinations.length} combinations
        </div>
      )}
    </div>
  );
};

export default SetReduction;
