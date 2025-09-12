import React, { useState, useEffect } from 'react';
import Pick3Integration from './Pick3Integration';
import { validatePick3Analyzer } from '../utils/pick3Validator';
import './Pick3Demo.css';

interface Pick3DemoProps {
  className?: string;
}

/**
 * Pick 3 Demo Component
 * Showcases the complete Pick 3 lottery analysis system
 */
const Pick3Demo: React.FC<Pick3DemoProps> = ({ className = '' }) => {
  const [validationResults, setValidationResults] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = () => {
    setIsValidating(true);
    setValidationResults([]);

    // Capture console.log outputs
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];

    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    console.error = (...args) => {
      logs.push(`❌ ${args.join(' ')}`);
      originalError(...args);
    };

    try {
      validatePick3Analyzer();
    } catch (error) {
      logs.push(`❌ Validation error: ${error}`);
    }

    // Restore console methods
    console.log = originalLog;
    console.error = originalError;

    setValidationResults(logs);
    setIsValidating(false);
  };

  useEffect(() => {
    // Auto-run validation on component mount
    runValidation();
  }, []);

  return (
    <div className={`pick3-demo ${className}`}>
      <div className="demo-header">
        <h1>🎯 Pick 3 Lottery Analysis System</h1>
        <p>Complete mathematical implementation based on combinatorial analysis</p>

        <div className="validation-section">
          <button
            className="validate-button"
            onClick={runValidation}
            disabled={isValidating}
          >
            {isValidating ? '🔄 Validating...' : '✅ Run Validation'}
          </button>

          {validationResults.length > 0 && (
            <div className="validation-results">
              <h3>Validation Results:</h3>
              <div className="results-list">
                {validationResults.map((result, index) => (
                  <div key={index} className="result-item">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Pick3Integration />

      <div className="demo-footer">
        <div className="feature-highlights">
          <div className="highlight">
            <h4>🔢 Mathematical Precision</h4>
            <p>Implements exact combinatorial mathematics for 1,000 possible combinations</p>
          </div>
          <div className="highlight">
            <h4>📊 Advanced Analytics</h4>
            <p>Sum distributions, root sums, and probability calculations</p>
          </div>
          <div className="highlight">
            <h4>🎲 VTrac System</h4>
            <p>Mirror combination analysis with complete VTrac methodology</p>
          </div>
          <div className="highlight">
            <h4>⚡ Performance Optimized</h4>
            <p>Fast calculations with comprehensive caching and memory optimization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pick3Demo;
