import React, { useState, useEffect } from 'react';
import { Pick3GroupAnalyzer, type NumberGroup, type GroupAnalysisResult } from '../../services/Pick3GroupAnalyzer';
import { pick3DataManager } from '../../services/Pick3DataManager';
import './Pick3GroupAnalysis.css';

interface Pick3GroupAnalysisProps {
  className?: string;
}

const Pick3GroupAnalysis: React.FC<Pick3GroupAnalysisProps> = ({ className = '' }) => {
  const [analysis, setAnalysis] = useState<GroupAnalysisResult | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<NumberGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAnalyzer();
  }, []);

  const initializeAnalyzer = () => {
    try {
      const draws = pick3DataManager.getDraws();
      const groupAnalyzer = new Pick3GroupAnalyzer(draws);
      const analysisResult = groupAnalyzer.getAnalysis();

      setAnalysis(analysisResult);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing group analyzer:', error);
      setLoading(false);
    }
  };

  const handleGroupClick = (group: NumberGroup) => {
    setSelectedGroup(group);
  };

  const getGroupStatusColor = (group: NumberGroup) => {
    if (group.performance.consecutiveMisses === 0) return 'hot';
    if (group.performance.consecutiveMisses >= 10) return 'due';
    return 'normal';
  };

  const getGroupStatusText = (group: NumberGroup) => {
    if (group.performance.consecutiveMisses === 0) return '🔥 Hot';
    if (group.performance.consecutiveMisses >= 10) return '⏰ Due';
    return '📊 Active';
  };

  if (loading) {
    return (
      <div className={`pick3-group-analysis loading ${className}`}>
        <div className="loading-spinner">Loading group analysis...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={`pick3-group-analysis error ${className}`}>
        <p>Unable to load group analysis. Please check your data.</p>
      </div>
    );
  }

  return (
    <div className={`pick3-group-analysis ${className}`}>
      <div className="analysis-header">
        <h2>🎯 Pick 3 Group Analysis</h2>
        <p>50 strategic groups of 20 numbers each for optimized predictions</p>
      </div>

      {/* Overall Statistics */}
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Groups</h3>
          <span className="stat-value">{analysis.groups.length}</span>
        </div>
        <div className="stat-card">
          <h3>Total Numbers</h3>
          <span className="stat-value">{analysis.overallStats.totalNumbers}</span>
        </div>
        <div className="stat-card">
          <h3>Coverage</h3>
          <span className="stat-value">{analysis.overallStats.coveragePercentage.toFixed(1)}%</span>
        </div>
        <div className="stat-card">
          <h3>Avg Win Rate</h3>
          <span className="stat-value">{analysis.overallStats.averageWinRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* Next Draw Predictions */}
      <div className="predictions-section">
        <h3>🎲 Next Draw Predictions (Top 20)</h3>
        <div className="predictions-grid">
          {analysis.recommendations.nextDrawPredictions.map((number, index) => (
            <div key={number} className="prediction-number">
              <span className="number">{number}</span>
              <span className="rank">#{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Group Categories */}
      <div className="group-categories">
        <div className="category-section">
          <h3>🏆 Best Performing Groups</h3>
          <div className="group-grid">
            {analysis.recommendations.bestPerformingGroups.map(group => (
              <div
                key={group.id}
                className={`group-card ${getGroupStatusColor(group)}`}
                onClick={() => handleGroupClick(group)}
              >
                <div className="group-header">
                  <span className="group-id">Group {group.id}</span>
                  <span className="group-status">{getGroupStatusText(group)}</span>
                </div>
                <div className="group-stats">
                  <div className="stat">Win Rate: {group.performance.winRate.toFixed(1)}%</div>
                  <div className="stat">Total Hits: {group.hits.total}</div>
                  <div className="stat">Avg Skip: {group.average.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="category-section">
          <h3>⏰ Due Groups (Need Hits)</h3>
          <div className="group-grid">
            {analysis.recommendations.dueGroups.map(group => (
              <div
                key={group.id}
                className={`group-card ${getGroupStatusColor(group)}`}
                onClick={() => handleGroupClick(group)}
              >
                <div className="group-header">
                  <span className="group-id">Group {group.id}</span>
                  <span className="group-status">{getGroupStatusText(group)}</span>
                </div>
                <div className="group-stats">
                  <div className="stat">Misses: {group.performance.consecutiveMisses}</div>
                  <div className="stat">Total Hits: {group.hits.total}</div>
                  <div className="stat">Due Numbers: {group.dueNumbers.length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="category-section">
          <h3>🔥 Hot Groups (Recent Hits)</h3>
          <div className="group-grid">
            {analysis.recommendations.hotGroups.map(group => (
              <div
                key={group.id}
                className={`group-card ${getGroupStatusColor(group)}`}
                onClick={() => handleGroupClick(group)}
              >
                <div className="group-header">
                  <span className="group-id">Group {group.id}</span>
                  <span className="group-status">{getGroupStatusText(group)}</span>
                </div>
                <div className="group-stats">
                  <div className="stat">Hot Numbers: {group.hotNumbers.length}</div>
                  <div className="stat">Total Hits: {group.hits.total}</div>
                  <div className="stat">Confidence: {group.confidence.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Group Detail Modal */}
      {selectedGroup && (
        <div className="group-detail-modal" onClick={() => setSelectedGroup(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Group {selectedGroup.id} Details</h3>
              <button className="close-btn" onClick={() => setSelectedGroup(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Performance Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="label">Win Rate</span>
                    <span className="value">{selectedGroup.performance.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span className="label">Total Hits</span>
                    <span className="value">{selectedGroup.hits.total}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Straight Hits</span>
                    <span className="value">{selectedGroup.hits.straight}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Box Hits</span>
                    <span className="value">{selectedGroup.hits.box}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Avg Skip</span>
                    <span className="value">{selectedGroup.average.toFixed(1)}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Consecutive Misses</span>
                    <span className="value">{selectedGroup.performance.consecutiveMisses}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Hot Numbers ({selectedGroup.hotNumbers.length})</h4>
                <div className="number-grid">
                  {selectedGroup.hotNumbers.map(number => (
                    <span key={number} className="number hot">{number}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Due Numbers ({selectedGroup.dueNumbers.length})</h4>
                <div className="number-grid">
                  {selectedGroup.dueNumbers.map(number => (
                    <span key={number} className="number due">{number}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>All Numbers in Group ({selectedGroup.numbers.length})</h4>
                <div className="number-grid">
                  {selectedGroup.numbers.map(number => (
                    <span key={number} className="number">{number}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pick3GroupAnalysis;