import React, { useState, useMemo } from 'react';

interface Transition {
  fromPosition: number;
  toPosition: number;
  fromDigit: number;
  toDigit: number;
  frequency: number;
  probability: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastOccurred: number;
}

const TransitionAnalysis: React.FC = () => {
  const [selectedFromPosition, setSelectedFromPosition] = useState<number | null>(null);
  const [selectedToPosition, setSelectedToPosition] = useState<number | null>(null);
  const [minProbability, setMinProbability] = useState<number>(5);
  const [sortBy, setSortBy] = useState<'frequency' | 'probability' | 'trend'>('frequency');

  // Generate mock transition data
  const transitions = useMemo(() => {
    const data: Transition[] = [];
    for (let fromPos = 0; fromPos < 3; fromPos++) {
      for (let toPos = 0; toPos < 3; toPos++) {
        if (fromPos === toPos) continue; // Skip same position transitions
        for (let fromDigit = 0; fromDigit < 10; fromDigit++) {
          for (let toDigit = 0; toDigit < 10; toDigit++) {
            const frequency = Math.floor(Math.random() * 50) + 1;
            const totalFromDigit = Math.floor(Math.random() * 100) + 50;
            const probability = (frequency / totalFromDigit) * 100;
            const trend = Math.random() < 0.33 ? 'increasing' : Math.random() < 0.66 ? 'decreasing' : 'stable';
            const lastOccurred = Math.floor(Math.random() * 30);

            data.push({
              fromPosition: fromPos,
              toPosition: toPos,
              fromDigit,
              toDigit,
              frequency,
              probability,
              trend,
              lastOccurred
            });
          }
        }
      }
    }
    return data;
  }, []);

  const filteredTransitions = useMemo(() => {
    let filtered = transitions.filter(t => t.probability >= minProbability);

    if (selectedFromPosition !== null) {
      filtered = filtered.filter(t => t.fromPosition === selectedFromPosition);
    }

    if (selectedToPosition !== null) {
      filtered = filtered.filter(t => t.toPosition === selectedToPosition);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'frequency':
          return b.frequency - a.frequency;
        case 'probability':
          return b.probability - a.probability;
        case 'trend':
          return a.trend.localeCompare(b.trend);
        default:
          return 0;
      }
    });
  }, [transitions, minProbability, selectedFromPosition, selectedToPosition, sortBy]);

  const statistics = useMemo(() => {
    const total = filteredTransitions.length;
    const avgProbability = filteredTransitions.reduce((sum, t) => sum + t.probability, 0) / total;
    const avgFrequency = filteredTransitions.reduce((sum, t) => sum + t.frequency, 0) / total;
    const increasing = filteredTransitions.filter(t => t.trend === 'increasing').length;
    const decreasing = filteredTransitions.filter(t => t.trend === 'decreasing').length;
    const stable = filteredTransitions.filter(t => t.trend === 'stable').length;

    return {
      total,
      avgProbability: avgProbability.toFixed(1),
      avgFrequency: avgFrequency.toFixed(1),
      increasing,
      decreasing,
      stable
    };
  }, [filteredTransitions]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600 bg-green-100';
      case 'decreasing': return 'text-red-600 bg-red-100';
      case 'stable': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability > 20) return 'bg-red-500 text-white';
    if (probability > 10) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const positionLabels = ['Position 1', 'Position 2', 'Position 3'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">🔄 Transition Analysis</h3>
        <p className="text-gray-600">Analyze how digits transition between positions and identify movement patterns</p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From Position:</label>
            <select
              value={selectedFromPosition || ''}
              onChange={(e) => setSelectedFromPosition(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Positions</option>
              <option value={0}>Position 1</option>
              <option value={1}>Position 2</option>
              <option value={2}>Position 3</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To Position:</label>
            <select
              value={selectedToPosition || ''}
              onChange={(e) => setSelectedToPosition(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Positions</option>
              <option value={0}>Position 1</option>
              <option value={1}>Position 2</option>
              <option value={2}>Position 3</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Min Probability:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minProbability}
              onChange={(e) => setMinProbability(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="frequency">Frequency</option>
              <option value="probability">Probability</option>
              <option value="trend">Trend</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{statistics.total}</div>
            <div className="text-xs text-blue-800">Total Transitions</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{statistics.avgProbability}%</div>
            <div className="text-xs text-green-800">Avg Probability</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{statistics.avgFrequency}</div>
            <div className="text-xs text-purple-800">Avg Frequency</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{statistics.increasing}</div>
            <div className="text-xs text-orange-800">Increasing Trends</div>
          </div>
        </div>
      </div>

      {/* Transition Matrix */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Transition Matrix</h4>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From → To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransitions.slice(0, 50).map((transition, index) => (
                  <tr key={`${transition.fromPosition}-${transition.toPosition}-${transition.fromDigit}-${transition.toDigit}-${index}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {positionLabels[transition.fromPosition]} → {positionLabels[transition.toPosition]}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                      {transition.fromDigit} → {transition.toDigit}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {transition.frequency}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProbabilityColor(transition.probability)}`}>
                        {transition.probability.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTrendColor(transition.trend)}`}>
                        {transition.trend}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {transition.lastOccurred} days ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredTransitions.length > 50 && (
          <div className="mt-4 text-center text-gray-500 text-sm">
            Showing first 50 of {filteredTransitions.length} transitions
          </div>
        )}
      </div>

      {/* Position Flow Analysis */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Position Flow Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, pos) => {
            const fromTransitions = filteredTransitions.filter(t => t.fromPosition === pos);
            const toTransitions = filteredTransitions.filter(t => t.toPosition === pos);
            const netFlow = fromTransitions.length - toTransitions.length;

            return (
              <div key={pos} className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">{positionLabels[pos]}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Outgoing:</span>
                    <span className="font-mono">{fromTransitions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incoming:</span>
                    <span className="font-mono">{toTransitions.length}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Net Flow:</span>
                    <span className={`font-mono ${netFlow > 0 ? 'text-green-600' : netFlow < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {netFlow > 0 ? '+' : ''}{netFlow}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Transitions */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Top 10 Transitions by Probability</h4>
        <div className="space-y-2">
          {filteredTransitions
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 10)
            .map((transition, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                  <span className="text-sm">
                    {positionLabels[transition.fromPosition]}: {transition.fromDigit} →
                    {positionLabels[transition.toPosition]}: {transition.toDigit}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {transition.probability.toFixed(1)}% probability
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getTrendColor(transition.trend)}`}>
                    {transition.trend}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>High Probability (&gt;20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Probability (10-20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low Probability (&lt;10%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Increasing Trend</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitionAnalysis;
