import React, { useState, useEffect } from 'react';
import { pick3DataManager, type Pick3Draw } from '../services/Pick3DataManager';

interface Pick3ColumnStats {
  position: 'hundreds' | 'tens' | 'units';
  number: number;
  frequency: number;
  lastSeen: number;
  averageSkips: number;
  isHot: boolean;
  isCold: boolean;
  isDue: boolean;
  skipHistory: number[];
}

interface ColumnAnalysis {
  position: 'hundreds' | 'tens' | 'units';
  stats: Pick3ColumnStats[];
  hotNumbers: Pick3ColumnStats[];
  coldNumbers: Pick3ColumnStats[];
  dueNumbers: Pick3ColumnStats[];
  totalDraws: number;
}

export const Pick3ColumnAnalysisPage: React.FC = () => {
  const [draws, setDraws] = useState<Pick3Draw[]>([]);
  const [columnAnalysis, setColumnAnalysis] = useState<Map<string, ColumnAnalysis> | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<'hundreds' | 'tens' | 'units'>('hundreds');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hot' | 'cold' | 'due'>('all');
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
      analyzeColumns(sortedDraws);
      setLoading(false);
    } catch (error) {
      console.error('Error loading Pick 3 data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const analyzeColumns = (draws: Pick3Draw[]) => {
    const analysis = new Map<string, ColumnAnalysis>();

    // Initialize analysis for each position
    ['hundreds', 'tens', 'units'].forEach(pos => {
      const position = pos as 'hundreds' | 'tens' | 'units';
      const stats: Pick3ColumnStats[] = [];

      // Initialize stats for digits 0-9
      for (let digit = 0; digit <= 9; digit++) {
        stats.push({
          position,
          number: digit,
          frequency: 0,
          lastSeen: -1,
          averageSkips: 0,
          isHot: false,
          isCold: false,
          isDue: false,
          skipHistory: []
        });
      }

      analysis.set(position, {
        position,
        stats,
        hotNumbers: [],
        coldNumbers: [],
        dueNumbers: [],
        totalDraws: draws.length
      });
    });

    // Analyze draws from oldest to newest
    const chronologicalDraws = [...draws].reverse();

    chronologicalDraws.forEach((draw, drawIndex) => {
      const midday = draw.midday;
      const evening = draw.evening;

      [midday, evening].forEach(drawType => {
        if (!drawType) return;

        const digits = drawType.split('').map(d => parseInt(d));

        // Update each position
        digits.forEach((digit, posIndex) => {
          const position = posIndex === 0 ? 'hundreds' : posIndex === 1 ? 'tens' : 'units';
          const colAnalysis = analysis.get(position)!;
          const stat = colAnalysis.stats[digit];

          stat.frequency++;

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
    });

    // Calculate averages and categorize numbers
    analysis.forEach(colAnalysis => {
      colAnalysis.stats.forEach(stat => {
        if (stat.skipHistory.length > 0) {
          stat.averageSkips = stat.skipHistory.reduce((sum, skip) => sum + skip, 0) / stat.skipHistory.length;
        }

        // Categorize based on recent performance
        const recentSkips = stat.skipHistory.slice(-5); // Last 5 appearances
        const avgRecentSkips = recentSkips.length > 0
          ? recentSkips.reduce((sum, skip) => sum + skip, 0) / recentSkips.length
          : stat.averageSkips;

        if (stat.lastSeen >= 10) {
          stat.isDue = true;
          colAnalysis.dueNumbers.push(stat);
        } else if (avgRecentSkips <= 3 && stat.frequency > colAnalysis.totalDraws * 0.15) {
          stat.isHot = true;
          colAnalysis.hotNumbers.push(stat);
        } else if (stat.lastSeen >= 5 || avgRecentSkips >= 7) {
          stat.isCold = true;
          colAnalysis.coldNumbers.push(stat);
        }
      });
    });

    setColumnAnalysis(analysis);
  };

  const getFilteredStats = () => {
    if (!columnAnalysis) return [];

    const colAnalysis = columnAnalysis.get(selectedColumn);
    if (!colAnalysis) return [];

    switch (selectedFilter) {
      case 'hot':
        return colAnalysis.hotNumbers;
      case 'cold':
        return colAnalysis.coldNumbers;
      case 'due':
        return colAnalysis.dueNumbers;
      default:
        return colAnalysis.stats;
    }
  };

  const getColumnName = (column: string): string => {
    switch (column) {
      case 'hundreds': return 'Hundreds Position';
      case 'tens': return 'Tens Position';
      case 'units': return 'Units Position';
      default: return column;
    }
  };

  const getColumnColor = (column: string): string => {
    switch (column) {
      case 'hundreds': return 'bg-blue-100 text-blue-800';
      case 'tens': return 'bg-green-100 text-green-800';
      case 'units': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderNumberCard = (stat: Pick3ColumnStats) => (
    <div key={stat.number} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
            {stat.number}
          </span>
          <span className="text-sm text-gray-500 capitalize">{stat.position}</span>
        </div>
        <div className="flex gap-1">
          {stat.isHot && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Hot</span>}
          {stat.isCold && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Cold</span>}
          {stat.isDue && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Due</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
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
          <div className="text-gray-600">Skip History</div>
          <div className="font-semibold text-xs">{stat.skipHistory.slice(-3).join(', ')}</div>
        </div>
      </div>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pick 3 Column Analysis</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!columnAnalysis) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pick 3 Column Analysis</h1>
          <p className="text-gray-600">Unable to load column analysis data. Please try again.</p>
        </div>
      </div>
    );
  }

  const currentAnalysis = columnAnalysis.get(selectedColumn);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pick 3 Column Analysis</h1>
          <p className="text-gray-600">Analyze digit patterns across hundreds, tens, and units positions</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value as 'hundreds' | 'tens' | 'units')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hundreds">Hundreds Position</option>
                <option value="tens">Tens Position</option>
                <option value="units">Units Position</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'hot' | 'cold' | 'due')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Numbers</option>
                <option value="hot">Hot Numbers</option>
                <option value="cold">Cold Numbers</option>
                <option value="due">Due Numbers</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Total draws analyzed: {draws.length}
            </div>
          </div>
        </div>

        {/* Column Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {(['hundreds', 'tens', 'units'] as const).map(position => {
            const analysis = columnAnalysis.get(position);
            return (
              <div key={position} className={`rounded-lg p-4 ${getColumnColor(position)}`}>
                <h3 className="font-semibold mb-2">{getColumnName(position)}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total: {analysis?.stats.length || 0}</div>
                  <div>Hot: {analysis?.hotNumbers.length || 0}</div>
                  <div>Cold: {analysis?.coldNumbers.length || 0}</div>
                  <div>Due: {analysis?.dueNumbers.length || 0}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{getColumnName(selectedColumn)} - {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Numbers</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getFilteredStats().length > 0 ? (
              getFilteredStats().map(stat => renderNumberCard(stat))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No numbers found for current filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        {currentAnalysis && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Summary Statistics - {getColumnName(selectedColumn)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentAnalysis.stats.length}</div>
                <div className="text-sm text-gray-600">Total Numbers</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{currentAnalysis.hotNumbers.length}</div>
                <div className="text-sm text-gray-600">Hot Numbers</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{currentAnalysis.coldNumbers.length}</div>
                <div className="text-sm text-gray-600">Cold Numbers</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{currentAnalysis.dueNumbers.length}</div>
                <div className="text-sm text-gray-600">Due Numbers</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};