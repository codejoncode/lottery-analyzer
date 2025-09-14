import React, { useState, useEffect } from 'react';
import { CacheManager } from '../caching/CacheManager';
import type { ComprehensiveCacheStats, PredictionCacheStats, ResultCacheStats } from '../caching/CacheManager';

interface CacheMonitorProps {
  cacheManager: CacheManager;
}

const CacheMonitor: React.FC<CacheMonitorProps> = ({ cacheManager }) => {
  const [stats, setStats] = useState<ComprehensiveCacheStats | null>(null);
  const [predictionCacheStats, setPredictionCacheStats] = useState<PredictionCacheStats | null>(null);
  const [resultCacheStats, setResultCacheStats] = useState<ResultCacheStats | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    updateStats();

    if (autoRefresh) {
      const interval = setInterval(updateStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const updateStats = () => {
    try {
      const cacheStats = cacheManager.getStats();
      setStats(cacheStats);

      // Get individual cache stats using public methods
      setPredictionCacheStats(cacheManager.getPredictionCacheStats());
      setResultCacheStats(cacheManager.getResultCacheStats());
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  };

  const clearAllCaches = () => {
    if (confirm('Are you sure you want to clear all caches? This will reset performance data.')) {
      cacheManager.clearAll();
      updateStats();
    }
  };

  const exportCacheData = () => {
    const data = cacheManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getHitRateColor = (rate: number): string => {
    if (rate >= 0.8) return 'text-green-600 bg-green-100';
    if (rate >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (rate >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 0.9) return 'text-green-600 bg-green-100';
    if (efficiency >= 0.7) return 'text-yellow-600 bg-yellow-100';
    if (efficiency >= 0.5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cache statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">💾 Cache Performance Monitor</h2>
        <div className="flex space-x-3">
          <button
            onClick={updateStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
          <button
            onClick={clearAllCaches}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            🗑️ Clear All
          </button>
          <button
            onClick={exportCacheData}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            📊 Export
          </button>
        </div>
      </div>

      {/* Auto-refresh controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-3 py-1 border rounded-md"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-md">
          <div className="text-3xl font-bold text-blue-600">{stats.overall.totalEntries}</div>
          <div className="text-sm text-blue-800">Total Entries</div>
        </div>
        <div className={`text-center p-4 rounded-md ${getHitRateColor(stats.overall.hitRate)}`}>
          <div className="text-3xl font-bold">{(stats.overall.hitRate * 100).toFixed(1)}%</div>
          <div className="text-sm">Overall Hit Rate</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-md">
          <div className="text-3xl font-bold text-green-600">{formatBytes(stats.overall.totalMemory)}</div>
          <div className="text-sm text-green-800">Total Size</div>
        </div>
        <div className={`text-center p-4 rounded-md ${getEfficiencyColor(resultCacheStats ? (1 - resultCacheStats.memoryUsage / resultCacheStats.maxMemory) : 0)}`}>
          <div className="text-3xl font-bold">{resultCacheStats ? ((1 - resultCacheStats.memoryUsage / resultCacheStats.maxMemory) * 100).toFixed(1) : 0}%</div>
          <div className="text-sm">Memory Efficiency</div>
        </div>
      </div>

      {/* Cache Layer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Prediction Cache */}
        {predictionCacheStats && (
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-3">🎯 Prediction Cache</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Entries:</span>
                <span className="font-medium">{predictionCacheStats.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hit Rate:</span>
                <span className={`px-2 py-1 rounded text-xs ${getHitRateColor(predictionCacheStats.hitRate)}`}>
                  {(predictionCacheStats.hitRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Size:</span>
                <span className="font-medium">{formatBytes(predictionCacheStats.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Access Time:</span>
                <span className="font-medium">{formatTime(predictionCacheStats.averageAge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">TTL Hits:</span>
                <span className="font-medium">{predictionCacheStats.totalHits}</span>
              </div>
            </div>
          </div>
        )}

        {/* Result Cache */}
        {resultCacheStats && (
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-3">📊 Result Cache</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Entries:</span>
                <span className="font-medium">{resultCacheStats.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hit Rate:</span>
                <span className={`px-2 py-1 rounded text-xs ${getHitRateColor(resultCacheStats.hitRate)}`}>
                  {(resultCacheStats.hitRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Size:</span>
                <span className="font-medium">{formatBytes(resultCacheStats.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Memory Usage:</span>
                <span className="font-medium">{(resultCacheStats.memoryUsage * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Evictions:</span>
                <span className="font-medium">N/A</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">⚡ Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-md">
            <div className="text-xl font-bold text-green-600">
              {formatTime(stats.overall.lastOptimized)}
            </div>
            <div className="text-sm text-green-800">Avg Response Time</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-md">
            <div className="text-xl font-bold text-blue-600">
              {(stats.predictionCache.totalAccesses + stats.resultCache.totalAccesses).toLocaleString()}
            </div>
            <div className="text-sm text-blue-800">Total Requests</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-md">
            <div className="text-xl font-bold text-purple-600">
              {(stats.overall.hitRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-800">Computation Saved</div>
          </div>
        </div>
      </div>

      {/* Cache Health Indicators */}
      <div>
        <h3 className="text-lg font-medium mb-3">🏥 Cache Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Memory Pressure</span>
              <span className={`px-2 py-1 rounded text-xs ${
                (resultCacheStats?.memoryUsagePercent ?? 0) < 70 ? 'text-green-600 bg-green-100' :
                (resultCacheStats?.memoryUsagePercent ?? 0) < 90 ? 'text-yellow-600 bg-yellow-100' :
                'text-red-600 bg-red-100'
              }`}>
                {((resultCacheStats?.memoryUsagePercent ?? 0)).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (resultCacheStats?.memoryUsagePercent ?? 0) < 70 ? 'bg-green-500' :
                  (resultCacheStats?.memoryUsagePercent ?? 0) < 90 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${resultCacheStats?.memoryUsagePercent ?? 0}%` }}
              ></div>
            </div>
          </div>

          <div className="p-4 border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cache Effectiveness</span>
              <span className={`px-2 py-1 rounded text-xs ${
                stats.overall.hitRate > 0.8 ? 'text-green-600 bg-green-100' :
                stats.overall.hitRate > 0.6 ? 'text-yellow-600 bg-yellow-100' :
                'text-red-600 bg-red-100'
              }`}>
                {(stats.overall.hitRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  stats.overall.hitRate > 0.8 ? 'bg-green-500' :
                  stats.overall.hitRate > 0.6 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${stats.overall.hitRate * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheMonitor;
