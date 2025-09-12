import React from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

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

  return (
    <div className={`pick3-overview ${className}`}>
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
