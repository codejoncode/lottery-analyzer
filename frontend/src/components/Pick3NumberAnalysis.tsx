import React, { useState, useEffect } from 'react';
import { pick3DataManager, type Pick3Draw } from '../services/Pick3DataManager';

interface Pick3NumberStats {
  number: string;
  frequency: number;
  lastSeen: number;
  averageSkips: number;
  isHot: boolean;
  isCold: boolean;
  isDue: boolean;
  skipHistory: number[];
  middayFrequency: number;
  eveningFrequency: number;
  sum: number;
  isEven: boolean;
  isOdd: boolean;
  isHigh: boolean;
  isLow: boolean;
}

export const Pick3NumberAnalysis: React.FC = () => {
  const [draws, setDraws] = useState<Pick3Draw[]>([]);
  const [numberStats, setNumberStats] = useState<Pick3NumberStats[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hot' | 'cold' | 'due' | 'even' | 'odd' | 'high' | 'low'>('all');
  const [selectedSort, setSelectedSort] = useState<'frequency' | 'lastSeen' | 'averageSkips' | 'sum'>('frequency');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const allDraws = pick3DataManager.getDraws();
      // Sort from newest to oldest for analysis
      const sortedDraws = allDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDraws(sortedDraws);
      analyzeNumbers(sortedDraws);
      setLoading(false);
    } catch (error) {
      console.error('Error loading Pick 3 data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const analyzeNumbers = (draws: Pick3Draw[]) => {
    const stats = new Map<string, Pick3NumberStats>();

    // Initialize stats for all possible Pick 3 numbers (000-999)
    for (let i = 0; i <= 999; i++) {
      const number = i.toString().padStart(3, '0');
      const digits = number.split('').map(d => parseInt(d));
      const sum = digits.reduce((a, b) => a + b, 0);

      stats.set(number, {
        number,
        frequency: 0,
        lastSeen: -1,
        averageSkips: 0,
        isHot: false,
        isCold: false,
        isDue: false,
        skipHistory: [],
        middayFrequency: 0,
        eveningFrequency: 0,
        sum,
        isEven: sum % 2 === 0,
        isOdd: sum % 2 !== 0,
        isHigh: sum >= 14, // High sum threshold for Pick 3
        isLow: sum <= 13   // Low sum threshold for Pick 3
      });
    }

    // Analyze draws from oldest to newest
    const chronologicalDraws = [...draws].reverse();

    chronologicalDraws.forEach((draw, drawIndex) => {
      const midday = draw.midday;
      const evening = draw.evening;

      [midday, evening].forEach((drawType, typeIndex) => {
        if (!drawType) return;

        const stat = stats.get(drawType);
        if (!stat) return;

        stat.frequency++;

        if (typeIndex === 0) {
          stat.middayFrequency++;
        } else {
          stat.eveningFrequency++;
        }

        if (stat.lastSeen === -1) {
          // First appearance
          stat.lastSeen = drawIndex;
        } else {
          // Calculate skip
          const skip = drawIndex - stat.lastSeen - 1;
          stat.skipHistory.push(skip);
          stat.lastSeen = drawIndex;
        }
      });
    });

    // Calculate averages and categorize numbers
    const allStats = Array.from(stats.values());
    const totalDraws = draws.length;

    allStats.forEach(stat => {
      if (stat.skipHistory.length > 0) {
        stat.averageSkips = stat.skipHistory.reduce((sum, skip) => sum + skip, 0) / stat.skipHistory.length;
      }

      // Categorize based on recent performance
      const recentSkips = stat.skipHistory.slice(-5); // Last 5 appearances
      const avgRecentSkips = recentSkips.length > 0
        ? recentSkips.reduce((sum, skip) => sum + skip, 0) / recentSkips.length
        : stat.averageSkips;

      if (stat.lastSeen >= 20) {
        stat.isDue = true;
      } else if (avgRecentSkips <= 5 && stat.frequency > totalDraws * 0.01) {
        stat.isHot = true;
      } else if (stat.lastSeen >= 10 || avgRecentSkips >= 15) {
        stat.isCold = true;
      }
    });

    setNumberStats(allStats);
  };

  const getFilteredStats = () => {
    let filtered = [...numberStats];

    switch (selectedFilter) {
      case 'hot':
        filtered = filtered.filter(stat => stat.isHot);
        break;
      case 'cold':
        filtered = filtered.filter(stat => stat.isCold);
        break;
      case 'due':
        filtered = filtered.filter(stat => stat.isDue);
        break;
      case 'even':
        filtered = filtered.filter(stat => stat.isEven);
        break;
      case 'odd':
        filtered = filtered.filter(stat => stat.isOdd);
        break;
      case 'high':
        filtered = filtered.filter(stat => stat.isHigh);
        break;
      case 'low':
        filtered = filtered.filter(stat => stat.isLow);
        break;
      default:
        break;
    }

    // Sort based on selected criteria
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'lastSeen':
          return a.lastSeen - b.lastSeen;
        case 'averageSkips':
          return b.averageSkips - a.averageSkips;
        case 'sum':
          return b.sum - a.sum;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const renderNumberCard = (stat: Pick3NumberStats) => (
    <div key={stat.number} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
            {stat.number}
          </span>
          <div className="text-sm text-gray-500">
            <div>Sum: {stat.sum}</div>
            <div className="flex gap-1">
              {stat.isEven && <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">Even</span>}
              {stat.isOdd && <span className="px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">Odd</span>}
              {stat.isHigh && <span className="px-1 py-0.5 bg-red-100 text-red-800 text-xs rounded">High</span>}
              {stat.isLow && <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Low</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {stat.isHot && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Hot</span>}
          {stat.isCold && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Cold</span>}
          {stat.isDue && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Due</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
        <div>
          <div className="text-gray-600">Frequency</div>
          <div className="font-semibold">{stat.frequency}</div>
        </div>
        <div>
          <div className="text-gray-600">Last Seen</div>
          <div className="font-semibold">{stat.lastSeen === -1 ? 'Never' : `${stat.lastSeen} draws`}</div>
        </div>
        <div>
          <div className="text-gray-600">Avg Skips</div>
          <div className="font-semibold">{stat.averageSkips.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-gray-600">Mid/Eve</div>
          <div className="font-semibold">{stat.middayFrequency}/{stat.eveningFrequency}</div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Recent skips: {stat.skipHistory.slice(-3).join(', ')}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pick 3 Number Analysis</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const filteredStats = getFilteredStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pick 3 Number Analysis</h1>
          <p className="text-gray-600">Comprehensive analysis of all Pick 3 numbers (000-999)</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as typeof selectedFilter)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Numbers</option>
                <option value="hot">Hot Numbers</option>
                <option value="cold">Cold Numbers</option>
                <option value="due">Due Numbers</option>
                <option value="even">Even Sum</option>
                <option value="odd">Odd Sum</option>
                <option value="high">High Sum (≥14)</option>
                <option value="low">Low Sum (≤13)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as typeof selectedSort)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="frequency">Frequency</option>
                <option value="lastSeen">Last Seen</option>
                <option value="averageSkips">Average Skips</option>
                <option value="sum">Sum</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Total draws analyzed: {draws.length} | Showing: {filteredStats.length} numbers
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{numberStats.length}</div>
              <div className="text-sm text-gray-600">Total Numbers</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{numberStats.filter(s => s.isHot).length}</div>
              <div className="text-sm text-gray-600">Hot Numbers</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{numberStats.filter(s => s.isCold).length}</div>
              <div className="text-sm text-gray-600">Cold Numbers</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{numberStats.filter(s => s.isDue).length}</div>
              <div className="text-sm text-gray-600">Due Numbers</div>
            </div>
          </div>
        </div>

        {/* Number Grid */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Pick 3 Numbers - {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStats.length > 0 ? (
              filteredStats.slice(0, 100).map(stat => renderNumberCard(stat)) // Limit to first 100 for performance
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No numbers found for current filter</p>
              </div>
            )}
          </div>

          {filteredStats.length > 100 && (
            <div className="mt-4 text-center">
              <p className="text-gray-600">Showing first 100 results. Total: {filteredStats.length} numbers</p>
            </div>
          )}
        </div>

        {/* Pattern Analysis */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Sum Distribution</h3>
            <div className="space-y-2">
              {Array.from({ length: 28 }, (_, i) => i).map(sum => {
                const count = numberStats.filter(s => s.sum === sum).length;
                const percentage = (count / numberStats.length * 100).toFixed(1);
                const percentageNum = parseFloat(percentage);
                return (
                  <div key={sum} className="flex items-center justify-between text-sm">
                    <span>Sum {sum}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(percentageNum, 100)}%` }}
                        ></div>
                      </div>
                      <span className="w-12 text-right">{count} ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Draw Type Distribution</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Midday vs Evening</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {numberStats.reduce((sum, stat) => sum + stat.middayFrequency, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Midday Draws</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">
                      {numberStats.reduce((sum, stat) => sum + stat.eveningFrequency, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Evening Draws</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Even vs Odd Sums</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {numberStats.filter(s => s.isEven).length}
                    </div>
                    <div className="text-sm text-gray-600">Even Sum</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="text-lg font-bold text-orange-600">
                      {numberStats.filter(s => s.isOdd).length}
                    </div>
                    <div className="text-sm text-gray-600">Odd Sum</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};