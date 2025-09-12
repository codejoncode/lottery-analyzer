import React, { useState, useEffect } from 'react';
import { pick3DataSyncService } from '../services/Pick3DataSyncService';
import type { SyncResult } from '../services/Pick3DataSyncService';
import type { ColumnAnalysis } from '../services/Pick3DataProcessor';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface DataSyncManagerProps {
  className?: string;
}

const DataSyncManager: React.FC<DataSyncManagerProps> = ({ className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [columnAnalysis, setColumnAnalysis] = useState<ColumnAnalysis[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  const [activeTab, setActiveTab] = useState<'sync' | 'analysis' | 'stats'>('sync');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const processor = pick3DataSyncService.getProcessor();
      const analysis = processor.getColumnStraightData();
      setColumnAnalysis(analysis);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleSyncLatest = async () => {
    setIsLoading(true);
    try {
      const result = await pick3DataSyncService.syncLatestData();
      setLastSyncResult(result);
      setSyncHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

      // Refresh analysis data
      const processor = pick3DataSyncService.getProcessor();
      const analysis = processor.getColumnStraightData();
      setColumnAnalysis(analysis);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncMissing = async () => {
    setIsLoading(true);
    try {
      const result = await pick3DataSyncService.syncMissingData();
      setLastSyncResult(result);
      setSyncHistory(prev => [result, ...prev.slice(0, 9)]);

      // Refresh analysis data
      const processor = pick3DataSyncService.getProcessor();
      const analysis = processor.getColumnStraightData();
      setColumnAnalysis(analysis);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendedHistoricalSync = async () => {
    const confirmed = confirm(
      'This will collect historical data from 2000 to present (25+ years).\n' +
      'This may take several minutes and use significant bandwidth.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await pick3DataSyncService.syncExtendedHistoricalData();
      setLastSyncResult(result);
      setSyncHistory(prev => [result, ...prev.slice(0, 9)]);

      // Refresh analysis data
      const processor = pick3DataSyncService.getProcessor();
      const analysis = processor.getColumnStraightData();
      setColumnAnalysis(analysis);
    } catch (error) {
      console.error('Extended historical sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSync = async () => {
    const startDate = prompt('Enter start date (YYYY-MM-DD):');
    const endDate = prompt('Enter end date (YYYY-MM-DD):');

    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const result = await pick3DataSyncService.syncData({
        startDate,
        endDate,
        forceRefresh: true
      });
      setLastSyncResult(result);
      setSyncHistory(prev => [result, ...prev.slice(0, 9)]);

      // Refresh analysis data
      const processor = pick3DataSyncService.getProcessor();
      const analysis = processor.getColumnStraightData();
      setColumnAnalysis(analysis);
    } catch (error) {
      console.error('Custom sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSyncTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={handleSyncLatest}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Syncing...' : 'Sync Latest Data'}
        </button>

        <button
          onClick={handleSyncMissing}
          disabled={isLoading}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          Fill Missing Data
        </button>

        <button
          onClick={handleCustomSync}
          disabled={isLoading}
          className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          Custom Date Range
        </button>

        <button
          onClick={handleExtendedHistoricalSync}
          disabled={isLoading}
          className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm"
        >
          {isLoading ? 'Collecting...' : 'Extended History (2000+)'}
        </button>
      </div>

      {lastSyncResult && (
        <div className={`p-4 rounded-lg ${lastSyncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`font-semibold ${lastSyncResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {lastSyncResult.success ? '✅ Sync Successful' : '❌ Sync Failed'}
          </h3>
          <div className="mt-2 text-sm">
            <p>New draws: {lastSyncResult.newDraws}</p>
            <p>Updated draws: {lastSyncResult.updatedDraws}</p>
            <p>Duration: {lastSyncResult.duration}ms</p>
            <p>Total draws: {lastSyncResult.stats.totalDraws}</p>
            <p>Complete draws: {lastSyncResult.stats.completeDraws}</p>
            <p>Incomplete draws: {lastSyncResult.stats.incompleteDraws}</p>
          </div>
          {lastSyncResult.errors.length > 0 && (
            <div className="mt-2">
              <h4 className="font-semibold text-red-800">Errors:</h4>
              <ul className="text-sm text-red-700">
                {lastSyncResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {syncHistory.length > 1 && (
        <div>
          <h3 className="font-semibold mb-2">Recent Sync History</h3>
          <div className="space-y-2">
            {syncHistory.slice(1, 5).map((result, index) => (
              <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                {new Date(result.duration).toLocaleString()}: {result.newDraws} new, {result.updatedDraws} updated
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Column Straight Analysis</h3>
        <span className="text-sm text-gray-600">
          {columnAnalysis.length} analysis points
        </span>
      </div>

      {columnAnalysis.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No analysis data available. Sync some data first.
        </div>
      ) : (
        <div className="space-y-4">
          {columnAnalysis.slice(-10).reverse().map((analysis, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">{analysis.date}</h4>
                <span className="text-sm text-gray-600">
                  Confidence: {analysis.predictions.confidence}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                {analysis.columns.map((column, colIndex) => (
                  <div key={colIndex} className="text-center">
                    <div className="font-semibold">Position {column.position}</div>
                    <div className="text-2xl font-bold text-blue-600">{column.digit}</div>
                    <div className="text-xs text-gray-600">
                      Freq: {column.frequency}, Skip: {column.skipCount}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <span className="font-semibold">Next Midday:</span> {analysis.predictions.nextMidday}
                </div>
                <div>
                  <span className="font-semibold">Next Evening:</span> {analysis.predictions.nextEvening}
                </div>
              </div>

              {(analysis.patterns.repeating.length > 0 ||
                analysis.patterns.alternating.length > 0 ||
                analysis.patterns.trending.length > 0) && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-sm">
                    {analysis.patterns.repeating.length > 0 && (
                      <div><span className="font-semibold">Repeating:</span> {analysis.patterns.repeating.join(', ')}</div>
                    )}
                    {analysis.patterns.alternating.length > 0 && (
                      <div><span className="font-semibold">Alternating:</span> {analysis.patterns.alternating.join(', ')}</div>
                    )}
                    {analysis.patterns.trending.length > 0 && (
                      <div><span className="font-semibold">Trending:</span> {analysis.patterns.trending.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => {
    const processor = pick3DataSyncService.getProcessor();
    const stats = processor.getStatistics();
    const dataManager = pick3DataSyncService.getDataManager();
    const dataStats = dataManager.getDataStats();

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Data Overview</h3>
            <div className="space-y-1 text-sm">
              <div>Total Draws: {dataStats.totalDraws}</div>
              <div>Complete Draws: {dataStats.completeDraws}</div>
              <div>Incomplete Draws: {dataStats.incompleteDraws}</div>
              {dataStats.dateRange && (
                <div>Date Range: {dataStats.dateRange.start} to {dataStats.dateRange.end}</div>
              )}
              <div>Last Updated: {new Date(dataStats.lastUpdated).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Analysis Statistics</h3>
            <div className="space-y-1 text-sm">
              <div>Total Analysis Points: {stats.totalDraws}</div>
              <div>Complete Analysis: {stats.completeDraws}</div>
              <div>Most Frequent Digits: {stats.mostFrequentDigits.join(', ')}</div>
              <div>Average Digits: {stats.averageDigits.map(d => d.toFixed(1)).join(', ')}</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Column Analysis</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {stats.mostFrequentDigits.map((digit, position) => (
              <div key={position} className="text-center">
                <div className="font-semibold">Position {position}</div>
                <div className="text-2xl font-bold text-yellow-600">{digit}</div>
                <div className="text-xs">Most frequent</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className={`data-sync-manager ${className}`}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Pick 3 Data Management</h2>

          <div className="flex space-x-1 mb-4">
            {[
              { id: 'sync', label: 'Data Sync' },
              { id: 'analysis', label: 'Analysis' },
              { id: 'stats', label: 'Statistics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner message="Processing data..." size="lg" />
          </div>
        )}

        {!isLoading && (
          <div>
            {activeTab === 'sync' && renderSyncTab()}
            {activeTab === 'analysis' && renderAnalysisTab()}
            {activeTab === 'stats' && renderStatsTab()}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default DataSyncManager;
