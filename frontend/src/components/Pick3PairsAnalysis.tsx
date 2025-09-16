import React, { useState, useEffect } from 'react';
import { pick3DataManager, type Pick3Draw } from '../services/Pick3DataManager';

interface Pick3Pair {
  numbers: [number, number];
  key: string;
  lastSeen: number; // draws since last occurrence
  totalSkips: number; // total draws this pair has been out
  lastSkipCount: number; // how many draws it was out before last hit
  position: 'hundreds' | 'tens' | 'units' | 'any';
}

interface ColumnPairStats {
  position: 'hundreds' | 'tens' | 'units';
  pairs: Pick3Pair[];
  hotPairs: Pick3Pair[];
  coldPairs: Pick3Pair[];
  duePairs: Pick3Pair[];
}

const Pick3PairsAnalysis: React.FC = () => {
  const [draws, setDraws] = useState<Pick3Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'all' | 'hundreds' | 'tens' | 'units'>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hot' | 'cold' | 'due'>('all');
  const [columnStats, setColumnStats] = useState<ColumnPairStats[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const allDraws = pick3DataManager.getDraws();
      // Sort from newest to oldest for analysis
      const sortedDraws = allDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDraws(sortedDraws);
      analyzePairs(sortedDraws);
      setLoading(false);
    } catch (error) {
      console.error('Error loading Pick 3 data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const analyzePairs = (draws: Pick3Draw[]) => {
    const columnStats: ColumnPairStats[] = [
      { position: 'hundreds', pairs: [], hotPairs: [], coldPairs: [], duePairs: [] },
      { position: 'tens', pairs: [], hotPairs: [], coldPairs: [], duePairs: [] },
      { position: 'units', pairs: [], hotPairs: [], coldPairs: [], duePairs: [] }
    ];

    // Initialize pair tracking for each position
    columnStats.forEach(col => {
      for (let i = 0; i <= 9; i++) {
        for (let j = 0; j <= 9; j++) {
          if (i !== j) { // Only track different digit pairs
            const pair: Pick3Pair = {
              numbers: [i, j],
              key: `${i}-${j}`,
              lastSeen: -1,
              totalSkips: 0,
              lastSkipCount: 0,
              position: col.position
            };
            col.pairs.push(pair);
          }
        }
      }
    });

    // Analyze draws from oldest to newest
    const chronologicalDraws = [...draws].reverse();

    chronologicalDraws.forEach((draw, drawIndex) => {
      const midday = draw.midday;
      const evening = draw.evening;

      [midday, evening].forEach(drawType => {
        if (!drawType) return;

        const digits = drawType.split('').map(d => parseInt(d));

        // Check each position for pairs
        digits.forEach((digit, posIndex) => {
          const colIndex = posIndex;

          // Look for pairs with other digits in the same number
          for (let otherPos = 0; otherPos < digits.length; otherPos++) {
            if (otherPos !== posIndex) {
              const otherDigit = digits[otherPos];
              if (digit !== otherDigit) {
                const pairKey = digit < otherDigit ? `${digit}-${otherDigit}` : `${otherDigit}-${digit}`;
                const pair = columnStats[colIndex].pairs.find(p => p.key === pairKey);

                if (pair) {
                  if (pair.lastSeen === -1) {
                    // First time seeing this pair
                    pair.lastSeen = drawIndex;
                    pair.lastSkipCount = 0;
                  } else {
                    // Update skip information
                    const skips = drawIndex - pair.lastSeen - 1;
                    pair.totalSkips += skips;
                    pair.lastSkipCount = skips;
                    pair.lastSeen = drawIndex;
                  }
                }
              }
            }
          }
        });
      });
    });

    // Categorize pairs
    columnStats.forEach(col => {
      col.pairs.forEach(pair => {
        if (pair.lastSeen === -1) {
          // Pair never appeared
          col.coldPairs.push(pair);
        } else {
          const avgSkips = pair.totalSkips / (pair.lastSeen + 1);

          if (pair.lastSkipCount >= 10) {
            col.duePairs.push(pair);
          } else if (avgSkips <= 3) {
            col.hotPairs.push(pair);
          } else if (pair.lastSkipCount >= 5) {
            col.coldPairs.push(pair);
          }
        }
      });
    });

    setColumnStats(columnStats);
  };

  const getFilteredPairs = (position: 'hundreds' | 'tens' | 'units') => {
    const colStat = columnStats.find(c => c.position === position);
    if (!colStat) return [];

    switch (selectedFilter) {
      case 'hot':
        return colStat.hotPairs;
      case 'cold':
        return colStat.coldPairs;
      case 'due':
        return colStat.duePairs;
      default:
        return colStat.pairs;
    }
  };

  const renderPairCard = (pair: Pick3Pair) => {
    const positionColors = {
      hundreds: 'bg-blue-100 text-blue-800 border-blue-200',
      tens: 'bg-green-100 text-green-800 border-green-200',
      units: 'bg-purple-100 text-purple-800 border-purple-200',
      any: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const isHot = pair.lastSkipCount <= 2;
    const isCold = pair.lastSkipCount >= 8;
    const isDue = pair.lastSkipCount >= 10;

    return (
      <div key={pair.key} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${positionColors[pair.position]}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {pair.numbers[0]}
            </span>
            <span className="text-gray-600 font-bold text-lg">-</span>
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {pair.numbers[1]}
            </span>
          </div>
          <div className="flex gap-1">
            {isHot && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Hot</span>}
            {isCold && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Cold</span>}
            {isDue && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Due</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <div className="text-gray-600">Last Seen</div>
            <div className="font-semibold">{pair.lastSeen === -1 ? 'Never' : `${pair.lastSeen} draws`}</div>
          </div>
          <div>
            <div className="text-gray-600">Last Skip</div>
            <div className="font-semibold">{pair.lastSkipCount}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Skips</div>
            <div className="font-semibold">{pair.totalSkips}</div>
          </div>
          <div>
            <div className="text-gray-600">Avg Skips</div>
            <div className="font-semibold">{pair.lastSeen > 0 ? (pair.totalSkips / (pair.lastSeen + 1)).toFixed(1) : 'N/A'}</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center capitalize font-medium">
          {pair.position} Position Pair
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pick 3 Pairs Analysis</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pick 3 Pairs Analysis</h1>
          <p className="text-gray-600">Analyze digit pairs across hundreds, tens, and units positions</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value as 'all' | 'hundreds' | 'tens' | 'units')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Positions</option>
                <option value="hundreds">Hundreds</option>
                <option value="tens">Tens</option>
                <option value="units">Units</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'hot' | 'cold' | 'due')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Pairs</option>
                <option value="hot">Hot Pairs</option>
                <option value="cold">Cold Pairs</option>
                <option value="due">Due Pairs</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Total draws analyzed: {draws.length}
            </div>
          </div>
        </div>

        {/* Results */}
        {selectedPosition === 'all' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['hundreds', 'tens', 'units'] as const).map(position => (
              <div key={position} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 capitalize">{position} Position</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getFilteredPairs(position).length > 0 ? (
                    getFilteredPairs(position).slice(0, 20).map(pair => renderPairCard(pair))
                  ) : (
                    <p className="text-gray-500 text-sm">No pairs found for current filter</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 capitalize">{selectedPosition} Position Pairs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getFilteredPairs(selectedPosition as 'hundreds' | 'tens' | 'units').length > 0 ? (
                getFilteredPairs(selectedPosition as 'hundreds' | 'tens' | 'units').map(pair => renderPairCard(pair))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No pairs found for current filter</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Position Comparison */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Position Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columnStats.map(col => {
              const totalPairs = col.pairs.length;
              const hotPercentage = totalPairs > 0 ? ((col.hotPairs.length / totalPairs) * 100).toFixed(1) : '0';
              const coldPercentage = totalPairs > 0 ? ((col.coldPairs.length / totalPairs) * 100).toFixed(1) : '0';
              const duePercentage = totalPairs > 0 ? ((col.duePairs.length / totalPairs) * 100).toFixed(1) : '0';

              return (
                <div key={col.position} className="border rounded-lg p-4">
                  <h4 className="font-semibold capitalize mb-3 text-center">{col.position} Position</h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hot Pairs:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${hotPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{col.hotPairs.length} ({hotPercentage}%)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cold Pairs:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${coldPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{col.coldPairs.length} ({coldPercentage}%)</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Due Pairs:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${duePercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{col.duePairs.length} ({duePercentage}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-center">
                    <div className="text-sm text-gray-600">Total Pairs</div>
                    <div className="text-lg font-bold">{totalPairs}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columnStats.map(col => {
              const avgLastSeen = col.pairs
                .filter(p => p.lastSeen !== -1)
                .reduce((sum, p) => sum + p.lastSeen, 0) / col.pairs.filter(p => p.lastSeen !== -1).length || 0;

              const avgTotalSkips = col.pairs.reduce((sum, p) => sum + p.totalSkips, 0) / col.pairs.length || 0;

              return (
                <div key={col.position} className="border rounded-lg p-4">
                  <h4 className="font-semibold capitalize mb-3 text-center">{col.position} Position</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Pairs:</span>
                      <span className="font-semibold">{col.pairs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hot Pairs:</span>
                      <span className="font-semibold text-red-600">{col.hotPairs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cold Pairs:</span>
                      <span className="font-semibold text-blue-600">{col.coldPairs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Pairs:</span>
                      <span className="font-semibold text-yellow-600">{col.duePairs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Last Seen:</span>
                      <span className="font-semibold">{avgLastSeen.toFixed(1)} draws</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Total Skips:</span>
                      <span className="font-semibold">{avgTotalSkips.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Pairs by Position */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Pairs by Position</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columnStats.map(col => {
              const topHotPairs = col.hotPairs
                .sort((a, b) => a.lastSkipCount - b.lastSkipCount)
                .slice(0, 5);

              const topDuePairs = col.duePairs
                .sort((a, b) => b.lastSkipCount - a.lastSkipCount)
                .slice(0, 5);

              return (
                <div key={col.position} className="border rounded-lg p-4">
                  <h4 className="font-semibold capitalize mb-3 text-center">{col.position} Position</h4>

                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-red-600 mb-2">Hottest Pairs</h5>
                    <div className="space-y-1">
                      {topHotPairs.length > 0 ? (
                        topHotPairs.map((pair, index) => (
                          <div key={pair.key} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                              <span className="font-mono">{pair.numbers[0]}-{pair.numbers[1]}</span>
                            </div>
                            <span className="text-xs text-gray-600">{pair.lastSkipCount} skips</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No hot pairs</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-yellow-600 mb-2">Most Due Pairs</h5>
                    <div className="space-y-1">
                      {topDuePairs.length > 0 ? (
                        topDuePairs.map((pair, index) => (
                          <div key={pair.key} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">#{index + 1}</span>
                              <span className="font-mono">{pair.numbers[0]}-{pair.numbers[1]}</span>
                            </div>
                            <span className="text-xs text-gray-600">{pair.lastSkipCount} skips</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No due pairs</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pick3PairsAnalysis;
