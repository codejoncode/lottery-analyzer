import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '../utils/performanceMonitor';

const PerformanceDashboard: React.FC = () => {
  const { getSummary, clearMetrics, exportMetrics } = usePerformanceMonitor();
  const [summary, setSummary] = useState(getSummary());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setSummary(getSummary());
      }, 2000); // Update every 2 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, getSummary]);

  const handleExport = () => {
    const data = exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return 'text-green-600 bg-green-100';
    if (value <= thresholds.warning) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">⚡ Performance Monitor</h2>
        <div className="flex space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => setSummary(getSummary())}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
          <button
            onClick={clearMetrics}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            🗑️ Clear
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            📊 Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-md">
          <div className="text-3xl font-bold text-blue-600">{summary.totalOperations.toLocaleString()}</div>
          <div className="text-sm text-blue-800">Total Operations</div>
        </div>
        <div className={`text-center p-4 rounded-md ${getPerformanceColor(
          parseFloat(summary.avgResponseTime.replace('ms', '')),
          { good: 100, warning: 500 }
        )}`}>
          <div className="text-3xl font-bold">{summary.avgResponseTime}</div>
          <div className="text-sm">Avg Response Time</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-md">
          <div className="text-3xl font-bold text-green-600">{summary.memoryUsage}</div>
          <div className="text-sm text-green-800">Peak Memory Usage</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-md">
          <div className="text-3xl font-bold text-purple-600">{summary.topOperations.length}</div>
          <div className="text-sm text-purple-800">Operation Types</div>
        </div>
      </div>

      {/* Top Operations */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">🏆 Top Operations</h3>
        <div className="space-y-3">
          {summary.topOperations.map((op, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <span className="font-medium">{op.name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{op.count} calls</span>
                <span className={`px-2 py-1 rounded text-xs ${getPerformanceColor(
                  parseFloat(op.avgTime.replace('ms', '')),
                  { good: 50, warning: 200 }
                )}`}>
                  {op.avgTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Health Indicators */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">🏥 System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Response Time</span>
              <span className={`px-2 py-1 rounded text-xs ${getPerformanceColor(
                parseFloat(summary.avgResponseTime.replace('ms', '')),
                { good: 100, warning: 500 }
              )}`}>
                {parseFloat(summary.avgResponseTime.replace('ms', '')) <= 100 ? 'Good' :
                 parseFloat(summary.avgResponseTime.replace('ms', '')) <= 500 ? 'Warning' : 'Critical'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  parseFloat(summary.avgResponseTime.replace('ms', '')) <= 100 ? 'bg-green-500' :
                  parseFloat(summary.avgResponseTime.replace('ms', '')) <= 500 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{
                  width: `${Math.min((parseFloat(summary.avgResponseTime.replace('ms', '')) / 1000) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>

          <div className="p-4 border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="px-2 py-1 rounded text-xs text-blue-600 bg-blue-100">
                Normal
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full w-3/4"></div>
            </div>
          </div>

          <div className="p-4 border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Operation Load</span>
              <span className={`px-2 py-1 rounded text-xs ${
                summary.totalOperations < 100 ? 'text-green-600 bg-green-100' :
                summary.totalOperations < 500 ? 'text-yellow-600 bg-yellow-100' :
                'text-red-600 bg-red-100'
              }`}>
                {summary.totalOperations < 100 ? 'Light' :
                 summary.totalOperations < 500 ? 'Moderate' : 'Heavy'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  summary.totalOperations < 100 ? 'bg-green-500' :
                  summary.totalOperations < 500 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min((summary.totalOperations / 1000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-medium mb-4">💡 Performance Recommendations</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="space-y-2 text-blue-800">
            {parseFloat(summary.avgResponseTime.replace('ms', '')) > 500 && (
              <p>• ⚠️ High response times detected. Consider optimizing heavy operations.</p>
            )}
            {summary.totalOperations > 500 && (
              <p>• 📊 High operation volume. Consider implementing caching for frequently called operations.</p>
            )}
            {summary.topOperations.length > 0 && (
              <p>• 🎯 Focus optimization efforts on the top operations shown above.</p>
            )}
            <p>• 🔄 Regular monitoring helps identify performance bottlenecks early.</p>
            <p>• 💾 Consider clearing metrics periodically to maintain optimal performance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
