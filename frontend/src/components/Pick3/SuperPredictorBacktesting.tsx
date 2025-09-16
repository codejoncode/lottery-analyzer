import React, { useState, useEffect } from 'react';
import { BoxStraightAnalyzer } from './BoxStraightAnalyzer';
import type { Draw } from './BoxStraightAnalyzer';
import './SuperPredictorBacktesting.css';

interface BacktestResult {
  drawNumber: number;
  date: string;
  actualDraw: string;
  predictedTop10: string[];
  predictedTop5: string[];
  predictedTop1: string;
  hitPosition: number; // 0 = no hit, 1-10 = position in predictions
  confidence: number;
  accuracy: number;
  straightHit: boolean;
  boxHit: boolean;
  pairHit: boolean;
}

interface BacktestSummary {
  totalTests: number;
  overallAccuracy: number;
  top10HitRate: number;
  top5HitRate: number;
  top1HitRate: number;
  straightAccuracy: number;
  boxAccuracy: number;
  pairAccuracy: number;
  averageConfidence: number;
  bestDraw: BacktestResult | null;
  worstDraw: BacktestResult | null;
  recentPerformance: number[]; // Last 20 test accuracies
  performanceTrend: 'improving' | 'declining' | 'stable';
}

interface SuperPredictorBacktestingProps {
  historicalDraws: Draw[];
  className?: string;
}

const SuperPredictorBacktesting: React.FC<SuperPredictorBacktestingProps> = ({
  historicalDraws,
  className = ''
}) => {
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [backtestPeriod, setBacktestPeriod] = useState<'30' | '60' | '90' | 'all'>('60');

  // const analyzer = useMemo(() => {
  //   return new BoxStraightAnalyzer(historicalDraws);
  // }, [historicalDraws]);

  useEffect(() => {
    if (historicalDraws.length >= 30) {
      runBacktesting();
    }
  }, [historicalDraws, backtestPeriod]);

  const runBacktesting = async () => {
    setLoading(true);

    try {
      const results: BacktestResult[] = [];
      const testDraws = getTestDraws();

      for (let i = 20; i < testDraws.length; i++) {
        const historicalSubset = testDraws.slice(0, i);
        const predictor = new BoxStraightAnalyzer(historicalSubset);

        // Generate predictions for the next draw
        const topCombinations = predictor.getTopCombinations(10);
        const actualNextDraw = testDraws[i];
        const actualCombination = actualNextDraw.digits.join('');

        // Find hit position
        let hitPosition = 0;
        for (let j = 0; j < topCombinations.length; j++) {
          if (topCombinations[j].combination === actualCombination) {
            hitPosition = j + 1;
            break;
          }
        }

        // Calculate different types of hits
        const straightHit = hitPosition === 1;
        const boxHit = topCombinations.some(combo => {
          const sortedPredicted = [...combo.combination.split('').map(Number)].sort().join('');
          const sortedActual = [...actualNextDraw.digits].sort().join('');
          return sortedPredicted === sortedActual;
        });

        const pairHit = topCombinations.some(combo => {
          const predictedDigits = combo.combination.split('').map(Number);
          const actualDigits = actualNextDraw.digits;
          const matchingPairs = predictedDigits.filter(digit =>
            actualDigits.includes(digit)
          );
          return matchingPairs.length >= 2;
        });

        // Calculate confidence and accuracy
        const confidence = topCombinations.length > 0 ? topCombinations[0].confidence : 0;
        const accuracy = hitPosition > 0 ? (11 - hitPosition) / 10 : 0; // Higher score for better positions

        const result: BacktestResult = {
          drawNumber: actualNextDraw.drawNumber || i,
          date: actualNextDraw.date,
          actualDraw: actualCombination,
          predictedTop10: topCombinations.map(c => c.combination),
          predictedTop5: topCombinations.slice(0, 5).map(c => c.combination),
          predictedTop1: topCombinations[0]?.combination || '',
          hitPosition,
          confidence,
          accuracy,
          straightHit,
          boxHit,
          pairHit
        };

        results.push(result);
      }

      setBacktestResults(results);
      calculateSummary(results);
    } catch (error) {
      console.error('Error running backtesting:', error);
    }

    setLoading(false);
  };

  const getTestDraws = (): Draw[] => {
    const period = parseInt(backtestPeriod === 'all' ? '999' : backtestPeriod);
    return historicalDraws.slice(-Math.min(period + 20, historicalDraws.length));
  };

  const calculateSummary = (results: BacktestResult[]) => {
    if (results.length === 0) return;

    const totalTests = results.length;
    const top10Hits = results.filter(r => r.hitPosition > 0).length;
    const top5Hits = results.filter(r => r.hitPosition > 0 && r.hitPosition <= 5).length;
    const top1Hits = results.filter(r => r.hitPosition === 1).length;
    const straightHits = results.filter(r => r.straightHit).length;
    const boxHits = results.filter(r => r.boxHit).length;
    const pairHits = results.filter(r => r.pairHit).length;

    const overallAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;

    // Find best and worst draws
    const bestDraw = results.reduce((best, current) =>
      current.accuracy > best.accuracy ? current : best
    );
    const worstDraw = results.reduce((worst, current) =>
      current.accuracy < worst.accuracy ? current : worst
    );

    // Calculate recent performance (last 20 tests)
    const recentResults = results.slice(-20);
    const recentPerformance = recentResults.map(r => r.accuracy);

    // Determine performance trend
    const firstHalf = recentPerformance.slice(0, 10);
    const secondHalf = recentPerformance.slice(10);
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let performanceTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 0.05) {
      performanceTrend = 'improving';
    } else if (secondHalfAvg < firstHalfAvg - 0.05) {
      performanceTrend = 'declining';
    }

    const summary: BacktestSummary = {
      totalTests,
      overallAccuracy,
      top10HitRate: top10Hits / totalTests,
      top5HitRate: top5Hits / totalTests,
      top1HitRate: top1Hits / totalTests,
      straightAccuracy: straightHits / totalTests,
      boxAccuracy: boxHits / totalTests,
      pairAccuracy: pairHits / totalTests,
      averageConfidence,
      bestDraw,
      worstDraw,
      recentPerformance,
      performanceTrend
    };

    setSummary(summary);
  };

  const getHitPositionColor = (position: number) => {
    if (position === 0) return '#ef4444';
    if (position === 1) return '#10b981';
    if (position <= 5) return '#f59e0b';
    return '#3b82f6';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#10b981';
      case 'declining': return '#ef4444';
      case 'stable': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`super-predictor-backtesting ${className}`}>
      <div className="backtesting-header">
        <h3>Super Predictor Backtesting</h3>
        <p>Detailed performance analysis and success rate tracking</p>

        <div className="period-selector">
          <label>Test Period:</label>
          <select
            value={backtestPeriod}
            onChange={(e) => setBacktestPeriod(e.target.value as '30' | '60' | '90' | 'all')}
          >
            <option value="30">Last 30 draws</option>
            <option value="60">Last 60 draws</option>
            <option value="90">Last 90 draws</option>
            <option value="all">All available</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Running backtesting analysis...</p>
        </div>
      ) : !summary ? (
        <div className="insufficient-data">
          <p>Need at least 30 historical draws for backtesting.</p>
          <small>Current: {historicalDraws.length} draws</small>
        </div>
      ) : (
        <div className="backtesting-content">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Overall Accuracy</h4>
              <div className="metric-value">{(summary.overallAccuracy * 100).toFixed(1)}%</div>
              <div className="metric-label">{summary.totalTests} tests</div>
            </div>

            <div className="summary-card">
              <h4>Top 10 Hit Rate</h4>
              <div className="metric-value">{(summary.top10HitRate * 100).toFixed(1)}%</div>
              <div className="metric-label">{Math.round(summary.top10HitRate * summary.totalTests)} hits</div>
            </div>

            <div className="summary-card">
              <h4>Top 5 Hit Rate</h4>
              <div className="metric-value">{(summary.top5HitRate * 100).toFixed(1)}%</div>
              <div className="metric-label">{Math.round(summary.top5HitRate * summary.totalTests)} hits</div>
            </div>

            <div className="summary-card">
              <h4>Top 1 Hit Rate</h4>
              <div className="metric-value">{(summary.top1HitRate * 100).toFixed(1)}%</div>
              <div className="metric-label">{Math.round(summary.top1HitRate * summary.totalTests)} perfect hits</div>
            </div>

            <div className="summary-card">
              <h4>Straight Accuracy</h4>
              <div className="metric-value">{(summary.straightAccuracy * 100).toFixed(1)}%</div>
              <div className="metric-label">{Math.round(summary.straightAccuracy * summary.totalTests)} straight hits</div>
            </div>

            <div className="summary-card">
              <h4>Box Accuracy</h4>
              <div className="metric-value">{(summary.boxAccuracy * 100).toFixed(1)}%</div>
              <div className="metric-label">{Math.round(summary.boxAccuracy * summary.totalTests)} box hits</div>
            </div>
          </div>

          {/* Performance Trend */}
          <div className="performance-trend">
            <h4>Performance Trend</h4>
            <div className="trend-indicator">
              <span
                className={`trend-badge ${summary.performanceTrend}`}
                style={{ backgroundColor: getTrendColor(summary.performanceTrend) }}
              >
                {summary.performanceTrend.toUpperCase()}
              </span>
              <span className="trend-description">
                Based on recent {summary.recentPerformance.length} tests
              </span>
            </div>

            <div className="recent-performance-chart">
              <div className="chart-bars">
                {summary.recentPerformance.map((accuracy, index) => (
                  <div
                    key={index}
                    className="performance-bar"
                    style={{
                      height: `${accuracy * 100}%`,
                      backgroundColor: accuracy > 0.5 ? '#10b981' : accuracy > 0.2 ? '#f59e0b' : '#ef4444'
                    }}
                    title={`Test ${index + 1}: ${(accuracy * 100).toFixed(1)}%`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Best and Worst Draws */}
          {(summary.bestDraw || summary.worstDraw) && (
            <div className="extreme-draws">
              <h4>Notable Results</h4>
              <div className="draws-grid">
                {summary.bestDraw && (
                  <div className="extreme-draw best">
                    <h5>🏆 Best Performance</h5>
                    <div className="draw-info">
                      <div className="draw-number">Draw #{summary.bestDraw.drawNumber}</div>
                      <div className="draw-date">{summary.bestDraw.date}</div>
                      <div className="actual-draw">{summary.bestDraw.actualDraw}</div>
                      <div className="accuracy">{(summary.bestDraw.accuracy * 100).toFixed(1)}% accuracy</div>
                      <div className="position">Hit position: #{summary.bestDraw.hitPosition}</div>
                    </div>
                  </div>
                )}

                {summary.worstDraw && (
                  <div className="extreme-draw worst">
                    <h5>📉 Worst Performance</h5>
                    <div className="draw-info">
                      <div className="draw-number">Draw #{summary.worstDraw.drawNumber}</div>
                      <div className="draw-date">{summary.worstDraw.date}</div>
                      <div className="actual-draw">{summary.worstDraw.actualDraw}</div>
                      <div className="accuracy">{(summary.worstDraw.accuracy * 100).toFixed(1)}% accuracy</div>
                      <div className="position">
                        {summary.worstDraw.hitPosition === 0 ? 'No hit in top 10' : `Hit position: #${summary.worstDraw.hitPosition}`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Results Table */}
          <div className="results-table-container">
            <h4>Detailed Results ({backtestResults.length} tests)</h4>
            <div className="results-table">
              <div className="table-header">
                <div>Draw #</div>
                <div>Date</div>
                <div>Actual</div>
                <div>Hit Position</div>
                <div>Accuracy</div>
                <div>Hits</div>
                <div>Actions</div>
              </div>

              {backtestResults.slice(-20).reverse().map((result) => (
                <div
                  key={result.drawNumber}
                  className={`table-row ${selectedResult?.drawNumber === result.drawNumber ? 'selected' : ''}`}
                  onClick={() => setSelectedResult(result)}
                >
                  <div>{result.drawNumber}</div>
                  <div>{result.date}</div>
                  <div className="actual-draw-cell">{result.actualDraw}</div>
                  <div>
                    <span
                      className="hit-position"
                      style={{ backgroundColor: getHitPositionColor(result.hitPosition) }}
                    >
                      {result.hitPosition === 0 ? 'Miss' : `#${result.hitPosition}`}
                    </span>
                  </div>
                  <div>{(result.accuracy * 100).toFixed(1)}%</div>
                  <div className="hits-cell">
                    {result.straightHit && <span className="hit-badge straight">S</span>}
                    {result.boxHit && <span className="hit-badge box">B</span>}
                    {result.pairHit && <span className="hit-badge pair">P</span>}
                  </div>
                  <div>
                    <button
                      className="details-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedResult(result);
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Result Modal */}
          {selectedResult && (
            <div className="result-details-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h4>Draw #{selectedResult.drawNumber} Details</h4>
                  <button
                    className="close-button"
                    onClick={() => setSelectedResult(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  <div className="detail-section">
                    <h5>Draw Information</h5>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Date:</span>
                        <span className="value">{selectedResult.date}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Actual Draw:</span>
                        <span className="value actual-draw">{selectedResult.actualDraw}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Hit Position:</span>
                        <span
                          className="value hit-position-detail"
                          style={{ backgroundColor: getHitPositionColor(selectedResult.hitPosition) }}
                        >
                          {selectedResult.hitPosition === 0 ? 'No hit' : `Position #${selectedResult.hitPosition}`}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Accuracy:</span>
                        <span className="value">{(selectedResult.accuracy * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h5>Prediction Results</h5>
                    <div className="predictions-breakdown">
                      <div className="prediction-group">
                        <h6>Top 5 Predictions:</h6>
                        <div className="prediction-list">
                          {selectedResult.predictedTop5.map((pred, index) => (
                            <span
                              key={index}
                              className={`prediction-item ${pred === selectedResult.actualDraw ? 'hit' : ''}`}
                            >
                              {pred}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="prediction-group">
                        <h6>Top 10 Predictions:</h6>
                        <div className="prediction-list">
                          {selectedResult.predictedTop10.slice(5).map((pred, index) => (
                            <span
                              key={index + 5}
                              className={`prediction-item ${pred === selectedResult.actualDraw ? 'hit' : ''}`}
                            >
                              {pred}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h5>Hit Analysis</h5>
                    <div className="hit-analysis">
                      <div className={`hit-type ${selectedResult.straightHit ? 'hit' : 'miss'}`}>
                        <span className="hit-label">Straight Hit:</span>
                        <span className="hit-value">{selectedResult.straightHit ? '✓ Yes' : '✗ No'}</span>
                      </div>
                      <div className={`hit-type ${selectedResult.boxHit ? 'hit' : 'miss'}`}>
                        <span className="hit-label">Box Hit:</span>
                        <span className="hit-value">{selectedResult.boxHit ? '✓ Yes' : '✗ No'}</span>
                      </div>
                      <div className={`hit-type ${selectedResult.pairHit ? 'hit' : 'miss'}`}>
                        <span className="hit-label">Pair Hit:</span>
                        <span className="hit-value">{selectedResult.pairHit ? '✓ Yes' : '✗ No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperPredictorBacktesting;