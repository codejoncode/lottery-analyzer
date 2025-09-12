import React, { useState, useEffect } from 'react';
import { PredictionEngine } from '../prediction-engine/PredictionEngine';
import { CacheManager } from '../caching/CacheManager';
import { BacktestEngine } from '../backtesting/BacktestEngine';
import { HotColdAnalyzer } from '../prediction-engine/analysis/HotColdAnalyzer';
import { DrawLocationAnalyzer } from '../prediction-engine/analysis/DrawLocationAnalyzer';
import type { Draw } from '../utils/scoringSystem';
import PredictionDashboard from './PredictionDashboard';
import BacktestResults from './BacktestResults';
import CacheMonitor from './CacheMonitor';
import HotColdChart from './HotColdChart';
import DrawLocationChart from './DrawLocationChart';
import ScoringBreakdown from './ScoringBreakdown';
import PerformanceDashboard from './PerformanceDashboard';
import PredictionValidationDashboard from './PredictionValidationDashboard';

interface AnalysisDashboardProps {
  draws: Draw[];
}

type TabType = 'predictions' | 'backtesting' | 'cache' | 'analysis' | 'performance' | 'validation';

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ draws }) => {
  const [activeTab, setActiveTab] = useState<TabType>('predictions');
  const [predictionEngine] = useState(() => new PredictionEngine(draws));
  const [cacheManager] = useState(() => new CacheManager());
  const [backtestEngine] = useState(() => new BacktestEngine(draws));
  const [hotColdAnalyzer] = useState(() => new HotColdAnalyzer(draws));
  const [drawLocationAnalyzer] = useState(() => new DrawLocationAnalyzer(draws));

  const [systemStats, setSystemStats] = useState({
    totalDraws: draws.length,
    lastDrawDate: draws.length > 0 ? draws[draws.length - 1].date : null,
    predictionEngineReady: true,
    cacheEnabled: true,
    backtestingAvailable: draws.length >= 10
  });

  useEffect(() => {
    // Update system stats when draws change
    setSystemStats({
      totalDraws: draws.length,
      lastDrawDate: draws.length > 0 ? draws[draws.length - 1].date : null,
      predictionEngineReady: true,
      cacheEnabled: true,
      backtestingAvailable: draws.length >= 10
    });
  }, [draws]);

  const tabs = [
    { id: 'predictions' as TabType, name: '🎯 Predictions', description: 'Generate and analyze lottery predictions' },
    { id: 'backtesting' as TabType, name: '🧪 Backtesting', description: 'Validate prediction accuracy with historical data' },
    { id: 'cache' as TabType, name: '💾 Cache Monitor', description: 'Monitor cache performance and statistics' },
    { id: 'analysis' as TabType, name: '📊 Analysis Tools', description: 'Advanced analysis and visualization tools' },
    { id: 'performance' as TabType, name: '⚡ Performance', description: 'Monitor system performance and metrics' },
    { id: 'validation' as TabType, name: '🔬 Validation', description: 'Cross-validation and statistical significance testing' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'predictions':
        return <PredictionDashboard />;
      case 'backtesting':
        return <BacktestResults draws={draws} />;
      case 'cache':
        return <CacheMonitor cacheManager={cacheManager} />;
      case 'analysis':
        return (
          <div className="space-y-6">
            {/* Hot/Cold Analysis */}
            <HotColdChart draws={draws} />

            {/* Draw Location Analysis */}
            <DrawLocationChart draws={draws} />

            {/* Scoring Breakdown - Note: This would need combinations data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🧮 Scoring Analysis</h2>
              <p className="text-gray-600 mb-4">
                Detailed scoring breakdown and factor analysis for prediction combinations.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  💡 Generate predictions first to see detailed scoring breakdown and analysis.
                </p>
              </div>
            </div>
          </div>
        );
      case 'performance':
        return <PerformanceDashboard />;
      case 'validation':
        return <PredictionValidationDashboard draws={draws} predictionEngine={predictionEngine} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎰 ApexScoop Lottery Analyzer</h1>
              <p className="text-gray-600 mt-1">Advanced lottery prediction and analysis system</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">System Status</div>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  systemStats.predictionEngineReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {systemStats.predictionEngineReady ? '✅ Engine Ready' : '❌ Engine Offline'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  systemStats.cacheEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {systemStats.cacheEnabled ? '💾 Cache Active' : '💾 Cache Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{systemStats.totalDraws.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Draws</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {systemStats.lastDrawDate ? new Date(systemStats.lastDrawDate).toLocaleDateString() : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Last Draw Date</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {systemStats.backtestingAvailable ? '✅ Available' : '❌ Need More Data'}
            </div>
            <div className="text-sm text-gray-600">Backtesting Status</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">v2.0</div>
            <div className="text-sm text-gray-600">System Version</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6 bg-gray-50">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 ApexScoop Lottery Analyzer - Advanced Prediction System</p>
            <p className="mt-1">Built with React, TypeScript, and Machine Learning</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnalysisDashboard;
