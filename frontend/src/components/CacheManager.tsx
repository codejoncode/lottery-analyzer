import React, { useState, useEffect } from 'react';
import { DataManager } from '../utils/scoringSystem';

interface CacheInfo {
  size: number;
  lastUpdated: string;
  isValid: boolean;
}

export const CacheManager: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = () => {
    const dataManager = DataManager.getInstance();
    const info = dataManager.getCacheInfo();
    setCacheInfo(info);
  };

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear the cache? This will remove all cached draw data.')) {
      const dataManager = DataManager.getInstance();
      dataManager.clearCache();
      loadCacheInfo();
      alert('Cache cleared successfully!');
    }
  };

  const handleRefreshCache = async () => {
    setIsLoading(true);
    try {
      const dataManager = DataManager.getInstance();
      await dataManager.loadCSVFromFile();
      loadCacheInfo();
      alert('Cache refreshed from CSV file!');
    } catch (error) {
      alert('Failed to refresh cache. Please try again.');
      console.error('Error refreshing cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!cacheInfo) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cache Management</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Cache Size</h3>
            <p className="text-2xl font-bold text-gray-900">{formatBytes(cacheInfo.size)}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Updated</h3>
            <p className="text-lg font-semibold text-gray-900">{cacheInfo.lastUpdated}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</h3>
            <p className={`text-lg font-semibold ${cacheInfo.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {cacheInfo.isValid ? 'Valid' : 'Expired'}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefreshCache}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh from CSV'}
            </button>

            <button
              onClick={handleClearCache}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Clear Cache
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Cache Information</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Cache automatically expires after 24 hours</li>
            <li>• Data is stored locally in your browser</li>
            <li>• Clearing cache will reload data from CSV file</li>
            <li>• Refreshing updates cache with latest CSV data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
