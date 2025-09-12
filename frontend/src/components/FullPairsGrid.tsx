import React, { useState, useMemo } from 'react';

const FullPairsGrid: React.FC = () => {
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [highlightMode, setHighlightMode] = useState<'none' | 'selected' | 'hot' | 'cold'>('none');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate all possible pairs (00-99)
  const allPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const pair = `${i}${j}`;
        pairs.push({
          pair,
          first: i,
          second: j,
          sum: i + j,
          isDouble: i === j,
          isConsecutive: Math.abs(i - j) === 1,
          isMirror: Math.abs(i - j) === 5
        });
      }
    }
    return pairs;
  }, []);

  const filteredPairs = useMemo(() => {
    if (!searchTerm) return allPairs;
    return allPairs.filter(p => p.pair.includes(searchTerm));
  }, [allPairs, searchTerm]);

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
    const total = allPairs.length;
    const selected = selectedPairs.size;
    const doubles = Array.from(selectedPairs).filter(pair => pair[0] === pair[1]).length;
    const consecutives = Array.from(selectedPairs).filter(pair => Math.abs(parseInt(pair[0]) - parseInt(pair[1])) === 1).length;
    const mirrors = Array.from(selectedPairs).filter(pair => Math.abs(parseInt(pair[0]) - parseInt(pair[1])) === 5).length;

    return {
      total,
      selected,
      doubles,
      consecutives,
      mirrors,
      selectionRate: total > 0 ? ((selected / total) * 100).toFixed(1) : '0.0'
    };
  }, [allPairs, selectedPairs]);

  const getCellColor = (pair: typeof allPairs[0]) => {
    if (highlightMode === 'selected' && selectedPairs.has(pair.pair)) {
      return 'bg-blue-500 text-white';
    }
    if (highlightMode === 'hot' && pair.isDouble) {
      return 'bg-red-400 text-white';
    }
    if (highlightMode === 'cold' && !pair.isDouble && !pair.isConsecutive) {
      return 'bg-blue-200 text-gray-800';
    }
    return selectedPairs.has(pair.pair) ? 'bg-blue-100 text-blue-800' : 'bg-white hover:bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">🔢 10×10 Full Pairs Grid</h3>
        <p className="text-gray-600">Complete grid of all possible Pick 3 pairs (00-99) with interactive selection and analysis</p>
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
              <option value="hot">Doubles</option>
              <option value="cold">Non-consecutive</option>
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
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{statistics.doubles}</div>
            <div className="text-xs text-green-800">Doubles</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{statistics.consecutives}</div>
            <div className="text-xs text-orange-800">Consecutive</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{statistics.mirrors}</div>
            <div className="text-xs text-purple-800">Mirrors</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-10 gap-0">
            {filteredPairs.map((pair) => (
              <button
                key={pair.pair}
                onClick={() => togglePair(pair.pair)}
                className={`p-2 border border-gray-200 text-center text-sm font-mono transition-colors ${getCellColor(pair)}`}
                title={`Pair: ${pair.pair}, Sum: ${pair.sum}${pair.isDouble ? ' (Double)' : ''}${pair.isConsecutive ? ' (Consecutive)' : ''}${pair.isMirror ? ' (Mirror)' : ''}`}
              >
                {pair.pair}
              </button>
            ))}
          </div>
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
            <div className="w-3 h-3 bg-orange-400 rounded"></div>
            <span>Consecutive (e.g., 01, 12)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-400 rounded"></div>
            <span>Mirrors (e.g., 05, 16)</span>
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

export default FullPairsGrid;
