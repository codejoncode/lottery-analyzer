import React, { useState, useEffect } from 'react';
import { PredictionService } from '../services/api';
import type { PredictionStats } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './PredictionTracker.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PredictionTrackerProps {
  gameType?: 'pick3' | 'pick4';
  refreshInterval?: number; // in minutes
}

const PredictionTracker: React.FC<PredictionTrackerProps> = ({
  gameType: _gameType,
  refreshInterval = 5
}) => {
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      const predictionStats = await PredictionService.getPredictionStats();
      setStats(predictionStats);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prediction stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up periodic refresh
    const interval = setInterval(fetchStats, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getAccuracyChartData = () => {
    if (!stats?.performanceTrend) return null;

    return {
      labels: stats.performanceTrend.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Prediction Accuracy',
          data: stats.performanceTrend.map(item => item.accuracy * 100),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Prediction Count',
          data: stats.performanceTrend.map(item => item.count),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
          tension: 0.4,
        }
      ]
    };
  };

  const getAccuracyChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Prediction Accuracy Over Time',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Accuracy (%)'
        },
        min: 0,
        max: 100
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Predictions Count'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  });

  const renderOverviewCards = () => {
    if (!stats) return null;

    return (
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <div className="card-value">{stats.totalPredictions}</div>
            <div className="card-label">Total Predictions</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-value">{(stats.accuracy * 100).toFixed(1)}%</div>
            <div className="card-label">Overall Accuracy</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">🎚️</div>
          <div className="card-content">
            <div className="card-value">{(stats.averageConfidence * 100).toFixed(1)}%</div>
            <div className="card-label">Avg Confidence</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <div className="card-value">
              {stats.performanceTrend.length > 1
                ? (() => {
                    const recent = stats.performanceTrend.slice(-2);
                    const improvement = recent[1].accuracy - recent[0].accuracy;
                    return (
                      <span className={improvement > 0 ? 'positive' : improvement < 0 ? 'negative' : 'neutral'}>
                        {improvement > 0 ? '+' : ''}{(improvement * 100).toFixed(1)}%
                      </span>
                    );
                  })()
                : 'N/A'
              }
            </div>
            <div className="card-label">Recent Trend</div>
          </div>
        </div>
      </div>
    );
  };

  const renderTopStrategies = () => {
    if (!stats?.topStrategies || stats.topStrategies.length === 0) return null;

    return (
      <div className="strategies-section">
        <h3>🏆 Top Performing Strategies</h3>
        <div className="strategies-grid">
          {stats.topStrategies.map((strategy, index) => (
            <div key={strategy.strategy} className="strategy-card">
              <div className="strategy-rank">#{index + 1}</div>
              <div className="strategy-info">
                <div className="strategy-name">{strategy.strategy}</div>
                <div className="strategy-stats">
                  <span className="accuracy">{(strategy.accuracy * 100).toFixed(1)}%</span>
                  <span className="count">({strategy.count} predictions)</span>
                </div>
              </div>
              <div className="strategy-bar">
                <div
                  className="strategy-bar-fill"
                  style={{ width: `${strategy.accuracy * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAccuracyChart = () => {
    const chartData = getAccuracyChartData();
    if (!chartData) return null;

    return (
      <div className="chart-section">
        <div className="chart-container">
          <Line data={chartData} options={getAccuracyChartOptions()} />
        </div>
      </div>
    );
  };

  if (loading && !stats) {
    return (
      <div className="prediction-tracker loading">
        <div className="loading-spinner"></div>
        <p>Loading prediction analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-tracker error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to Load Analytics</h3>
        <p>{error}</p>
        <button onClick={fetchStats} className="retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="prediction-tracker">
      <div className="tracker-header">
        <h2>📊 Prediction Performance Tracker</h2>
        <div className="tracker-meta">
          <span className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button onClick={fetchStats} className="refresh-btn" disabled={loading}>
            {loading ? '🔄' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {renderOverviewCards()}
      {renderAccuracyChart()}
      {renderTopStrategies()}

      <div className="tracker-footer">
        <p className="disclaimer">
          📈 Performance metrics are calculated based on historical prediction accuracy.
          Regular monitoring helps improve prediction algorithms over time.
        </p>
      </div>
    </div>
  );
};

export default PredictionTracker;