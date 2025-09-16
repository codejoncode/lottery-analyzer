import React, { useState, useEffect, useMemo } from 'react';
import { BoxStraightAnalyzer } from './BoxStraightAnalyzer';
import type { BetTypeAnalysis, Draw } from './BoxStraightAnalyzer';
import './BoxStraightAnalysis.css';

interface BoxStraightAnalysisProps {
  historicalDraws: Draw[];
  className?: string;
}

const BoxStraightAnalysis: React.FC<BoxStraightAnalysisProps> = ({
  historicalDraws,
  className = ''
}) => {
  const [selectedCombination, setSelectedCombination] = useState<string>('');
  const [analysis, setAnalysis] = useState<BetTypeAnalysis | null>(null);
  const [topCombinations, setTopCombinations] = useState<BetTypeAnalysis[]>([]);
  const [dueCombinations, setDueCombinations] = useState<BetTypeAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzer = useMemo(() => {
    return new BoxStraightAnalyzer(historicalDraws);
  }, [historicalDraws]);

  useEffect(() => {
    if (historicalDraws.length >= 20) {
      loadAnalysis();
    }
  }, [historicalDraws]);

  const loadAnalysis = async () => {
    setLoading(true);

    try {
      // Get top performing combinations
      const top = analyzer.getTopCombinations(15);
      setTopCombinations(top);

      // Get combinations that are due
      const due = analyzer.getDueCombinations().slice(0, 10);
      setDueCombinations(due);

      // Analyze a sample combination if none selected
      if (!selectedCombination && top.length > 0) {
        const sampleAnalysis = analyzer.analyzeCombination(top[0].combination);
        setAnalysis(sampleAnalysis);
        setSelectedCombination(top[0].combination);
      }
    } catch (error) {
      console.error('Error loading box/straight analysis:', error);
    }

    setLoading(false);
  };

  const analyzeCombination = (combination: string) => {
    try {
      const result = analyzer.analyzeCombination(combination);
      setAnalysis(result);
      setSelectedCombination(combination);
    } catch (error) {
      console.error('Error analyzing combination:', error);
    }
  };

  const getBetTypeColor = (betType: string) => {
    switch (betType) {
      case 'straight': return '#10b981';
      case 'box': return '#3b82f6';
      case 'both': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return '#10b981';
    if (confidence >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`box-straight-analysis ${className}`}>
      <div className="analysis-header">
        <h3>Box/Straight Analysis</h3>
        <p>Compare straight vs box betting strategies</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing patterns...</p>
        </div>
      ) : historicalDraws.length < 20 ? (
        <div className="insufficient-data">
          <p>Need at least 20 historical draws for meaningful analysis.</p>
          <small>Current: {historicalDraws.length} draws</small>
        </div>
      ) : (
        <div className="analysis-content">
          {/* Top Combinations Section */}
          <div className="analysis-section">
            <h4>Top Performing Combinations</h4>
            <div className="combinations-grid">
              {topCombinations.map((combo) => (
                <div
                  key={combo.combination}
                  className={`combination-card ${selectedCombination === combo.combination ? 'selected' : ''}`}
                  onClick={() => analyzeCombination(combo.combination)}
                >
                  <div className="combination">{combo.combination}</div>
                  <div className="metrics">
                    <span className="metric">
                      Straight: {(combo.straightFrequency * 100).toFixed(1)}%
                    </span>
                    <span className="metric">
                      Box: {(combo.boxFrequency * 100).toFixed(1)}%
                    </span>
                    <span
                      className="confidence"
                      style={{ color: getConfidenceColor(combo.confidence) }}
                    >
                      {(combo.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div
                    className="bet-recommendation"
                    style={{ backgroundColor: getBetTypeColor(combo.recommendedBet) }}
                  >
                    {combo.recommendedBet.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Due Combinations Section */}
          {dueCombinations.length > 0 && (
            <div className="analysis-section">
              <h4>Due Combinations</h4>
              <div className="combinations-grid">
                {dueCombinations.map((combo) => (
                  <div
                    key={combo.combination}
                    className={`combination-card due ${selectedCombination === combo.combination ? 'selected' : ''}`}
                    onClick={() => analyzeCombination(combo.combination)}
                  >
                    <div className="combination">{combo.combination}</div>
                    <div className="due-indicators">
                      {combo.straightDue && <span className="due-badge straight">Straight Due</span>}
                      {combo.boxDue && <span className="due-badge box">Box Due</span>}
                    </div>
                    <div className="last-hits">
                      <span>Last Straight: {combo.lastStraightHit === -1 ? 'Never' : `${combo.lastStraightHit} draws`}</span>
                      <span>Last Box: {combo.lastBoxHit === -1 ? 'Never' : `${combo.lastBoxHit} draws`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Analysis Section */}
          {analysis && (
            <div className="analysis-section detailed">
              <h4>Detailed Analysis: {analysis.combination}</h4>
              <div className="detailed-analysis">
                <div className="analysis-grid">
                  <div className="analysis-card">
                    <h5>Straight Performance</h5>
                    <div className="performance-metrics">
                      <div className="metric">
                        <span className="label">Matches:</span>
                        <span className="value">{analysis.straightMatches}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Frequency:</span>
                        <span className="value">{(analysis.straightFrequency * 100).toFixed(2)}%</span>
                      </div>
                      <div className="metric">
                        <span className="label">Last Hit:</span>
                        <span className="value">
                          {analysis.lastStraightHit === -1 ? 'Never' : `${analysis.lastStraightHit} draws ago`}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="label">Status:</span>
                        <span className={`status ${analysis.straightDue ? 'due' : 'current'}`}>
                          {analysis.straightDue ? 'Due' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="analysis-card">
                    <h5>Box Performance</h5>
                    <div className="performance-metrics">
                      <div className="metric">
                        <span className="label">Matches:</span>
                        <span className="value">{analysis.boxMatches}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Frequency:</span>
                        <span className="value">{(analysis.boxFrequency * 100).toFixed(2)}%</span>
                      </div>
                      <div className="metric">
                        <span className="label">Last Hit:</span>
                        <span className="value">
                          {analysis.lastBoxHit === -1 ? 'Never' : `${analysis.lastBoxHit} draws ago`}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="label">Status:</span>
                        <span className={`status ${analysis.boxDue ? 'due' : 'current'}`}>
                          {analysis.boxDue ? 'Due' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="analysis-card">
                    <h5>Pair Analysis</h5>
                    <div className="performance-metrics">
                      <div className="metric">
                        <span className="label">Pair Matches:</span>
                        <span className="value">{analysis.pairMatches}</span>
                      </div>
                      <div className="metric">
                        <span className="label">Pair Frequency:</span>
                        <span className="value">{(analysis.pairFrequency * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="analysis-card recommendation">
                    <h5>Recommendation</h5>
                    <div className="recommendation-content">
                      <div
                        className="bet-type-badge"
                        style={{ backgroundColor: getBetTypeColor(analysis.recommendedBet) }}
                      >
                        {analysis.recommendedBet.toUpperCase()}
                      </div>
                      <div className="confidence-indicator">
                        <span>Confidence:</span>
                        <div className="confidence-bar">
                          <div
                            className="confidence-fill"
                            style={{
                              width: `${analysis.confidence * 100}%`,
                              backgroundColor: getConfidenceColor(analysis.confidence)
                            }}
                          ></div>
                        </div>
                        <span>{(analysis.confidence * 100).toFixed(0)}%</span>
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

export default BoxStraightAnalysis;