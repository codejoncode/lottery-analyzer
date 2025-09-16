import React, { useState, useEffect } from 'react';
import { PredictionService } from '../services/api';
import type { EnhancedPredictionData, PredictionRequest } from '../services/api';
import './EnhancedPredictionDisplay.css';

interface EnhancedPredictionDisplayProps {
  gameType: 'pick3' | 'pick4';
  onPredictionGenerated?: (prediction: EnhancedPredictionData) => void;
}

const EnhancedPredictionDisplay: React.FC<EnhancedPredictionDisplayProps> = ({
  gameType,
  onPredictionGenerated
}) => {
  const [prediction, setPrediction] = useState<EnhancedPredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState('statistical');

  const generatePrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: PredictionRequest = {
        gameType,
        strategy
      };

      const result = await PredictionService.generateEnhancedPrediction(request);
      setPrediction(result);

      if (onPredictionGenerated) {
        onPredictionGenerated(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePrediction();
  }, [gameType, strategy]);

  const renderBoxes = () => {
    if (!prediction?.boxes) return null;

    return (
      <div className="prediction-section">
        <h3>🎯 20 Prediction Boxes</h3>
        <div className="boxes-grid">
          {prediction.boxes.map((box, index) => (
            <div key={index} className="prediction-box">
              <div className="box-numbers">
                {box.map((num, numIndex) => (
                  <span key={numIndex} className="number-ball">
                    {num.toString().padStart(gameType === 'pick3' ? 1 : 1, '0')}
                  </span>
                ))}
              </div>
              <div className="box-index">Box {index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderColumnTop3 = () => {
    if (!prediction?.columnTop3) return null;

    const columns = gameType === 'pick3' ? ['Hundreds', 'Tens', 'Units'] : ['Thousands', 'Hundreds', 'Tens', 'Units'];
    const columnKeys = gameType === 'pick3' ? ['hundreds', 'tens', 'units'] : ['thousands', 'hundreds', 'tens', 'units'];

    return (
      <div className="prediction-section">
        <h3>📊 Top 3 Numbers Per Column</h3>
        <div className="columns-grid">
          {columnKeys.map((key, index) => {
            const numbers = prediction.columnTop3[key as keyof typeof prediction.columnTop3];
            if (!numbers) return null;

            return (
              <div key={key} className="column-card">
                <h4>{columns[index]}</h4>
                <div className="column-numbers">
                  {numbers.map((num, numIndex) => (
                    <div key={numIndex} className="top-number">
                      <span className="rank">#{numIndex + 1}</span>
                      <span className="number">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOverallTop5 = () => {
    if (!prediction?.overallTop5) return null;

    return (
      <div className="prediction-section">
        <h3>⭐ Overall Top 5 Numbers</h3>
        <div className="top5-grid">
          {prediction.overallTop5.map((num, index) => (
            <div key={index} className="top5-item">
              <div className="rank-badge">#{index + 1}</div>
              <div className="number-display">{num}</div>
              <div className="frequency-indicator">
                <div className="frequency-bar" style={{ width: `${80 - index * 10}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReasoning = () => {
    if (!prediction?.reasoning || prediction.reasoning.length === 0) return null;

    return (
      <div className="prediction-section">
        <h3>🧠 Prediction Reasoning</h3>
        <div className="reasoning-list">
          {prediction.reasoning.map((reason, index) => (
            <div key={index} className="reasoning-item">
              <span className="reasoning-bullet">•</span>
              <span className="reasoning-text">{reason}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    if (!prediction?.performance) return null;

    const { historicalAccuracy, improvement, trend } = prediction.performance;

    return (
      <div className="prediction-section">
        <h3>📈 Performance Tracking</h3>
        <div className="performance-metrics">
          <div className="metric-card">
            <div className="metric-label">Historical Accuracy</div>
            <div className="metric-value">{(historicalAccuracy * 100).toFixed(1)}%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Improvement</div>
            <div className={`metric-value ${improvement > 0 ? 'positive' : improvement < 0 ? 'negative' : 'neutral'}`}>
              {improvement > 0 ? '+' : ''}{(improvement * 100).toFixed(1)}%
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Trend</div>
            <div className={`metric-value trend-${trend}`}>
              {trend.charAt(0).toUpperCase() + trend.slice(1)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-prediction-display">
      <div className="prediction-header">
        <h2>🎲 Enhanced {gameType.toUpperCase()} Prediction</h2>
        <div className="prediction-controls">
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="strategy-select"
          >
            <option value="statistical">Statistical Analysis</option>
            <option value="pattern">Pattern Recognition</option>
            <option value="frequency">Frequency Analysis</option>
            <option value="ai_prediction">AI Prediction</option>
          </select>
          <button
            onClick={generatePrediction}
            disabled={loading}
            className="generate-btn"
          >
            {loading ? '🔄 Generating...' : '🎯 Generate New Prediction'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {prediction && (
        <div className="prediction-content">
          <div className="prediction-meta">
            <div className="meta-item">
              <span className="meta-label">Confidence:</span>
              <span className="meta-value">{(prediction.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Strategy:</span>
              <span className="meta-value">{prediction.strategy}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Generated:</span>
              <span className="meta-value">{new Date(prediction.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {renderBoxes()}
          {renderColumnTop3()}
          {renderOverallTop5()}
          {renderReasoning()}
          {renderPerformance()}
        </div>
      )}

      {!prediction && !loading && !error && (
        <div className="no-prediction">
          <p>Click "Generate New Prediction" to create enhanced predictions</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedPredictionDisplay;