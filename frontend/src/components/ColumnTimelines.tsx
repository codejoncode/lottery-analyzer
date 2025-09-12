import React, { useState, useMemo } from 'react';

interface TimelineData {
  position: number;
  digit: number;
  draws: number[];
  frequency: number;
  lastSeen: number;
  trend: 'rising' | 'falling' | 'stable';
  avgSkip: number;
  maxSkip: number;
}

const ColumnTimelines: React.FC = () => {
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);
  const [viewMode, setViewMode] = useState<'frequency' | 'skips' | 'trends'>('frequency');

  // Generate mock timeline data
  const timelineData = useMemo(() => {
    const data: TimelineData[] = [];
    for (let position = 0; position < 3; position++) {
      for (let digit = 0; digit < 10; digit++) {
        const draws = Array.from({ length: timeRange }, () =>
          Math.floor(Math.random() * timeRange)
        );
        const frequency = draws.filter(d => d < timeRange * 0.3).length;
        const lastSeen = Math.floor(Math.random() * 10);
        const trend = Math.random() < 0.33 ? 'rising' : Math.random() < 0.66 ? 'falling' : 'stable';
        const skips = draws.map((_, i) => i);
        const avgSkip = skips.reduce((a, b) => a + b, 0) / skips.length;
        const maxSkip = Math.max(...skips);

        data.push({
          position,
          digit,
          draws,
          frequency,
          lastSeen,
          trend,
          avgSkip,
          maxSkip
        });
      }
    }
    return data;
  }, [timeRange]);

  const positionData = useMemo(() => {
    if (selectedPosition === null) return [];
    return timelineData.filter(d => d.position === selectedPosition);
  }, [timelineData, selectedPosition]);

  const digitData = useMemo(() => {
    if (selectedDigit === null) return [];
    return timelineData.filter(d => d.digit === selectedDigit);
  }, [timelineData, selectedDigit]);

  const statistics = useMemo(() => {
    const totalEntries = timelineData.length;
    const rising = timelineData.filter(d => d.trend === 'rising').length;
    const falling = timelineData.filter(d => d.trend === 'falling').length;
    const stable = timelineData.filter(d => d.trend === 'stable').length;
    const avgFrequency = timelineData.reduce((sum, d) => sum + d.frequency, 0) / totalEntries;

    return {
      totalEntries,
      rising,
      falling,
      stable,
      avgFrequency: avgFrequency.toFixed(1),
      risingPercentage: ((rising / totalEntries) * 100).toFixed(1),
      fallingPercentage: ((falling / totalEntries) * 100).toFixed(1)
    };
  }, [timelineData]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-green-600 bg-green-100';
      case 'falling': return 'text-red-600 bg-red-100';
      case 'stable': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFrequencyColor = (frequency: number, maxFreq: number) => {
    const intensity = (frequency / maxFreq) * 100;
    if (intensity > 70) return 'bg-red-500 text-white';
    if (intensity > 40) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const maxFrequency = Math.max(...timelineData.map(d => d.frequency));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">📈 Column Timelines</h3>
        <p className="text-gray-600">Historical analysis of digit performance across positions over time</p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value) as typeof timeRange)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">View Mode:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="frequency">Frequency</option>
              <option value="skips">Skip Analysis</option>
              <option value="trends">Trends</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Position:</label>
            <select
              value={selectedPosition || ''}
              onChange={(e) => setSelectedPosition(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Positions</option>
              <option value={0}>Position 1</option>
              <option value={1}>Position 2</option>
              <option value={2}>Position 3</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Digit:</label>
            <select
              value={selectedDigit || ''}
              onChange={(e) => setSelectedDigit(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Digits</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{statistics.totalEntries}</div>
            <div className="text-xs text-blue-800">Total Entries</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{statistics.rising}</div>
            <div className="text-xs text-green-800">Rising Trends</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-red-600">{statistics.falling}</div>
            <div className="text-xs text-red-800">Falling Trends</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-gray-600">{statistics.avgFrequency}</div>
            <div className="text-xs text-gray-800">Avg Frequency</div>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          {selectedPosition !== null ? `Position ${selectedPosition + 1}` : 'All Positions'} -
          {selectedDigit !== null ? ` Digit ${selectedDigit}` : ' All Digits'} Timeline
        </h4>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-10 gap-1">
              {(selectedPosition !== null ? positionData : selectedDigit !== null ? digitData : timelineData)
                .slice(0, 30) // Limit for display
                .map((item, index) => (
                  <div
                    key={`${item.position}-${item.digit}-${index}`}
                    className="p-2 border border-gray-200 rounded text-center text-xs"
                    title={`Pos ${item.position + 1}, Digit ${item.digit}: Freq=${item.frequency}, Last=${item.lastSeen}d, Trend=${item.trend}`}
                  >
                    <div className="font-bold text-sm mb-1">
                      {item.position},{item.digit}
                    </div>

                    {viewMode === 'frequency' && (
                      <div className={`px-1 py-1 rounded text-xs font-bold ${getFrequencyColor(item.frequency, maxFrequency)}`}>
                        {item.frequency}
                      </div>
                    )}

                    {viewMode === 'skips' && (
                      <div className="text-xs">
                        <div>Avg: {item.avgSkip.toFixed(1)}</div>
                        <div>Max: {item.maxSkip}</div>
                      </div>
                    )}

                    {viewMode === 'trends' && (
                      <div className={`px-1 py-1 rounded text-xs font-bold ${getTrendColor(item.trend)}`}>
                        {item.trend === 'rising' ? '↗' : item.trend === 'falling' ? '↘' : '→'}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-1">
                      {item.lastSeen}d ago
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      {(selectedPosition !== null || selectedDigit !== null) && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Detailed Analysis</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Skip</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Skip</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(selectedPosition !== null ? positionData : digitData).map((item) => (
                  <tr key={`${item.position}-${item.digit}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.position + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                      {item.digit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.frequency}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.lastSeen} days
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTrendColor(item.trend)}`}>
                        {item.trend}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.avgSkip.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.maxSkip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>High Frequency</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Frequency</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low Frequency</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Stable Trend</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnTimelines;
