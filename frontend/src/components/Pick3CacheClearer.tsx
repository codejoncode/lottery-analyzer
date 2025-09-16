import React, { useState } from 'react';
import { AnalyticsService } from '../services/api';
import { CacheManager } from '../caching/CacheManager';
import { pick3DataManager } from '../services/Pick3DataManager';

interface CacheClearResult {
  analyticsCache: boolean;
  predictionCache: boolean;
  resultCache: boolean;
  pick3Data: boolean;
  timestamp: number;
}

export const Pick3CacheClearer: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [lastClearResult, setLastClearResult] = useState<CacheClearResult | null>(null);
  const [cacheStats, setCacheStats] = useState({
    analyticsCacheSize: 0,
    predictionCacheSize: 0,
    resultCacheSize: 0,
    pick3DataCount: 0
  });

  // Update cache stats
  const updateCacheStats = () => {
    try {
      // Get AnalyticsService cache stats
      const analyticsStats = AnalyticsService.getCacheStats();

      // Get CacheManager stats (if available)
      let predictionSize = 0;
      let resultSize = 0;
      try {
        const cacheManager = new CacheManager();
        const stats = cacheManager.getStats();
        predictionSize = stats.predictionCache.size;
        resultSize = stats.resultCache.size;
      } catch (error) {
        console.warn('CacheManager not available:', error);
      }

      // Get Pick3DataManager stats
      const pick3Stats = pick3DataManager.getDataStats();

      setCacheStats({
        analyticsCacheSize: analyticsStats.size,
        predictionCacheSize: predictionSize,
        resultCacheSize: resultSize,
        pick3DataCount: pick3Stats.totalDraws
      });
    } catch (error) {
      console.error('Error updating cache stats:', error);
    }
  };

  // Clear all Pick 3 caches
  const clearAllPick3Caches = async () => {
    const confirmMessage = `Are you sure you want to clear ALL Pick 3 cached data? This will:

• Clear Analytics cache (${cacheStats.analyticsCacheSize} entries)
• Clear Prediction cache (${cacheStats.predictionCacheSize} entries)
• Clear Result cache (${cacheStats.resultCacheSize} entries)
• Clear Pick 3 data (${cacheStats.pick3DataCount} draws)

This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsClearing(true);
    const result: CacheClearResult = {
      analyticsCache: false,
      predictionCache: false,
      resultCache: false,
      pick3Data: false,
      timestamp: Date.now()
    };

    try {
      // Clear AnalyticsService cache
      AnalyticsService.clearCache();
      result.analyticsCache = true;
      console.log('✅ Analytics cache cleared');

      // Clear CacheManager caches
      try {
        const cacheManager = new CacheManager();
        cacheManager.clearAll();
        result.predictionCache = true;
        result.resultCache = true;
        console.log('✅ Prediction and Result caches cleared');
      } catch (error) {
        console.warn('⚠️ CacheManager clear failed:', error);
      }

      // Clear Pick3DataManager data
      pick3DataManager.clearData();
      result.pick3Data = true;
      console.log('✅ Pick 3 data cleared');

      setLastClearResult(result);
      updateCacheStats();

      alert('🎉 All Pick 3 caches cleared successfully!');

    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      alert('❌ Error clearing some caches. Check console for details.');
    } finally {
      setIsClearing(false);
    }
  };

  // Clear only Analytics cache
  const clearAnalyticsCache = () => {
    if (window.confirm(`Clear Analytics cache (${cacheStats.analyticsCacheSize} entries)?`)) {
      AnalyticsService.clearCache();
      updateCacheStats();
      alert('✅ Analytics cache cleared');
    }
  };

  // Clear only Pick 3 data
  const clearPick3Data = () => {
    if (window.confirm(`Clear Pick 3 data (${cacheStats.pick3DataCount} draws)? This cannot be undone.`)) {
      pick3DataManager.clearData();
      updateCacheStats();
      alert('✅ Pick 3 data cleared');
    }
  };

  // Initialize stats on mount
  React.useEffect(() => {
    updateCacheStats();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🗑️ Pick 3 Cache Management</h2>
        <p className="text-gray-600">Clear cached data to refresh analysis and free up memory</p>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{cacheStats.analyticsCacheSize}</div>
          <div className="text-sm text-blue-800">Analytics Cache</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{cacheStats.predictionCacheSize}</div>
          <div className="text-sm text-green-800">Prediction Cache</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{cacheStats.resultCacheSize}</div>
          <div className="text-sm text-purple-800">Result Cache</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{cacheStats.pick3DataCount}</div>
          <div className="text-sm text-orange-800">Pick 3 Draws</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Clear All Button */}
        <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">🚨 Clear ALL Pick 3 Caches</h3>
          <p className="text-red-700 text-sm mb-4">
            This will clear all cached data including analytics, predictions, results, and stored draw data.
            Use this when you want a complete fresh start.
          </p>
          <button
            onClick={clearAllPick3Caches}
            disabled={isClearing}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isClearing ? '🗑️ Clearing All Caches...' : '🗑️ Clear ALL Pick 3 Caches'}
          </button>
        </div>

        {/* Individual Clear Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">📊 Analytics Cache</h4>
            <p className="text-blue-700 text-sm mb-3">
              Clear cached performance, trend, and pattern data
            </p>
            <button
              onClick={clearAnalyticsCache}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear Analytics
            </button>
          </div>

          <div className="border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">🎯 Pick 3 Data</h4>
            <p className="text-orange-700 text-sm mb-3">
              Clear all stored lottery draw data
            </p>
            <button
              onClick={clearPick3Data}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Clear Pick 3 Data
            </button>
          </div>
        </div>
      </div>

      {/* Last Clear Result */}
      {lastClearResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">✅ Last Clear Operation</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>Analytics Cache: {lastClearResult.analyticsCache ? '✅ Cleared' : '❌ Failed'}</div>
            <div>Prediction Cache: {lastClearResult.predictionCache ? '✅ Cleared' : '❌ Failed'}</div>
            <div>Result Cache: {lastClearResult.resultCache ? '✅ Cleared' : '❌ Failed'}</div>
            <div>Pick 3 Data: {lastClearResult.pick3Data ? '✅ Cleared' : '❌ Failed'}</div>
            <div className="text-gray-600 mt-2">
              Completed at: {new Date(lastClearResult.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Cache Information</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Analytics cache expires after 5 minutes</li>
          <li>• Prediction cache expires after 30 minutes</li>
          <li>• Result cache expires after 1 hour</li>
          <li>• Pick 3 data is stored permanently until cleared</li>
          <li>• Clearing cache will force fresh data loading on next analysis</li>
        </ul>
      </div>
    </div>
  );
};