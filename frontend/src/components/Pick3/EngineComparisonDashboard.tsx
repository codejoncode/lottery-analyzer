import React, { useState, useEffect } from 'react';
import { BoxStraightAnalyzer } from './BoxStraightAnalyzer';
import type { Draw } from './BoxStraightAnalyzer';
import './EngineComparisonDashboard.css';

interface EnginePerformance {
  engine: string;
  accuracy: number;
  top10HitRate: number;
  averageConfidence: number;
  totalPredictions: number;
  successfulPredictions: number;
  lastSuccessDraws: number;
  dueFactor: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface ComparisonMetrics {
  superPredictor: EnginePerformance;
  columnEngine: EnginePerformance;
  scoringEngine: EnginePerformance;
  recommendedEngine: string;
  confidence: number;
}

interface EngineComparisonDashboardProps {
  historicalDraws: Draw[];
  className?: string;
}

const EngineComparisonDashboard: React.FC<EngineComparisonDashboardProps> = ({
  historicalDraws,
  className = ''
}) => {
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetrics | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30' | '60' | '90'>('60');
  const [loading, setLoading] = useState(false);

  // const analyzer = useMemo(() => {
  //   return new BoxStraightAnalyzer(historicalDraws);
  // }, [historicalDraws]);

  useEffect(() => {
    if (historicalDraws.length >= 30) {
      generateComparison();
    }
  }, [historicalDraws, selectedTimeframe]);

  const generateComparison = async () => {
    setLoading(true);

    try {
      const timeframe = parseInt(selectedTimeframe);
      const recentDraws = historicalDraws.slice(-timeframe);

      // Simulate performance metrics for existing engines
      const superPredictorMetrics = await simulateSuperPredictorPerformance(recentDraws);
      const columnEngineMetrics = await simulateColumnEnginePerformance(recentDraws);
      const scoringEngineMetrics = await simulateScoringEnginePerformance(recentDraws);

      // Calculate due factors based on recent performance
      const engines = [superPredictorMetrics, columnEngineMetrics, scoringEngineMetrics];
      const avgAccuracy = engines.reduce((sum, e) => sum + e.accuracy, 0) / engines.length;

      engines.forEach(engine => {
        engine.dueFactor = Math.max(0, avgAccuracy - engine.accuracy) * 100;
      });

      // Determine recommended engine
      const sortedEngines = engines.sort((a, b) => b.dueFactor - a.dueFactor);
      const recommendedEngine = sortedEngines[0].engine;
      const confidence = Math.min(1, sortedEngines[0].dueFactor / 50);

      const metrics: ComparisonMetrics = {
        superPredictor: superPredictorMetrics,
        columnEngine: columnEngineMetrics,
        scoringEngine: scoringEngineMetrics,
        recommendedEngine,
        confidence
      };

      setComparisonMetrics(metrics);
    } catch (error) {
      console.error('Error generating comparison:', error);
    }

    setLoading(false);
  };

  const simulateSuperPredictorPerformance = async (draws: Draw[]): Promise<EnginePerformance> => {
    // Simulate Super Predictor performance based on Markov chain analysis
    let totalPredictions = 0;
    let successfulPredictions = 0;
    let totalConfidence = 0;
    let top10Hits = 0;
    let lastSuccessDraws = 0;

    for (let i = 20; i < draws.length; i++) {
      const historicalSubset = draws.slice(0, i);
      const predictor = new BoxStraightAnalyzer(historicalSubset);

      // Generate predictions for the next draw
      const topCombinations = predictor.getTopCombinations(10);
      const actualNextDraw = draws[i];

      totalPredictions++;
      totalConfidence += topCombinations.reduce((sum, combo) => sum + combo.confidence, 0) / topCombinations.length;

      // Check if prediction was in top 10
      const actualCombo = actualNextDraw.digits.join('');
      const predictedCorrectly = topCombinations.some(combo => combo.combination === actualCombo);

      if (predictedCorrectly) {
        successfulPredictions++;
        lastSuccessDraws = 0;
        top10Hits++;
      } else {
        lastSuccessDraws++;
      }
    }

    const accuracy = successfulPredictions / totalPredictions;
    const averageConfidence = totalConfidence / totalPredictions;
    const top10HitRate = top10Hits / totalPredictions;

    return {
      engine: 'Super Predictor',
      accuracy,
      top10HitRate,
      averageConfidence,
      totalPredictions,
      successfulPredictions,
      lastSuccessDraws,
      dueFactor: 0, // Will be calculated later
      trend: determineTrend(accuracy, draws.length)
    };
  };

  const simulateColumnEnginePerformance = async (draws: Draw[]): Promise<EnginePerformance> => {
    // Simulate Column Engine performance (existing engine)
    let totalPredictions = 0;
    let successfulPredictions = 0;
    // let totalConfidence = 0;
    let top10Hits = 0;
    let lastSuccessDraws = 0;

    for (let i = 20; i < draws.length; i++) {
      const historicalSubset = draws.slice(0, i);

      // Simulate column-based prediction (simplified)
      const predictions = generateColumnPredictions(historicalSubset, 10);
      const actualNextDraw = draws[i];

      totalPredictions++;
      // totalConfidence += 0.65; // Column engine typical confidence

      const actualCombo = actualNextDraw.digits.join('');
      const predictedCorrectly = predictions.includes(actualCombo);

      if (predictedCorrectly) {
        successfulPredictions++;
        lastSuccessDraws = 0;
        top10Hits++;
      } else {
        lastSuccessDraws++;
      }
    }

    const accuracy = successfulPredictions / totalPredictions;
    const averageConfidence = 0.65;
    const top10HitRate = top10Hits / totalPredictions;

    return {
      engine: 'Column Engine',
      accuracy,
      top10HitRate,
      averageConfidence,
      totalPredictions,
      successfulPredictions,
      lastSuccessDraws,
      dueFactor: 0,
      trend: determineTrend(accuracy, draws.length)
    };
  };

  const simulateScoringEnginePerformance = async (draws: Draw[]): Promise<EnginePerformance> => {
    // Simulate Scoring Engine performance (existing engine)
    let totalPredictions = 0;
    let successfulPredictions = 0;
    // let totalConfidence = 0;
    let top10Hits = 0;
    let lastSuccessDraws = 0;

    for (let i = 20; i < draws.length; i++) {
      const historicalSubset = draws.slice(0, i);

      // Simulate scoring-based prediction
      const predictions = generateScoringPredictions(historicalSubset, 10);
      const actualNextDraw = draws[i];

      totalPredictions++;
      // totalConfidence += 0.70; // Scoring engine typical confidence

      const actualCombo = actualNextDraw.digits.join('');
      const predictedCorrectly = predictions.includes(actualCombo);

      if (predictedCorrectly) {
        successfulPredictions++;
        lastSuccessDraws = 0;
        top10Hits++;
      } else {
        lastSuccessDraws++;
      }
    }

    const accuracy = successfulPredictions / totalPredictions;
    const averageConfidence = 0.70;
    const top10HitRate = top10Hits / totalPredictions;

    return {
      engine: 'Scoring Engine',
      accuracy,
      top10HitRate,
      averageConfidence,
      totalPredictions,
      successfulPredictions,
      lastSuccessDraws,
      dueFactor: 0,
      trend: determineTrend(accuracy, draws.length)
    };
  };

  const generateColumnPredictions = (draws: Draw[], count: number): string[] => {
    // Simplified column-based prediction logic
    const predictions: string[] = [];
    const lastDraw = draws[draws.length - 1];

    for (let i = 0; i < count; i++) {
      const prediction = [
        (lastDraw.digits[0] + Math.floor(Math.random() * 3) - 1 + 10) % 10,
        (lastDraw.digits[1] + Math.floor(Math.random() * 3) - 1 + 10) % 10,
        (lastDraw.digits[2] + Math.floor(Math.random() * 3) - 1 + 10) % 10
      ];
      predictions.push(prediction.join(''));
    }

    return predictions;
  };

  const generateScoringPredictions = (draws: Draw[], count: number): string[] => {
    // Simplified scoring-based prediction logic
    const predictions: string[] = [];

    for (let i = 0; i < count; i++) {
      const prediction = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ];
      predictions.push(prediction.join(''));
    }

    return predictions;
  };

  const determineTrend = (accuracy: number, _sampleSize: number): 'improving' | 'declining' | 'stable' => {
    // Simplified trend determination
    if (accuracy > 0.15) return 'improving';
    if (accuracy < 0.05) return 'declining';
    return 'stable';
  };

  const getEngineColor = (engine: string) => {
    switch (engine) {
      case 'Super Predictor': return '#667eea';
      case 'Column Engine': return '#764ba2';
      case 'Scoring Engine': return '#f093fb';
      default: return '#6b7280';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#10b981';
      case 'declining': return '#ef4444';
      case 'stable': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`engine-comparison-dashboard ${className}`}>
      <div className="dashboard-header">
        <h3>Engine Comparison Dashboard</h3>
        <p>Compare prediction engine performance and determine which is due</p>

        <div className="timeframe-selector">
          <label>Analysis Period:</label>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '30' | '60' | '90')}
          >
            <option value="30">Last 30 draws</option>
            <option value="60">Last 60 draws</option>
            <option value="90">Last 90 draws</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing engine performance...</p>
        </div>
      ) : !comparisonMetrics ? (
        <div className="insufficient-data">
          <p>Need at least 30 historical draws for comparison analysis.</p>
          <small>Current: {historicalDraws.length} draws</small>
        </div>
      ) : (
        <div className="comparison-content">
          {/* Recommendation Banner */}
          <div className="recommendation-banner">
            <div className="recommendation-content">
              <h4>🎯 Recommended Engine</h4>
              <div
                className="recommended-engine"
                style={{ backgroundColor: getEngineColor(comparisonMetrics.recommendedEngine) }}
              >
                {comparisonMetrics.recommendedEngine}
              </div>
              <div className="confidence-indicator">
                <span>Confidence:</span>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${comparisonMetrics.confidence * 100}%` }}
                  ></div>
                </div>
                <span>{(comparisonMetrics.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Engine Performance Cards */}
          <div className="engines-grid">
            {[comparisonMetrics.superPredictor, comparisonMetrics.columnEngine, comparisonMetrics.scoringEngine].map((engine) => (
              <div
                key={engine.engine}
                className={`engine-card ${engine.engine === comparisonMetrics.recommendedEngine ? 'recommended' : ''}`}
                style={{ borderLeftColor: getEngineColor(engine.engine) }}
              >
                <div className="engine-header">
                  <h4>{engine.engine}</h4>
                  <span
                    className={`trend-badge ${engine.trend}`}
                    style={{ backgroundColor: getTrendColor(engine.trend) }}
                  >
                    {engine.trend.toUpperCase()}
                  </span>
                </div>

                <div className="engine-metrics">
                  <div className="metric">
                    <span className="label">Accuracy:</span>
                    <span className="value">{(engine.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span className="label">Top 10 Hit Rate:</span>
                    <span className="value">{(engine.top10HitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span className="label">Avg Confidence:</span>
                    <span className="value">{(engine.averageConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span className="label">Due Factor:</span>
                    <span className="value">{engine.dueFactor.toFixed(1)}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Last Success:</span>
                    <span className="value">
                      {engine.lastSuccessDraws === 0 ? 'Last draw' : `${engine.lastSuccessDraws} draws ago`}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Total Predictions:</span>
                    <span className="value">{engine.totalPredictions}</span>
                  </div>
                </div>

                <div className="performance-bar">
                  <div className="bar-label">Performance</div>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${engine.accuracy * 100}%`,
                        backgroundColor: getEngineColor(engine.engine)
                      }}
                    ></div>
                  </div>
                  <div className="bar-value">{(engine.accuracy * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Summary */}
          <div className="performance-summary">
            <h4>Performance Summary</h4>
            <div className="summary-grid">
              <div className="summary-card">
                <h5>Best Performing Engine</h5>
                <p className="summary-value">
                  {comparisonMetrics.superPredictor.accuracy > comparisonMetrics.columnEngine.accuracy &&
                   comparisonMetrics.superPredictor.accuracy > comparisonMetrics.scoringEngine.accuracy
                    ? 'Super Predictor'
                    : comparisonMetrics.columnEngine.accuracy > comparisonMetrics.scoringEngine.accuracy
                    ? 'Column Engine'
                    : 'Scoring Engine'
                  }
                </p>
              </div>
              <div className="summary-card">
                <h5>Most Due Engine</h5>
                <p className="summary-value">{comparisonMetrics.recommendedEngine}</p>
              </div>
              <div className="summary-card">
                <h5>Average Accuracy</h5>
                <p className="summary-value">
                  {(((comparisonMetrics.superPredictor.accuracy + comparisonMetrics.columnEngine.accuracy + comparisonMetrics.scoringEngine.accuracy) / 3) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="summary-card">
                <h5>Analysis Period</h5>
                <p className="summary-value">Last {selectedTimeframe} draws</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineComparisonDashboard;