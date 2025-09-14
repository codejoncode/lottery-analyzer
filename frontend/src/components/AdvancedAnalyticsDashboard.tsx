import React, { useState, useEffect } from 'react';
import { advancedAnalytics, performAdvancedAnalytics, type AdvancedAnalyticsResult } from '../utils/advancedAnalytics';
import type { Draw } from '../utils/scoringSystem';

interface AdvancedAnalyticsDashboardProps {
  draws: Draw[];
  onAnalyticsComplete?: (results: AdvancedAnalyticsResult) => void;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  draws,
  onAnalyticsComplete
}) => {
  const [analyticsResults, setAnalyticsResults] = useState<AdvancedAnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'correlations' | 'seasonal' | 'trends' | 'models' | 'insights'>('insights');

  useEffect(() => {
    if (draws.length > 0) {
      runAnalytics();
    }
  }, [draws]);

  const runAnalytics = async () => {
    if (draws.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await performAdvancedAnalytics(draws);
      setAnalyticsResults(results);
      onAnalyticsComplete?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform advanced analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    advancedAnalytics.clearCache();
    setAnalyticsResults(null);
  };

  const exportResults = () => {
    if (!analyticsResults) return;

    const dataStr = advancedAnalytics.exportResults();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'advanced-analytics-results.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="advanced-analytics-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>🔬 Performing advanced analytics on {draws.length} draws...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="advanced-analytics-dashboard">
        <div className="error-container">
          <h3>❌ Analytics Error</h3>
          <p>{error}</p>
          <button onClick={runAnalytics} className="retry-button">
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsResults) {
    return (
      <div className="advanced-analytics-dashboard">
        <div className="empty-state">
          <h3>📊 Advanced Analytics</h3>
          <p>Load lottery data to perform comprehensive analytics including correlations, seasonal patterns, and trend analysis.</p>
          {draws.length > 0 && (
            <button onClick={runAnalytics} className="run-analytics-button">
              Run Advanced Analytics
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-analytics-dashboard">
      <div className="analytics-header">
        <h2>🔬 Advanced Analytics Dashboard</h2>
        <div className="analytics-controls">
          <button onClick={runAnalytics} className="refresh-button">
            🔄 Refresh
          </button>
          <button onClick={clearCache} className="clear-cache-button">
            🧹 Clear Cache
          </button>
          <button onClick={exportResults} className="export-button">
            📥 Export Results
          </button>
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={selectedTab === 'insights' ? 'active' : ''}
          onClick={() => setSelectedTab('insights')}
        >
          💡 Insights
        </button>
        <button
          className={selectedTab === 'correlations' ? 'active' : ''}
          onClick={() => setSelectedTab('correlations')}
        >
          🔗 Correlations ({analyticsResults.correlations.length})
        </button>
        <button
          className={selectedTab === 'seasonal' ? 'active' : ''}
          onClick={() => setSelectedTab('seasonal')}
        >
          📅 Seasonal ({analyticsResults.seasonalPatterns.length})
        </button>
        <button
          className={selectedTab === 'trends' ? 'active' : ''}
          onClick={() => setSelectedTab('trends')}
        >
          📈 Trends ({analyticsResults.trends.length})
        </button>
        <button
          className={selectedTab === 'models' ? 'active' : ''}
          onClick={() => setSelectedTab('models')}
        >
          🤖 Models ({analyticsResults.modelComparisons.length})
        </button>
      </div>

      <div className="analytics-content">
        {selectedTab === 'insights' && (
          <div className="insights-tab">
            <h3>🎯 Key Insights</h3>
            <div className="insights-list">
              {analyticsResults.insights.map((insight, index) => (
                <div key={index} className="insight-item">
                  {insight}
                </div>
              ))}
            </div>

            <h3>💡 Recommendations</h3>
            <div className="recommendations-list">
              {analyticsResults.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'correlations' && (
          <div className="correlations-tab">
            <h3>🔗 Factor Correlations</h3>
            <div className="correlations-grid">
              {analyticsResults.correlations.slice(0, 10).map((corr, index) => (
                <div key={index} className="correlation-card">
                  <div className="correlation-header">
                    <span className="factors">{corr.factor1} ↔ {corr.factor2}</span>
                    <span className={`strength ${corr.strength}`}>
                      {corr.strength}
                    </span>
                  </div>
                  <div className="correlation-details">
                    <div className="correlation-value">
                      Correlation: {(corr.correlation * 100).toFixed(1)}%
                    </div>
                    <div className="significance">
                      Significance: {(corr.significance * 100).toFixed(1)}%
                    </div>
                    <div className="sample-size">
                      Sample Size: {corr.sampleSize}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'seasonal' && (
          <div className="seasonal-tab">
            <h3>📅 Seasonal Patterns</h3>
            <div className="seasonal-patterns">
              {analyticsResults.seasonalPatterns.map((pattern, index) => (
                <div key={index} className="seasonal-card">
                  <div className="pattern-header">
                    <h4>{pattern.pattern}</h4>
                    <span className="confidence">
                      Confidence: {(pattern.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="pattern-description">{pattern.description}</p>
                  <div className="pattern-stats">
                    <span>Period: {pattern.period}</span>
                    <span>Frequency: {pattern.frequency}</span>
                  </div>
                </div>
              ))}
              {analyticsResults.seasonalPatterns.length === 0 && (
                <p className="no-patterns">No significant seasonal patterns detected in the current dataset.</p>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'trends' && (
          <div className="trends-tab">
            <h3>📈 Trend Analysis</h3>
            <div className="trends-grid">
              {analyticsResults.trends.map((trend, index) => (
                <div key={index} className="trend-card">
                  <div className="trend-header">
                    <h4>{trend.factor}</h4>
                    <span className={`trend-direction ${trend.trend}`}>
                      {trend.trend.toUpperCase()}
                    </span>
                  </div>
                  <p className="trend-description">{trend.description}</p>
                  <div className="trend-metrics">
                    <div className="metric">
                      <span className="label">Slope:</span>
                      <span className="value">{trend.slope.toFixed(4)}</span>
                    </div>
                    <div className="metric">
                      <span className="label">R²:</span>
                      <span className="value">{(trend.r2 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="metric">
                      <span className="label">Confidence:</span>
                      <span className="value">{(trend.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  {trend.forecast.length > 0 && (
                    <div className="forecast">
                      <h5>10-Period Forecast:</h5>
                      <div className="forecast-values">
                        {trend.forecast.map((value, i) => (
                          <span key={i} className="forecast-value">{value}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'models' && (
          <div className="models-tab">
            <h3>🤖 Model Comparison</h3>
            <div className="models-comparison">
              {analyticsResults.modelComparisons.map((model, index) => (
                <div key={index} className="model-card">
                  <div className="model-header">
                    <h4>{model.modelName}</h4>
                    <div className="model-score">
                      <span className="accuracy">{(model.accuracy * 100).toFixed(1)}%</span>
                      <span className="label">Accuracy</span>
                    </div>
                  </div>

                  <div className="model-metrics">
                    <div className="metric-row">
                      <div className="metric">
                        <span className="label">Precision:</span>
                        <span className="value">{(model.precision * 100).toFixed(1)}%</span>
                      </div>
                      <div className="metric">
                        <span className="label">Recall:</span>
                        <span className="value">{(model.recall * 100).toFixed(1)}%</span>
                      </div>
                      <div className="metric">
                        <span className="label">F1-Score:</span>
                        <span className="value">{(model.f1Score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="model-insights">
                    <div className="strengths">
                      <h5>✅ Strengths</h5>
                      <ul>
                        {model.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="weaknesses">
                      <h5>⚠️ Weaknesses</h5>
                      <ul>
                        {model.weaknesses.map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="best-use-case">
                    <h5>🎯 Best Use Case</h5>
                    <p>{model.bestUseCase}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
