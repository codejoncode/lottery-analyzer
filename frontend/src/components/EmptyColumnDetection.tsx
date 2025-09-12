import React, { useState, useMemo } from 'react';

interface ColumnData {
  digit: number;
  frequency: number;
  lastSeen: number;
  isEmpty: boolean;
  emptyStreak: number;
  trend: 'rising' | 'falling' | 'stable';
}

const EmptyColumnDetection: React.FC = () => {
  const [gridType, setGridType] = useState<'unique' | 'full'>('unique');
  const [timeWindow, setTimeWindow] = useState<7 | 14 | 30 | 90>(30);
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set());

  // Generate mock column data
  const generateColumnData = (): ColumnData[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      digit: i,
      frequency: Math.floor(Math.random() * 50) + 10,
      lastSeen: Math.floor(Math.random() * timeWindow),
      isEmpty: Math.random() < 0.3, // 30% chance of being empty
      emptyStreak: Math.floor(Math.random() * 5),
      trend: Math.random() < 0.33 ? 'rising' : Math.random() < 0.66 ? 'falling' : 'stable'
    }));
  };

  const columnData = useMemo(() => generateColumnData(), [gridType, timeWindow]);

  const emptyColumns = useMemo(() =>
    columnData.filter(col => col.isEmpty),
    [columnData]
  );

  const statistics = useMemo(() => {
    const total = columnData.length;
    const empty = emptyColumns.length;
    const emptyPercentage = ((empty / total) * 100).toFixed(1);
    const avgEmptyStreak = empty > 0
      ? (emptyColumns.reduce((sum, col) => sum + col.emptyStreak, 0) / empty).toFixed(1)
      : '0.0';

    return {
      total,
      empty,
      emptyPercentage,
      avgEmptyStreak,
      longestStreak: Math.max(...emptyColumns.map(col => col.emptyStreak), 0)
    };
  }, [columnData, emptyColumns]);

  const toggleColumn = (digit: number) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(digit)) {
      newSelected.delete(digit);
    } else {
      newSelected.add(digit);
    }
    setSelectedColumns(newSelected);
  };

  const getColumnColor = (col: ColumnData) => {
    if (selectedColumns.has(col.digit)) {
      return 'bg-blue-500 text-white';
    }
    if (col.isEmpty) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (col.trend === 'rising') {
      return 'bg-green-100 text-green-800';
    }
    if (col.trend === 'falling') {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-50 text-gray-800';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return '↗️';
      case 'falling': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  const regenerateData = () => {
    // This will trigger the useMemo to regenerate data
    setGridType(gridType);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">🔍 Empty Column Detection</h3>
        <p className="text-gray-600">Identify empty columns in pair grids and analyze patterns</p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Grid Type:</label>
            <select
              value={gridType}
              onChange={(e) => setGridType(e.target.value as typeof gridType)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="unique">5×9 Unique Pairs</option>
              <option value="full">10×10 Full Pairs</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Time Window:</label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(parseInt(e.target.value) as typeof timeWindow)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          <button
            onClick={regenerateData}
            className="px-4 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            Refresh Data
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-red-600">{statistics.empty}</div>
            <div className="text-xs text-red-800">Empty Columns</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{statistics.emptyPercentage}%</div>
            <div className="text-xs text-orange-800">Empty Rate</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{statistics.avgEmptyStreak}</div>
            <div className="text-xs text-purple-800">Avg Empty Streak</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{statistics.longestStreak}</div>
            <div className="text-xs text-blue-800">Longest Streak</div>
          </div>
        </div>
      </div>

      {/* Column Grid */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Column Status Grid</h4>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {columnData.map((col) => (
            <button
              key={col.digit}
              onClick={() => toggleColumn(col.digit)}
              className={`p-3 border-2 rounded-lg text-center transition-colors ${getColumnColor(col)}`}
              title={`Digit ${col.digit}: ${col.isEmpty ? 'Empty' : 'Active'} - Freq: ${col.frequency}, Last: ${col.lastSeen}d, Streak: ${col.emptyStreak}`}
            >
              <div className="text-lg font-bold">{col.digit}</div>
              <div className="text-xs mt-1">
                {col.isEmpty ? '🚫' : getTrendIcon(col.trend)}
              </div>
              <div className="text-xs mt-1 opacity-75">
                {col.frequency}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Empty Columns Analysis */}
      {emptyColumns.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Empty Columns Analysis</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empty Streak</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emptyColumns.map((col) => (
                  <tr key={col.digit} className={selectedColumns.has(col.digit) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                      {col.digit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {col.lastSeen} days ago
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {col.emptyStreak} periods
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {col.frequency}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Empty
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pattern Analysis */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Pattern Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Empty Column Patterns</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {emptyColumns.length} columns currently empty</li>
              <li>• Average empty streak: {statistics.avgEmptyStreak} periods</li>
              <li>• Longest empty streak: {statistics.longestStreak} periods</li>
              <li>• Empty rate: {statistics.emptyPercentage}% of all columns</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Trend Analysis</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Rising: {columnData.filter(c => c.trend === 'rising').length} columns</li>
              <li>• Falling: {columnData.filter(c => c.trend === 'falling').length} columns</li>
              <li>• Stable: {columnData.filter(c => c.trend === 'stable').length} columns</li>
              <li>• Time window: {timeWindow} days</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Selected Columns */}
      {selectedColumns.size > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Selected Columns ({selectedColumns.size})</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedColumns).sort().map(digit => (
              <span
                key={digit}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono bg-blue-100 text-blue-800"
              >
                {digit}
                <button
                  onClick={() => toggleColumn(digit)}
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
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Empty Column</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Rising Trend</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 rounded"></div>
            <span>Falling Trend</span>
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

export default EmptyColumnDetection;
