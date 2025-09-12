import React, { useMemo } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface Pick3VisualizationProps {
  className?: string;
}

/**
 * Pick 3 Data Visualization Component
 * Creates charts and graphs for sum distributions, probability analysis, and pattern visualization
 */
const Pick3Visualization: React.FC<Pick3VisualizationProps> = ({ className = '' }) => {
  const sumAnalyses = useMemo(() => pick3Analyzer.getAllSumAnalyses(), []);
  const rootSumAnalyses = useMemo(() => pick3Analyzer.getAllRootSumAnalyses(), []);
  const sumLastDigitAnalyses = useMemo(() => pick3Analyzer.getAllSumLastDigitAnalyses(), []);

  // Calculate chart dimensions
  const maxSumCount = Math.max(...sumAnalyses.map(s => s.straightCount));
  const maxRootSumCount = Math.max(...rootSumAnalyses.map(s => s.straightCount));
  const maxLastDigitCount = Math.max(...sumLastDigitAnalyses.map(s => s.count));

  return (
    <div className={`pick3-visualization ${className}`}>
      <div className="visualization-header">
        <h2>Pick 3 Mathematical Visualizations</h2>
        <p>Interactive charts showing probability distributions and pattern analysis</p>
      </div>

      <div className="charts-grid">
        {/* Sum Distribution Chart */}
        <div className="chart-container">
          <h3>Sum Distribution (0-27)</h3>
          <div className="chart">
            <div className="chart-y-axis">
              <span>Count</span>
            </div>
            <div className="chart-area">
              {sumAnalyses.map(analysis => (
                <div
                  key={analysis.sum}
                  className="chart-bar"
                  style={{
                    height: `${(analysis.straightCount / maxSumCount) * 100}%`,
                    backgroundColor: `hsl(${(analysis.sum / 27) * 240}, 70%, 50%)`
                  }}
                  title={`Sum ${analysis.sum}: ${analysis.straightCount} combinations (${(analysis.probability * 100).toFixed(2)}%)`}
                >
                  <div className="bar-label">{analysis.sum}</div>
                  <div className="bar-value">{analysis.straightCount}</div>
                </div>
              ))}
            </div>
            <div className="chart-x-axis">
              <span>Sum Value</span>
            </div>
          </div>
        </div>

        {/* Root Sum Distribution Chart */}
        <div className="chart-container">
          <h3>Root Sum Distribution (0-9)</h3>
          <div className="chart">
            <div className="chart-y-axis">
              <span>Count</span>
            </div>
            <div className="chart-area">
              {rootSumAnalyses.map(analysis => (
                <div
                  key={analysis.rootSum}
                  className="chart-bar"
                  style={{
                    height: `${(analysis.straightCount / maxRootSumCount) * 100}%`,
                    backgroundColor: `hsl(${(analysis.rootSum / 9) * 240}, 70%, 50%)`
                  }}
                  title={`Root Sum ${analysis.rootSum}: ${analysis.straightCount} combinations (${(analysis.probability * 100).toFixed(2)}%)`}
                >
                  <div className="bar-label">{analysis.rootSum}</div>
                  <div className="bar-value">{analysis.straightCount}</div>
                </div>
              ))}
            </div>
            <div className="chart-x-axis">
              <span>Root Sum Value</span>
            </div>
          </div>
        </div>

        {/* Sum Last Digit Distribution Chart */}
        <div className="chart-container">
          <h3>Sum Last Digit Distribution (0-9)</h3>
          <div className="chart">
            <div className="chart-y-axis">
              <span>Count</span>
            </div>
            <div className="chart-area">
              {sumLastDigitAnalyses.map(analysis => (
                <div
                  key={analysis.lastDigit}
                  className="chart-bar"
                  style={{
                    height: `${(analysis.count / maxLastDigitCount) * 100}%`,
                    backgroundColor: `hsl(${(analysis.lastDigit / 9) * 240}, 70%, 50%)`
                  }}
                  title={`Last Digit ${analysis.lastDigit}: ${analysis.count} combinations (${(analysis.probability * 100).toFixed(2)}%)`}
                >
                  <div className="bar-label">{analysis.lastDigit}</div>
                  <div className="bar-value">{analysis.count}</div>
                </div>
              ))}
            </div>
            <div className="chart-x-axis">
              <span>Last Digit</span>
            </div>
          </div>
        </div>

        {/* Probability Heat Map */}
        <div className="chart-container">
          <h3>Probability Heat Map</h3>
          <div className="probability-heatmap">
            <div className="heatmap-grid">
              {sumAnalyses.map(analysis => (
                <div
                  key={analysis.sum}
                  className="heatmap-cell"
                  style={{
                    backgroundColor: `hsl(240, 70%, ${100 - (analysis.probability * 1000)}%)`,
                    color: analysis.probability > 0.03 ? 'white' : 'black'
                  }}
                  title={`Sum ${analysis.sum}: ${(analysis.probability * 100).toFixed(2)}%`}
                >
                  <div className="cell-value">{analysis.sum}</div>
                  <div className="cell-prob">{(analysis.probability * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
            <div className="heatmap-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'hsl(240, 70%, 90%)' }}></div>
                <span>Low Probability</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'hsl(240, 70%, 50%)' }}></div>
                <span>Medium Probability</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'hsl(240, 70%, 10%)' }}></div>
                <span>High Probability</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="stats-summary">
        <h3>Statistical Summary</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Most Common Sum</div>
            <div className="stat-value">
              {sumAnalyses.reduce((max, current) => current.straightCount > max.straightCount ? current : max).sum}
            </div>
            <div className="stat-detail">
              ({sumAnalyses.reduce((max, current) => current.straightCount > max.straightCount ? current : max).straightCount} combinations)
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Least Common Sum</div>
            <div className="stat-value">
              {sumAnalyses.reduce((min, current) => current.straightCount < min.straightCount ? current : min).sum}
            </div>
            <div className="stat-detail">
              ({sumAnalyses.reduce((min, current) => current.straightCount < min.straightCount ? current : min).straightCount} combinations)
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Average Combinations per Sum</div>
            <div className="stat-value">
              {(sumAnalyses.reduce((sum, current) => sum + current.straightCount, 0) / sumAnalyses.length).toFixed(1)}
            </div>
            <div className="stat-detail">Across all 28 sums</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Sum Range</div>
            <div className="stat-value">0 - 27</div>
            <div className="stat-detail">Complete coverage</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pick3Visualization;
