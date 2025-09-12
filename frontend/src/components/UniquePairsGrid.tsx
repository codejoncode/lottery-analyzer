import React, { useState, useMemo } from 'react';

const UniquePairsGrid: React.FC = () => {
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [highlightMode, setHighlightMode] = useState<'none' | 'selected' | 'doubles' | 'low' | 'high'>('none');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate unique pairs (unordered) in 5x9 grid
  const uniquePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < 10; i++) {
      for (let j = i; j < 10; j++) {
        const pair = i <= j ? `${i}${j}` : `${j}${i}`;
        pairs.push({
          pair,
          first: Math.min(i, j),
          second: Math.max(i, j),
          sum: i + j,
          isDouble: i === j,
          difference: Math.abs(i - j),
          isLow: i + j <= 9,
          isHigh: i + j >= 15,
          isMedium: i + j > 9 && i + j < 15
        });
      }
    }
    return pairs;
  }, []);

  const filteredPairs = useMemo(() => {
    if (!searchTerm) return uniquePairs;
    return uniquePairs.filter(p => p.pair.includes(searchTerm));
  }, [uniquePairs, searchTerm]);

  const togglePair = (pair: string) => {
    const newSelected = new Set(selectedPairs);
    if (newSelected.has(pair)) {
      newSelected.delete(pair);
    } else {
      newSelected.add(pair);
    }
    setSelectedPairs(newSelected);
  };

  const clearSelection = () => setSelectedPairs(new Set());

  const statistics = useMemo(() => {
    const total = uniquePairs.length;
    const selected = selectedPairs.size;
    const doubles = Array.from(selectedPairs).filter(pair => pair[0] === pair[1]).length;
    const lowSum = Array.from(selectedPairs).filter(pair => {
      const [a, b] = pair.split('').map(Number);
      return a + b <= 9;
    }).length;
    const highSum = Array.from(selectedPairs).filter(pair => {
      const [a, b] = pair.split('').map(Number);
      return a + b >= 15;
    }).length;

    return {
      total,
      selected,
      doubles,
      lowSum,
      highSum,
      selectionRate: total > 0 ? ((selected / total) * 100).toFixed(1) : '0.0'
    };
  }, [uniquePairs, selectedPairs]);

  const getCellColor = (pair: typeof uniquePairs[0]) => {
    if (highlightMode === 'selected' && selectedPairs.has(pair.pair)) {
      return 'bg-blue-500 text-white';
    }
    if (highlightMode === 'doubles' && pair.isDouble) {
      return 'bg-red-400 text-white';
    }
    if (highlightMode === 'low' && pair.isLow) {
      return 'bg-green-400 text-white';
    }
    if (highlightMode === 'high' && pair.isHigh) {
      return 'bg-purple-400 text-white';
    }
    return selectedPairs.has(pair.pair) ? 'bg-blue-100 text-blue-800' : 'bg-white hover:bg-gray-50';
  };

  // Create 5x9 grid layout
  const gridLayout = useMemo(() => {
    const rows = [];
    let pairIndex = 0;

    for (let row = 0; row < 5; row++) {
      const rowPairs = [];
      for (let col = 0; col < 9; col++) {
        if (pairIndex < filteredPairs.length) {
          rowPairs.push(filteredPairs[pairIndex]);
          pairIndex++;
        }
      }
      rows.push(rowPairs);
    }

    return rows;
  }, [filteredPairs]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">🎯 5×9 Unique Pairs Grid</h3>
        <p className="text-gray-600">Unique pairs grid showing unordered combinations with sum-based analysis</p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter pairs..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Highlight:</label>
            <select
              value={highlightMode}
              onChange={(e) => setHighlightMode(e.target.value as typeof highlightMode)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="none">None</option>
              <option value="selected">Selected</option>
              <option value="doubles">Doubles</option>
              <option value="low">Low Sum (≤9)</option>
              <option value="high">High Sum (≥15)</option>
            </select>
          </div>

          <button
            onClick={clearSelection}
            className="px-4 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
          >
            Clear Selection
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{statistics.selected}</div>
            <div className="text-xs text-blue-800">Selected Pairs</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-red-600">{statistics.doubles}</div>
            <div className="text-xs text-red-800">Doubles</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{statistics.lowSum}</div>
            <div className="text-xs text-green-800">Low Sum (≤9)</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{statistics.highSum}</div>
            <div className="text-xs text-purple-800">High Sum (≥15)</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div className="max-h-80 overflow-y-auto">
          <div className="inline-block min-w-full">
            {gridLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((pair, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => togglePair(pair.pair)}
                    className={`w-16 h-12 border border-gray-200 text-center text-sm font-mono transition-colors ${getCellColor(pair)}`}
                    title={`Pair: ${pair.pair}, Sum: ${pair.sum}${pair.isDouble ? ' (Double)' : ''}${pair.isLow ? ' (Low)' : ''}${pair.isHigh ? ' (High)' : ''}`}
                  >
                    {pair.pair}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sum Distribution */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Sum Distribution</h4>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-1 text-xs">
          {Array.from({ length: 19 }, (_, i) => i).map(sum => {
            const count = uniquePairs.filter(p => p.sum === sum).length;
            const percentage = ((count / uniquePairs.length) * 100).toFixed(1);
            return (
              <div key={sum} className="text-center">
                <div className="font-medium">{sum}</div>
                <div className="text-gray-600">{count} ({percentage}%)</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Pairs List */}
      {selectedPairs.size > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Selected Pairs ({selectedPairs.size})</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedPairs).sort().map(pair => (
              <span
                key={pair}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono bg-blue-100 text-blue-800"
              >
                {pair}
                <button
                  onClick={() => togglePair(pair)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>Doubles (e.g., 00, 11)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Low Sum (≤9)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-400 rounded"></div>
            <span>High Sum (≥15)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniquePairsGrid;
