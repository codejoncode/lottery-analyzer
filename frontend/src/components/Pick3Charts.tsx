import React from 'react';
import Pick3Dashboard from './Pick3Dashboard';
import Pick3Visualization from './Pick3Visualization';
import './Pick3Dashboard.css';
import './Pick3Visualization.css';

interface Pick3ChartsProps {
  className?: string;
  showVisualization?: boolean;
}

/**
 * Main Pick 3 Lottery Analysis Component
 * Provides comprehensive mathematical analysis of 3-digit lottery combinations
 * including sums, root sums, VTrac patterns, and probability calculations
 */
const Pick3Charts: React.FC<Pick3ChartsProps> = ({
  className = '',
  showVisualization = true
}) => {
  return (
    <div className={`pick3-charts ${className}`}>
      <Pick3Dashboard />
      {showVisualization && (
        <div className="visualization-section">
          <Pick3Visualization />
        </div>
      )}
    </div>
  );
};

export default Pick3Charts;
