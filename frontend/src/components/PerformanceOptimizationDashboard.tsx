import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '../utils/performanceMonitor';
import { performanceOptimizer } from '../utils/performanceOptimizer';
import { computationTimeMonitor } from '../utils/computationTimeMonitor';
import { memoryOptimizer } from '../utils/memoryOptimizer';
import { comboGenerator } from '../utils/optimizedComboGenerator';

interface OptimizationMetrics {
  performance: any;
  computation: any;
  memory: any;
  comboGeneration: any;
}

export const PerformanceOptimizationDashboard: React.FC = () => {
  const performanceMonitor = usePerformanceMonitor();
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);

  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    const optimizationStatus = performanceMonitor.getOptimizationStatus();
    const comboStats = comboGenerator.getCacheStats();

    setMetrics({
      performance: optimizationStatus.performanceOptimizer,
      computation: optimizationStatus.computationMonitor,
      memory: optimizationStatus.memoryOptimizer,
      comboGeneration: comboStats
    });
  };

  const handleOptimizationToggle = (enabled: boolean) => {
    setOptimizationEnabled(enabled);
    performanceMonitor.setOptimizationEnabled(enabled);
  };

  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    try {
      performanceMonitor.optimizePerformance();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for optimization
      updateMetrics();
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (!metrics) {
    return (
      <div className="performance-dashboard">
        <div className="loading">Loading performance metrics...</div>
      </div>
    );
  }

  return (
    <div className="performance-optimization-dashboard">
      <div className="dashboard-header">
        <h2>🚀 Performance Optimization Dashboard</h2>
        <div className="controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={optimizationEnabled}
              onChange={(e) => handleOptimizationToggle(e.target.checked)}
            />
            Enable Optimization
          </label>
          <button
            onClick={handleRunOptimization}
            disabled={isOptimizing || !optimizationEnabled}
            className="optimize-btn"
          >
            {isOptimizing ? '🔄 Optimizing...' : '⚡ Run Optimization'}
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Performance Optimizer Metrics */}
        <div className="metric-card">
          <h3>⚡ Performance Optimizer</h3>
          <div className="metric-grid">
            <div className="metric">
              <span className="label">Total Operations:</span>
              <span className="value">{metrics.performance?.totalOperations || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Avg Duration:</span>
              <span className="value">{formatDuration(metrics.performance?.averageDuration || 0)}</span>
            </div>
            <div className="metric">
              <span className="label">Memory Efficiency:</span>
              <span className="value">{((metrics.performance?.memoryEfficiency || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">Slowest Operation:</span>
              <span className="value">{metrics.performance?.slowestOperation || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Computation Monitor Metrics */}
        <div className="metric-card">
          <h3>🧮 Computation Monitor</h3>
          <div className="metric-grid">
            <div className="metric">
              <span className="label">Total Operations:</span>
              <span className="value">{metrics.computation?.totalOperations || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Active Operations:</span>
              <span className="value">{metrics.computation?.activeOperations || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Success Rate:</span>
              <span className="value">{((metrics.computation?.successRate || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">Performance Alerts:</span>
              <span className="value">{metrics.computation?.totalAlerts || 0}</span>
            </div>
          </div>
        </div>

        {/* Memory Optimizer Metrics */}
        <div className="metric-card">
          <h3>💾 Memory Optimizer</h3>
          <div className="metric-grid">
            <div className="metric">
              <span className="label">Used Memory:</span>
              <span className="value">{formatBytes(metrics.memory?.used || 0)}</span>
            </div>
            <div className="metric">
              <span className="label">Memory Efficiency:</span>
              <span className="value">{((metrics.memory?.efficiency || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">Fragmentation:</span>
              <span className="value">{((metrics.memory?.fragmentation || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">Compressed Data:</span>
              <span className="value">{metrics.memory?.compressedDataCount || 0} items</span>
            </div>
          </div>
        </div>

        {/* Combo Generation Metrics */}
        <div className="metric-card">
          <h3>🎯 Combo Generator</h3>
          <div className="metric-grid">
            <div className="metric">
              <span className="label">Cached Results:</span>
              <span className="value">{metrics.comboGeneration?.cachedResults || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Lazy Generators:</span>
              <span className="value">{metrics.comboGeneration?.lazyGenerators || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Memory Usage:</span>
              <span className="value">{formatBytes(metrics.comboGeneration?.totalMemoryUsage || 0)}</span>
            </div>
            <div className="metric">
              <span className="label">Cache Hit Rate:</span>
              <span className="value">
                {metrics.comboGeneration?.cachedResults > 0 ?
                  `${((metrics.comboGeneration.cachedResults / (metrics.comboGeneration.cachedResults + metrics.comboGeneration.lazyGenerators)) * 100).toFixed(1)}%` :
                  '0%'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Recommendations */}
      {optimizationEnabled && (
        <div className="recommendations-card">
          <h3>💡 Optimization Recommendations</h3>
          <div className="recommendations">
            {metrics.memory?.efficiency < 0.5 && (
              <div className="recommendation warning">
                ⚠️ Memory efficiency is low. Consider reducing cache sizes or implementing data compression.
              </div>
            )}
            {metrics.memory?.fragmentation > 0.7 && (
              <div className="recommendation warning">
                ⚠️ High memory fragmentation detected. Consider defragmenting data structures.
              </div>
            )}
            {metrics.computation?.totalAlerts > 0 && (
              <div className="recommendation alert">
                🚨 {metrics.computation.totalAlerts} performance alerts detected. Check slow operations.
              </div>
            )}
            {metrics.performance?.averageDuration > 1000 && (
              <div className="recommendation info">
                ℹ️ Average operation time is high. Consider parallel processing or caching.
              </div>
            )}
            {metrics.comboGeneration?.cachedResults === 0 && (
              <div className="recommendation info">
                ℹ️ No cached combo results. Consider enabling caching for better performance.
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .performance-optimization-dashboard {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .dashboard-header h2 {
          margin: 0;
          color: #2c3e50;
        }

        .controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .optimize-btn {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .optimize-btn:hover:not(:disabled) {
          background: #0056b3;
        }

        .optimize-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .metric-card h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
          font-size: 16px;
        }

        .metric-grid {
          display: grid;
          gap: 10px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .metric:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 500;
          color: #666;
        }

        .value {
          font-weight: 600;
          color: #2c3e50;
        }

        .recommendations-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .recommendations-card h3 {
          margin: 0 0 15px 0;
          color: #2c3e50;
        }

        .recommendations {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .recommendation {
          padding: 12px;
          border-radius: 4px;
          font-size: 14px;
        }

        .recommendation.warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          color: #856404;
        }

        .recommendation.alert {
          background: #f8d7da;
          border-left: 4px solid #dc3545;
          color: #721c24;
        }

        .recommendation.info {
          background: #d1ecf1;
          border-left: 4px solid #17a2b8;
          color: #0c5460;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
      `}</style>
    </div>
  );
};
