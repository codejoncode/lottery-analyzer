import React, { useState, useMemo } from 'react';

interface PairData {
  pair: string;
  frequency: number;
  lastSeen: number;
  skipCount: number;
  isHot: boolean;
  isCold: boolean;
}

const FrontSplitBackGrids: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'front' | 'split' | 'back'>('front');
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [highlightMode, setHighlightMode] = useState<'none' | 'hot' | 'cold' | 'selected'>('none');

  // Generate pair data for each position type
  const generatePairData = (position: 'front' | 'split' | 'back'): PairData[] => {
    const pairs = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const pair = `${i}${j}`;
        const frequency = Math.floor(Math.random() * 50) + 1; // Mock frequency data
        const lastSeen = Math.floor(Math.random() * 30); // Mock days since last seen
        const skipCount = Math.floor(Math.random() * 10); // Mock skip count

        pairs.push({
          pair,
          frequency,
          lastSeen,
          skipCount,
          isHot: frequency > 25,
          isCold: lastSeen > 15
        });
      }
    }
    return pairs.sort((a, b) => b.frequency - a.frequency);
  };

  const frontPairs = useMemo(() => generatePairData('front'), []);
  const splitPairs = useMemo(() => generatePairData('split'), []);
  const backPairs = useMemo(() => generatePairData('back'), []);

  const currentPairs = useMemo(() => {
    switch (activeTab) {
      case 'front': return frontPairs;
      case 'split': return splitPairs;
      case 'back': return backPairs;
      default: return frontPairs;
    }
  }, [activeTab, frontPairs, splitPairs, backPairs]);

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
    const hot = currentPairs.filter(p => p.isHot).length;
    const cold = currentPairs.filter(p => p.isCold).length;
    const selected = selectedPairs.size;
    const avgFrequency = currentPairs.reduce((sum, p) => sum + p.frequency, 0) / currentPairs.length;

    return {
      total: currentPairs.length,
      hot,
      cold,
      selected,
      avgFrequency: avgFrequency.toFixed(1),
      hotPercentage: ((hot / currentPairs.length) * 100).toFixed(1),
      coldPercentage: ((cold / currentPairs.length) * 100).toFixed(1)
    };
  }, [currentPairs, selectedPairs]);

  const getCellColor = (pair: PairData) => {
    if (highlightMode === 'selected' && selectedPairs.has(pair.pair)) {
      return 'bg-blue-500 text-white';
    }
    if (highlightMode === 'hot' && pair.isHot) {
      return 'bg-red-400 text-white';
    }
    if (highlightMode === 'cold' && pair.isCold) {
      return 'bg-blue-300 text-white';
    }
    return selectedPairs.has(pair.pair) ? 'bg-blue-100 text-blue-800' : 'bg-white hover:bg-gray-50';
  };

  const getPositionTitle = () => {
    switch (activeTab) {
      case 'front': return 'Front Pairs (Positions 1-2)';
      case 'split': return 'Split Pairs (Positions 1-3)';
      case 'back': return 'Back Pairs (Positions 2-3)';
      default: return '';
    }
  };

  const getPositionDescription = () => {
    switch (activeTab) {
      case 'front': return 'Analysis of pairs formed by the first two digits';
      case 'split': return 'Analysis of pairs formed by first and third digits';
      case 'back': return 'Analysis of pairs formed by the last two digits';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">📊 Front/Split/Back Pairs Analysis</h3>
        <p className="text-gray-600">Analyze pair patterns across different positions in Pick 3 combinations</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'front', label: 'Front Pairs', count: frontPairs.filter(p => p.isHot).length },
            { id: 'split', label: 'Split Pairs', count: splitPairs.filter(p => p.isHot).length },
            { id: 'back', label: 'Back Pairs', count: backPairs.filter(p => p.isHot).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count} hot)
            </button>
          ))}
        </div>
      </div>

      {/* Position Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-1">{getPositionTitle()}</h4>
        <p className="text-sm text-gray-600">{getPositionDescription()}</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Highlight:</label>
          <select
            value={highlightMode}
            onChange={(e) => setHighlightMode(e.target.value as typeof highlightMode)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="none">None</option>
            <option value="selected">Selected</option>
            <option value="hot">Hot Pairs</option>
            <option value="cold">Cold Pairs</option>
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
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-600">{statistics.selected}</div>
          <div className="text-xs text-blue-800">Selected</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-red-600">{statistics.hot}</div>
          <div className="text-xs text-red-800">Hot Pairs</div>
        </div>
        <div className="bg-blue-300 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-800">{statistics.cold}</div>
          <div className="text-xs text-blue-600">Cold Pairs</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-green-600">{statistics.avgFrequency}</div>
          <div className="text-xs text-green-800">Avg Frequency</div>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div className="max-h-80 overflow-y-auto">
          <div className="grid grid-cols-10 gap-0">
            {currentPairs.map((pair) => (
              <button
                key={pair.pair}
                onClick={() => togglePair(pair.pair)}
                className={`p-2 border border-gray-200 text-center text-xs font-mono transition-colors ${getCellColor(pair)}`}
                title={`${pair.pair}: Freq=${pair.frequency}, Last=${pair.lastSeen}d, Skip=${pair.skipCount}`}
              >
                <div className="font-bold">{pair.pair}</div>
                <div className="text-xs opacity-75">{pair.frequency}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pairs Table */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Top 10 {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Pairs</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skip Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPairs.slice(0, 10).map((pair) => (
                <tr key={pair.pair} className={selectedPairs.has(pair.pair) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                    {pair.pair}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {pair.frequency}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {pair.lastSeen} days
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {pair.skipCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      pair.isHot ? 'bg-red-100 text-red-800' :
                      pair.isCold ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pair.isHot ? 'Hot' : pair.isCold ? 'Cold' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Pairs */}
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
            <span>Hot (High frequency)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <span>Cold (Long time since last seen)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontSplitBackGrids;
