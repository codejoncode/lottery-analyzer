import React, { useState, useEffect } from 'react';
import { ColumnAnalyzer, DataManager } from '../utils/scoringSystem';
import type { ColumnAnalysis, ColumnStats, PatternColumnStats } from '../utils/scoringSystem';

export const ColumnAnalysisPage: React.FC = () => {
  const [columnAnalyzer, setColumnAnalyzer] = useState<ColumnAnalyzer | null>(null);
  const [allColumnsAnalysis, setAllColumnsAnalysis] = useState<Map<number, ColumnAnalysis> | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<number>(1);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'numbers' | 'patterns' | 'statistics'>('numbers');

  useEffect(() => {
    const initializeAnalyzer = async () => {
      try {
        const dataManager = DataManager.getInstance();
        let draws = dataManager.loadData();

        if (draws.length === 0) {
          draws = await dataManager.loadCSVFromFile('/draws.txt');
        }

        const analyzer = new ColumnAnalyzer(draws);
        const analysis = analyzer.getAllColumnsAnalysis();

        setColumnAnalyzer(analyzer);
        setAllColumnsAnalysis(analysis);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing column analyzer:', error);
        setLoading(false);
      }
    };

    initializeAnalyzer();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!allColumnsAnalysis || !columnAnalyzer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Column Analysis</h1>
          <p className="text-gray-600">Unable to load column analysis data. Please try again.</p>
        </div>
      </div>
    );
  }

  const currentAnalysis = allColumnsAnalysis.get(selectedColumn);
  if (!currentAnalysis) return null;

  const getColumnName = (column: number): string => {
    if (column === 6) return 'Powerball';
    return `White Ball ${column}`;
  };

  const getColumnColor = (column: number): string => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800'
    ];
    return colors[column - 1] || 'bg-gray-100 text-gray-800';
  };

  const filterNumberStats = (stats: ColumnStats[]): ColumnStats[] => {
    if (selectedFilter === 'all') return stats;
    if (selectedFilter === 'hot') return stats.filter(stat => stat.isHot);
    if (selectedFilter === 'cold') return stats.filter(stat => stat.isCold);
    if (selectedFilter === 'due') return stats.filter(stat => stat.drawsSinceLastAppearance >= 10);
    return stats;
  };

  const filterPatternStats = (stats: PatternColumnStats[]): PatternColumnStats[] => {
    if (selectedPattern === 'all') return stats;
    return stats.filter(stat => stat.pattern.includes(selectedPattern.toLowerCase()));
  };

  const renderNumberStats = () => {
    const filteredStats = filterNumberStats(Array.from(currentAnalysis.numberStats.values()));

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {getColumnName(selectedColumn)} - Number Statistics
          </h2>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Numbers</option>
            <option value="hot">Hot Numbers</option>
            <option value="cold">Cold Numbers</option>
            <option value="due">Due Numbers</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skips
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Gap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Gap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStats.map((stat) => (
                <tr key={stat.number} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-semibold text-gray-900">{stat.number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{stat.drawsSinceLastAppearance}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{stat.averageGap.toFixed(1)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{stat.maxGap}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {stat.isHot && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Hot
                      </span>
                    )}
                    {stat.isCold && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Cold
                      </span>
                    )}
                    {!stat.isHot && !stat.isCold && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      stat.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                      stat.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stat.trend}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stat.lastAppearance || 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPatternStats = () => {
    const filteredStats = filterPatternStats(Array.from(currentAnalysis.patternStats.values()));

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {getColumnName(selectedColumn)} - Pattern Statistics
          </h2>
          <select
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Patterns</option>
            <option value="even">Even/Odd</option>
            <option value="high">High/Low</option>
            <option value="prime">Prime</option>
            <option value="sum">Sum Digits</option>
            <option value="last">Last Digit</option>
            <option value="consecutive">Consecutive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pattern
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appearances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skips
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Gap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStats.map((stat) => (
                <tr key={stat.pattern} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{stat.pattern}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{stat.totalAppearances}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{stat.drawsSinceLastAppearance}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{stat.averageGap.toFixed(1)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      stat.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                      stat.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stat.trend}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stat.lastAppearance || 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStatistics = () => {
    const summary = currentAnalysis.statisticalSummary;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {getColumnName(selectedColumn)} - Statistical Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Basic Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Draws:</span>
                <span className="text-sm font-semibold">{summary.totalDraws}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unique Numbers:</span>
                <span className="text-sm font-semibold">{summary.uniqueNumbers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Most Frequent:</span>
                <span className="text-sm font-semibold">{summary.mostFrequentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Least Frequent:</span>
                <span className="text-sm font-semibold">{summary.leastFrequentNumber}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Skip Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average:</span>
                <span className="text-sm font-semibold">{summary.averageSkips.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Maximum:</span>
                <span className="text-sm font-semibold">{summary.maxSkips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum:</span>
                <span className="text-sm font-semibold">{summary.minSkips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Range:</span>
                <span className="text-sm font-semibold">{summary.range}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Advanced Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Median:</span>
                <span className="text-sm font-semibold">{summary.medianSkips.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mode:</span>
                <span className="text-sm font-semibold">{summary.modeSkips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Std Dev:</span>
                <span className="text-sm font-semibold">{summary.standardDeviation.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Variance:</span>
                <span className="text-sm font-semibold">{summary.variance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Column Analysis</h1>
          <p className="text-gray-600">Detailed positional analysis of lottery numbers and patterns</p>
        </div>

        {/* Column Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Column</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedColumn(col)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      selectedColumn === col
                        ? getColumnColor(col) + ' ring-2 ring-offset-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getColumnName(col)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('numbers')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    viewMode === 'numbers'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Numbers
                </button>
                <button
                  onClick={() => setViewMode('patterns')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    viewMode === 'patterns'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Patterns
                </button>
                <button
                  onClick={() => setViewMode('statistics')}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    viewMode === 'statistics'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Statistics
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'numbers' && renderNumberStats()}
        {viewMode === 'patterns' && renderPatternStats()}
        {viewMode === 'statistics' && renderStatistics()}

        {/* Column Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((col) => {
            const analysis = allColumnsAnalysis.get(col);
            if (!analysis) return null;

            return (
              <div key={col} className="bg-white rounded-lg shadow-md p-6">
                <h3 className={`text-lg font-bold mb-4 ${getColumnColor(col)} px-3 py-1 rounded-md inline-block`}>
                  {getColumnName(col)}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Draws:</span>
                    <span className="font-semibold">{analysis.statisticalSummary.totalDraws}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unique Numbers:</span>
                    <span className="font-semibold">{analysis.statisticalSummary.uniqueNumbers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Skips:</span>
                    <span className="font-semibold">{analysis.statisticalSummary.averageSkips.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Most Frequent:</span>
                    <span className="font-semibold">{analysis.statisticalSummary.mostFrequentNumber}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
