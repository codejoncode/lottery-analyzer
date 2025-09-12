import React, { useState } from 'react';
import Pick3Charts from './Pick3Charts';
import './Pick3Integration.css';

interface Pick3IntegrationProps {
  className?: string;
}

/**
 * Pick 3 Integration Component for ApexScoop
 * Provides seamless integration of Pick 3 lottery analysis into the main application
 */
const Pick3Integration: React.FC<Pick3IntegrationProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`pick3-integration ${className}`}>
      <div className="integration-header">
        <div className="header-content">
          <h2>🎯 Pick 3 Lottery Analysis</h2>
          <p>Advanced mathematical analysis of 3-digit lottery combinations with ML-powered insights</p>
        </div>
        <button
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'} Analysis
        </button>
      </div>

      {isExpanded && (
        <div className="integration-content">
          <div className="features-overview">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Mathematical Analysis</h3>
              <p>Complete combinatorial analysis of 1,000 possible combinations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎲</div>
              <h3>Sum Distributions</h3>
              <p>Probability analysis for sums ranging from 0-27</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔢</div>
              <h3>Root Sum Patterns</h3>
              <p>Digital root analysis for advanced pattern recognition</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>VTrac System</h3>
              <p>Mirror combination analysis with VTrac methodology</p>
            </div>
          </div>

          <Pick3Charts showVisualization={true} />
        </div>
      )}

      {!isExpanded && (
        <div className="preview-stats">
          <div className="stat-preview">
            <span className="stat-number">1,000</span>
            <span className="stat-label">Total Combinations</span>
          </div>
          <div className="stat-preview">
            <span className="stat-number">220</span>
            <span className="stat-label">Box Combinations</span>
          </div>
          <div className="stat-preview">
            <span className="stat-number">0-27</span>
            <span className="stat-label">Sum Range</span>
          </div>
          <div className="stat-preview">
            <span className="stat-number">ML</span>
            <span className="stat-label">Enhanced Analysis</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pick3Integration;
