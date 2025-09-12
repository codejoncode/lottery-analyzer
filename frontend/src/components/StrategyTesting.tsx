import React, { useState, useEffect } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface StrategyTest {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  results: {
    accuracy: number;
    hitRate: number;
    roi: number;
    confidence: number;
  };
  status: 'pending' | 'running' | 'completed' | 'failed';
}

const StrategyTesting: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyTest[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyTest | null>(null);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const predefinedStrategies: Omit<StrategyTest, 'results' | 'status'>[] = [
    {
      id: 'conservative',
      name: 'Conservative Approach',
      description: 'Focus on high-confidence predictions with lower risk',
      parameters: {
        minConfidence: 0.8,
        maxCombinations: 5,
        weightBalance: 'balanced'
      }
    },
    {
      id: 'aggressive',
      name: 'Aggressive Approach',
      description: 'Higher risk, higher reward with broader predictions',
      parameters: {
        minConfidence: 0.6,
        maxCombinations: 15,
        weightBalance: 'offensive'
      }
    },
    {
      id: 'balanced',
      name: 'Balanced Strategy',
      description: 'Moderate risk with optimized parameter weights',
      parameters: {
        minConfidence: 0.7,
        maxCombinations: 10,
        weightBalance: 'balanced'
      }
    },
    {
      id: 'pattern-based',
      name: 'Pattern Recognition',
      description: 'Heavy emphasis on historical pattern matching',
      parameters: {
        minConfidence: 0.75,
        maxCombinations: 8,
        weightBalance: 'pattern-heavy'
      }
    },
    {
      id: 'statistical',
      name: 'Statistical Analysis',
      description: 'Pure statistical approach with mathematical optimization',
      parameters: {
        minConfidence: 0.65,
        maxCombinations: 12,
        weightBalance: 'statistical'
      }
    }
  ];

  const initializeStrategies = () => {
    const initialStrategies: StrategyTest[] = predefinedStrategies.map(strategy => ({
      ...strategy,
      results: {
        accuracy: 0,
        hitRate: 0,
        roi: 0,
        confidence: 0
      },
      status: 'pending' as const
    }));
    setStrategies(initialStrategies);
  };

  const runStrategyTest = async (strategyId: string) => {
    setRunningTests(prev => new Set(prev).add(strategyId));

    // Update strategy status
    setStrategies(prev => prev.map(strategy =>
      strategy.id === strategyId
        ? { ...strategy, status: 'running' as const }
        : strategy
    ));

    try {
      // Simulate strategy testing with mock results
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      const mockResults = {
        accuracy: 0.6 + Math.random() * 0.3, // 60-90%
        hitRate: 0.1 + Math.random() * 0.2,  // 10-30%
        roi: -50 + Math.random() * 150,      // -50 to +100
        confidence: 0.7 + Math.random() * 0.25 // 70-95%
      };

      setStrategies(prev => prev.map(strategy =>
        strategy.id === strategyId
          ? {
              ...strategy,
              status: 'completed' as const,
              results: mockResults
            }
          : strategy
      ));

      setTestResults(prev => ({
        ...prev,
        [strategyId]: {
          ...mockResults,
          testDate: new Date().toISOString(),
          sampleSize: 100 + Math.floor(Math.random() * 200),
          executionTime: 2000 + Math.random() * 3000
        }
      }));

    } catch (error) {
      setStrategies(prev => prev.map(strategy =>
        strategy.id === strategyId
          ? { ...strategy, status: 'failed' as const }
          : strategy
      ));
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(strategyId);
        return newSet;
      });
    }
  };

  const runAllTests = async () => {
    for (const strategy of strategies) {
      if (strategy.status === 'pending') {
        await runStrategyTest(strategy.id);
      }
    }
  };

  useEffect(() => {
    initializeStrategies();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceColor = (value: number, type: 'accuracy' | 'roi' | 'hitRate') => {
    if (type === 'accuracy') {
      if (value >= 0.8) return 'text-green-600';
      if (value >= 0.6) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'roi') {
      if (value >= 50) return 'text-green-600';
      if (value >= 0) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'hitRate') {
      if (value >= 0.25) return 'text-green-600';
      if (value >= 0.15) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🧪 Strategy Testing</h2>
        <p className="text-gray-600 mb-4">
          Test and compare different prediction strategies against historical data
        </p>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={runAllTests}
            disabled={runningTests.size > 0}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {runningTests.size > 0 ? '🔄 Running Tests...' : '🚀 Run All Tests'}
          </button>

          <button
            onClick={initializeStrategies}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🔄 Reset Tests
          </button>
        </div>
      </div>

      {/* Strategy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedStrategy(strategy)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-sm">{strategy.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(strategy.status)}`}>
                {strategy.status.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>

            {strategy.status === 'completed' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className={`font-medium ${getPerformanceColor(strategy.results.accuracy, 'accuracy')}`}>
                    {(strategy.results.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Hit Rate:</span>
                  <span className={`font-medium ${getPerformanceColor(strategy.results.hitRate, 'hitRate')}`}>
                    {(strategy.results.hitRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">ROI:</span>
                  <span className={`font-medium ${getPerformanceColor(strategy.results.roi, 'roi')}`}>
                    {strategy.results.roi >= 0 ? '+' : ''}{strategy.results.roi.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {runningTests.has(strategy.id) && (
              <div className="mt-3">
                <div className="animate-pulse bg-blue-200 h-2 rounded"></div>
                <p className="text-xs text-blue-600 mt-1">Testing in progress...</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Test Results Summary */}
      {strategies.some(s => s.status === 'completed') && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">📊 Test Results Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(strategies
                  .filter(s => s.status === 'completed')
                  .reduce((sum, s) => sum + s.results.accuracy, 0) /
                  strategies.filter(s => s.status === 'completed').length * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(strategies
                  .filter(s => s.status === 'completed')
                  .reduce((sum, s) => sum + s.results.hitRate, 0) /
                  strategies.filter(s => s.status === 'completed').length * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {strategies
                  .filter(s => s.status === 'completed')
                  .reduce((sum, s) => sum + s.results.roi, 0) /
                  strategies.filter(s => s.status === 'completed').length >= 0 ? '+' : ''}
                {(strategies
                  .filter(s => s.status === 'completed')
                  .reduce((sum, s) => sum + s.results.roi, 0) /
                  strategies.filter(s => s.status === 'completed').length).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Avg ROI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {strategies.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Tests Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{selectedStrategy.name}</h3>
                <button
                  onClick={() => setSelectedStrategy(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Strategy Overview</h4>
                  <p className="text-gray-700 mb-4">{selectedStrategy.description}</p>

                  <h5 className="font-medium mb-2">Parameters:</h5>
                  <div className="space-y-2">
                    {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                        </span>
                        <span className="text-sm text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Test Results</h4>
                  {selectedStrategy.status === 'completed' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">
                            {(selectedStrategy.results.accuracy * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Accuracy</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">
                            {(selectedStrategy.results.hitRate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Hit Rate</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {selectedStrategy.results.roi >= 0 ? '+' : ''}{selectedStrategy.results.roi.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">ROI</div>
                        </div>
                        <div className="text-center p-4 bg-indigo-50 rounded">
                          <div className="text-2xl font-bold text-indigo-600">
                            {(selectedStrategy.results.confidence * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">Confidence</div>
                        </div>
                      </div>

                      {testResults[selectedStrategy.id] && (
                        <div className="mt-4 p-4 bg-gray-50 rounded">
                          <h5 className="font-medium mb-2">Detailed Metrics:</h5>
                          <div className="text-sm space-y-1">
                            <div>Sample Size: {testResults[selectedStrategy.id].sampleSize} draws</div>
                            <div>Execution Time: {(testResults[selectedStrategy.id].executionTime / 1000).toFixed(1)}s</div>
                            <div>Test Date: {new Date(testResults[selectedStrategy.id].testDate).toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {selectedStrategy.status === 'running' ? (
                        <div>
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-4 text-gray-600">Running strategy test...</p>
                        </div>
                      ) : (
                        <div>
                          <button
                            onClick={() => runStrategyTest(selectedStrategy.id)}
                            disabled={runningTests.has(selectedStrategy.id)}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {runningTests.has(selectedStrategy.id) ? '🔄 Testing...' : '🧪 Run Test'}
                          </button>
                          <p className="mt-4 text-gray-600">Click to run this strategy test</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyTesting;
