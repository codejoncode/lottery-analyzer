import React from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';
import { pick3DataManager } from '../services/Pick3DataManager';
import { Pick3DataProcessor } from '../services/Pick3DataProcessor';
import './Pick3Overview.css';

interface Pick3OverviewProps {
  className?: string;
}

const Pick3Overview: React.FC<Pick3OverviewProps> = ({ className = '' }) => {
  const allCombinations = pick3Analyzer.getAllCombinations();
  const sumLastDigitAnalyses = pick3Analyzer.getAllSumLastDigitAnalyses();

  const singles = pick3Analyzer.getCombinationsByType('single');
  const doubles = pick3Analyzer.getCombinationsByType('double');
  const triples = pick3Analyzer.getCombinationsByType('triple');

  const uniqueBoxSingles = pick3Analyzer.getUniqueBoxCombinations('single');
  const uniqueBoxDoubles = pick3Analyzer.getUniqueBoxCombinations('double');
  const uniqueBoxTriples = pick3Analyzer.getUniqueBoxCombinations('triple');

  // Get recent draws and analysis
  const recentDraws = pick3DataManager.getDraws().slice(-5).reverse();
  const processor = new Pick3DataProcessor(pick3DataManager.getDraws());
  const backtestSummary = processor.getBacktestSummary(30);
  const groupPredictions = processor.getGroupPredictions();
  const dueDrawAnalysis = processor.getDueDrawAnalysis();

  return (
    <div className={`pick3-overview ${className}`}>
      {/* Recent Draws Section */}
      <div className="recent-draws-section">
        <h3>📅 Last 5 Draws</h3>
        <div className="recent-draws-grid">
          {recentDraws.length > 0 ? (
            recentDraws.map((draw, _index) => (
              <div key={draw.date} className="draw-card">
                <div className="draw-date">{new Date(draw.date).toLocaleDateString()}</div>
                <div className="draw-numbers">
                  {draw.midday && (
                    <div className="draw-number midday">
                      <span className="label">Midday:</span>
                      <span className="number">{draw.midday}</span>
                    </div>
                  )}
                  {draw.evening && (
                    <div className="draw-number evening">
                      <span className="label">Evening:</span>
                      <span className="number">{draw.evening}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No recent draws available</div>
          )}
        </div>
      </div>

      {/* Predictions Section */}
      <div className="predictions-section">
        <h3>🎯 Current Predictions</h3>
        <div className="predictions-grid">
          {groupPredictions.length > 0 ? (
            groupPredictions.slice(0, 3).map((prediction, _index) => (
              <div key={prediction.groupId} className="prediction-card">
                <div className="prediction-header">
                  <span className="group-id">Group {prediction.groupId}</span>
                  <span className="confidence">{prediction.confidence.toFixed(1)}% confidence</span>
                </div>
                <div className="predicted-numbers">
                  {prediction.predictedNumbers.slice(0, 5).map((number, numIndex) => (
                    <span key={numIndex} className="predicted-number">{number}</span>
                  ))}
                  {prediction.predictedNumbers.length > 5 && (
                    <span className="more-numbers">+{prediction.predictedNumbers.length - 5} more</span>
                  )}
                </div>
                <div className="prediction-reasoning">
                  {prediction.reasoning.slice(0, 2).map((reason, reasonIndex) => (
                    <div key={reasonIndex} className="reason">{reason}</div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No predictions available</div>
          )}
        </div>
      </div>

      {/* Accuracy Statistics Section */}
      <div className="accuracy-section">
        <h3>📊 Prediction Accuracy (Last 30 Days)</h3>
        <div className="accuracy-stats-grid">
          <div className="accuracy-card">
            <div className="accuracy-label">Straight Accuracy</div>
            <div className="accuracy-value">{backtestSummary.averageAccuracy.straight.toFixed(1)}%</div>
            <div className="accuracy-description">Exact number matches</div>
          </div>
          <div className="accuracy-card">
            <div className="accuracy-label">Box Accuracy</div>
            <div className="accuracy-value">{backtestSummary.averageAccuracy.box.toFixed(1)}%</div>
            <div className="accuracy-description">Any order matches</div>
          </div>
          <div className="accuracy-card">
            <div className="accuracy-label">Overall Score</div>
            <div className="accuracy-value">{backtestSummary.overallScore.toFixed(1)}%</div>
            <div className="accuracy-description">Combined performance</div>
          </div>
          <div className="accuracy-card">
            <div className="accuracy-label">Tests Completed</div>
            <div className="accuracy-value">{backtestSummary.totalTests}</div>
            <div className="accuracy-description">Historical validations</div>
          </div>
        </div>
      </div>

      {/* Due Draw Analysis Summary */}
      <div className="due-analysis-section">
        <h3>🔥 Due Draw Analysis</h3>
        <div className="due-analysis-grid">
          <div className="due-card">
            <div className="due-label">Top Due Group</div>
            <div className="due-value">
              {dueDrawAnalysis.mostDueGroups.length > 0
                ? `Group ${dueDrawAnalysis.mostDueGroups[0].id}`
                : 'N/A'
              }
            </div>
            <div className="due-description">
              {dueDrawAnalysis.mostDueGroups.length > 0
                ? `${dueDrawAnalysis.mostDueGroups[0].dueNumbers.length} due numbers`
                : 'No analysis available'
              }
            </div>
          </div>
          <div className="due-card">
            <div className="due-label">Total Due Numbers</div>
            <div className="due-value">{dueDrawAnalysis.overallStats.totalDueNumbers}</div>
            <div className="due-description">Across all groups</div>
          </div>
          <div className="due-card">
            <div className="due-label">Average Group Score</div>
            <div className="due-value">{dueDrawAnalysis.overallStats.averageGroupScore.toFixed(1)}</div>
            <div className="due-description">Performance rating</div>
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Combinations</h3>
          <div className="stat-value">{allCombinations.length.toLocaleString()}</div>
          <p>10³ = 1,000 possible straight combinations</p>
        </div>

        <div className="stat-card">
          <h3>Straight Combinations</h3>
          <div className="stat-breakdown">
            <div>Singles: {singles.length.toLocaleString()}</div>
            <div>Doubles: {doubles.length.toLocaleString()}</div>
            <div>Triples: {triples.length.toLocaleString()}</div>
          </div>
        </div>

        <div className="stat-card">
          <h3>Box Combinations</h3>
          <div className="stat-breakdown">
            <div>Singles: {uniqueBoxSingles.length.toLocaleString()}</div>
            <div>Doubles: {uniqueBoxDoubles.length.toLocaleString()}</div>
            <div>Triples: {uniqueBoxTriples.length.toLocaleString()}</div>
          </div>
          <p>Total: {(uniqueBoxSingles.length + uniqueBoxDoubles.length + uniqueBoxTriples.length).toLocaleString()}</p>
        </div>

        <div className="stat-card">
          <h3>Sum Range</h3>
          <div className="stat-value">0 - 27</div>
          <p>All possible sums of three digits (0-9)</p>
        </div>
      </div>

      <div className="sum-last-digit-analysis">
        <h3>Sum Last Digit Distribution</h3>
        <div className="last-digit-grid">
          {sumLastDigitAnalyses.map(analysis => (
            <div key={analysis.lastDigit} className="last-digit-item">
              <div className="digit">{analysis.lastDigit}</div>
              <div className="count">{analysis.count}</div>
              <div className="probability">{(analysis.probability * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="odds-reference">
        <h3>Betting Odds Reference</h3>
        <div className="odds-table">
          <div className="odds-row">
            <span>Straight:</span>
            <span>999 to 1</span>
            <span>0.1%</span>
          </div>
          <div className="odds-row">
            <span>Box (Single):</span>
            <span>166 to 1</span>
            <span>0.6%</span>
          </div>
          <div className="odds-row">
            <span>Box (Double):</span>
            <span>333 to 1</span>
            <span>0.3%</span>
          </div>
          <div className="odds-row">
            <span>Box (Triple):</span>
            <span>999 to 1</span>
            <span>0.1%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pick3Overview;
