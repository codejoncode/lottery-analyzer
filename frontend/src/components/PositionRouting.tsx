import React, { useState, useMemo } from 'react';

interface Route {
  fromPosition: number;
  toPosition: number;
  digit: number;
  strength: number;
  frequency: number;
  lastUsed: number;
  successRate: number;
  routeType: 'direct' | 'indirect' | 'circular';
}

const PositionRouting: React.FC = () => {
  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
  const [routeType, setRouteType] = useState<'all' | 'direct' | 'indirect' | 'circular'>('all');
  const [minStrength, setMinStrength] = useState<number>(30);

  // Generate mock routing data
  const routes = useMemo(() => {
    const data: Route[] = [];
    for (let fromPos = 0; fromPos < 3; fromPos++) {
      for (let toPos = 0; toPos < 3; toPos++) {
        if (fromPos === toPos) continue; // Skip same position
        for (let digit = 0; digit < 10; digit++) {
          const strength = Math.floor(Math.random() * 70) + 30;
          const frequency = Math.floor(Math.random() * 50) + 10;
          const lastUsed = Math.floor(Math.random() * 30);
          const successRate = Math.floor(Math.random() * 40) + 60;

          let routeType: 'direct' | 'indirect' | 'circular';
          if (Math.abs(fromPos - toPos) === 1) {
            routeType = 'direct';
          } else if (Math.abs(fromPos - toPos) === 2) {
            routeType = 'circular';
          } else {
            routeType = 'indirect';
          }

          data.push({
            fromPosition: fromPos,
            toPosition: toPos,
            digit,
            strength,
            frequency,
            lastUsed,
            successRate,
            routeType
          });
        }
      }
    }
    return data;
  }, []);

  const filteredRoutes = useMemo(() => {
    let filtered = routes.filter(r => r.strength >= minStrength);

    if (selectedDigit !== null) {
      filtered = filtered.filter(r => r.digit === selectedDigit);
    }

    if (routeType !== 'all') {
      filtered = filtered.filter(r => r.routeType === routeType);
    }

    return filtered.sort((a, b) => b.strength - a.strength);
  }, [routes, minStrength, selectedDigit, routeType]);

  const statistics = useMemo(() => {
    const total = filteredRoutes.length;
    const avgStrength = filteredRoutes.reduce((sum, r) => sum + r.strength, 0) / total;
    const avgSuccessRate = filteredRoutes.reduce((sum, r) => sum + r.successRate, 0) / total;
    const direct = filteredRoutes.filter(r => r.routeType === 'direct').length;
    const indirect = filteredRoutes.filter(r => r.routeType === 'indirect').length;
    const circular = filteredRoutes.filter(r => r.routeType === 'circular').length;

    return {
      total,
      avgStrength: avgStrength.toFixed(1),
      avgSuccessRate: avgSuccessRate.toFixed(1),
      direct,
      indirect,
      circular
    };
  }, [filteredRoutes]);

  const getStrengthColor = (strength: number) => {
    if (strength > 70) return 'bg-red-500 text-white';
    if (strength > 50) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return 'text-blue-600 bg-blue-100';
      case 'indirect': return 'text-purple-600 bg-purple-100';
      case 'circular': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const positionLabels = ['Position 1', 'Position 2', 'Position 3'];

  // Create routing matrix for visualization
  const routingMatrix = useMemo(() => {
    const matrix = Array(3).fill(null).map(() => Array(3).fill(null));
    filteredRoutes.forEach(route => {
      if (!matrix[route.fromPosition][route.toPosition]) {
        matrix[route.fromPosition][route.toPosition] = [];
      }
      matrix[route.fromPosition][route.toPosition].push(route);
    });
    return matrix;
  }, [filteredRoutes]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">🛣️ Position Routing</h3>
        <p className="text-gray-600">Analyze how digits flow through different positions and identify routing patterns</p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
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

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Route Type:</label>
            <select
              value={routeType}
              onChange={(e) => setRouteType(e.target.value as typeof routeType)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="direct">Direct</option>
              <option value="indirect">Indirect</option>
              <option value="circular">Circular</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Min Strength:</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minStrength}
              onChange={(e) => setMinStrength(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">%</span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">{statistics.total}</div>
            <div className="text-xs text-blue-800">Active Routes</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-green-600">{statistics.avgStrength}%</div>
            <div className="text-xs text-green-800">Avg Strength</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">{statistics.avgSuccessRate}%</div>
            <div className="text-xs text-purple-800">Avg Success Rate</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">{statistics.direct}</div>
            <div className="text-xs text-orange-800">Direct Routes</div>
          </div>
        </div>
      </div>

      {/* Routing Matrix Visualization */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Routing Flow Matrix</h4>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-4 gap-2">
              {/* Header row */}
              <div className="p-2"></div>
              {positionLabels.map((label, index) => (
                <div key={`header-${index}`} className="p-2 text-center font-medium text-gray-700">
                  To {label}
                </div>
              ))}

              {/* Matrix rows */}
              {positionLabels.map((fromLabel, fromIndex) => (
                <React.Fragment key={`row-${fromIndex}`}>
                  <div className="p-2 text-right font-medium text-gray-700">
                    From {fromLabel}
                  </div>
                  {positionLabels.map((toLabel, toIndex) => {
                    const cellRoutes = routingMatrix[fromIndex][toIndex] || [];
                    const avgStrength = cellRoutes.length > 0
                      ? cellRoutes.reduce((sum: number, r: Route) => sum + r.strength, 0) / cellRoutes.length
                      : 0;

                    return (
                      <div
                        key={`cell-${fromIndex}-${toIndex}`}
                        className={`p-2 border border-gray-200 rounded text-center text-sm ${
                          fromIndex === toIndex ? 'bg-gray-100' :
                          avgStrength > 60 ? 'bg-red-100' :
                          avgStrength > 40 ? 'bg-yellow-100' :
                          avgStrength > 0 ? 'bg-green-100' : 'bg-white'
                        }`}
                      >
                        {fromIndex === toIndex ? '—' : cellRoutes.length > 0 ? (
                          <div>
                            <div className="font-bold">{cellRoutes.length}</div>
                            <div className="text-xs">{avgStrength.toFixed(0)}%</div>
                          </div>
                        ) : '0'}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Route Details Table */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Route Details</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strength</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.slice(0, 25).map((route, index) => (
                <tr key={`${route.fromPosition}-${route.toPosition}-${route.digit}-${index}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {positionLabels[route.fromPosition]} → {positionLabels[route.toPosition]}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                    {route.digit}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStrengthColor(route.strength)}`}>
                      {route.strength}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRouteTypeColor(route.routeType)}`}>
                      {route.routeType}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {route.successRate}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {route.lastUsed} days ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRoutes.length > 25 && (
          <div className="mt-4 text-center text-gray-500 text-sm">
            Showing first 25 of {filteredRoutes.length} routes
          </div>
        )}
      </div>

      {/* Route Type Analysis */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Route Type Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">Direct Routes</h5>
            <div className="text-2xl font-bold text-blue-600 mb-1">{statistics.direct}</div>
            <div className="text-sm text-blue-700">
              Adjacent position transitions (1→2, 2→3, etc.)
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h5 className="font-medium text-purple-800 mb-2">Indirect Routes</h5>
            <div className="text-2xl font-bold text-purple-600 mb-1">{statistics.indirect}</div>
            <div className="text-sm text-purple-700">
              Non-adjacent position transitions
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <h5 className="font-medium text-orange-800 mb-2">Circular Routes</h5>
            <div className="text-2xl font-bold text-orange-600 mb-1">{statistics.circular}</div>
            <div className="text-sm text-orange-700">
              Wrap-around transitions (1→3, 3→1, etc.)
            </div>
          </div>
        </div>
      </div>

      {/* Top Routes */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Top 10 Strongest Routes</h4>
        <div className="space-y-2">
          {filteredRoutes
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 10)
            .map((route, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                  <span className="text-sm">
                    {positionLabels[route.fromPosition]} → {positionLabels[route.toPosition]}: {route.digit}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Strength: {route.strength}%
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getRouteTypeColor(route.routeType)}`}>
                    {route.routeType}
                  </span>
                  <span className="text-sm text-gray-600">
                    Success: {route.successRate}%
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
            <span>Strong Route (&gt;70%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium Route (40-70%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Weak Route (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Direct Route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionRouting;
