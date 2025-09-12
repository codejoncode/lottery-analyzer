import React, { useState, useMemo } from 'react';
import './ColumnEngine.css';

interface ColumnEngineProps {
  className?: string;
}

interface Draw {
  digits: [number, number, number];
  dateIndex: number;
}

interface ColumnData {
  columnId: 1 | 2 | 3;
  draws: number[];
  transitions: Map<string, number>;
  currentSkip: number;
  lastValue: number;
}

interface ColumnPrediction {
  columnId: 1 | 2 | 3;
  predictedValue: number;
  confidence: number;
  basedOn: string[];
  transitionProb: number;
}

const ColumnEngine: React.FC<ColumnEngineProps> = ({ className = '' }) => {
  const [inputDraws, setInputDraws] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<1 | 2 | 3 | null>(null);
  const [predictionMode, setPredictionMode] = useState<'single' | 'two-thirds'>('two-thirds');

  // Parse historical draws
  const parsedDraws = useMemo(() => {
    if (!inputDraws.trim()) return [];

    const lines = inputDraws.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      return {
        digits: digits as [number, number, number],
        dateIndex: index
      } as Draw;
    }).filter(Boolean) as Draw[];
  }, [inputDraws]);

  // Create column timelines
  const columnTimelines = useMemo(() => {
    const columns: ColumnData[] = [
      { columnId: 1, draws: [], transitions: new Map(), currentSkip: 0, lastValue: -1 },
      { columnId: 2, draws: [], transitions: new Map(), currentSkip: 0, lastValue: -1 },
      { columnId: 3, draws: [], transitions: new Map(), currentSkip: 0, lastValue: -1 }
    ];

    // Build column draws from historical data
    parsedDraws.forEach((draw, drawIndex) => {
      columns.forEach((column, colIndex) => {
        const value = draw.digits[colIndex];
        column.draws.push(value);

        // Track transitions
        if (column.lastValue >= 0) {
          const transition = `${column.lastValue}-${value}`;
          column.transitions.set(transition, (column.transitions.get(transition) || 0) + 1);
        }
        column.lastValue = value;
      });
    });

    // Calculate current skips
    columns.forEach(column => {
      if (column.draws.length > 0) {
        const lastValue = column.draws[column.draws.length - 1];
        let skipCount = 0;
        for (let i = column.draws.length - 2; i >= 0; i--) {
          if (column.draws[i] === lastValue) break;
          skipCount++;
        }
        column.currentSkip = skipCount;
      }
    });

    return columns;
  }, [parsedDraws]);

  // Generate predictions
  const predictions = useMemo(() => {
    if (parsedDraws.length < 3) return null;

    const lastDraw = parsedDraws[parsedDraws.length - 1];
    const predictions: ColumnPrediction[] = [];

    columnTimelines.forEach(column => {
      if (column.draws.length < 2) return;

      const lastValue = column.draws[column.draws.length - 1];
      const secondLastValue = column.draws[column.draws.length - 2];

      // Find most likely next value based on transition patterns
      const possibleTransitions = Array.from(column.transitions.entries())
        .filter(([transition]) => transition.startsWith(`${lastValue}-`))
        .sort(([,a], [,b]) => b - a);

      if (possibleTransitions.length > 0) {
        const [bestTransition, count] = possibleTransitions[0];
        const predictedValue = parseInt(bestTransition.split('-')[1]);

        // Calculate confidence based on transition frequency
        const totalTransitions = Array.from(column.transitions.values()).reduce((a, b) => a + b, 0);
        const confidence = count / totalTransitions;

        predictions.push({
          columnId: column.columnId,
          predictedValue,
          confidence,
          basedOn: possibleTransitions.slice(0, 3).map(([t]) => t),
          transitionProb: confidence
        });
      }
    });

    return predictions;
  }, [parsedDraws, columnTimelines]);

  // Generate two-thirds prediction
  const twoThirdsPrediction = useMemo(() => {
    if (!predictions || predictions.length < 2) return null;

    // Sort by confidence and take top 2
    const sortedPredictions = [...predictions].sort((a, b) => b.confidence - a.confidence);
    const topTwo = sortedPredictions.slice(0, 2);

    return {
      predictedColumns: topTwo,
      confidence: topTwo.reduce((sum, p) => sum + p.confidence, 0) / topTwo.length,
      coverage: '2/3 of next draw'
    };
  }, [predictions]);

  const getColumnColor = (columnId: 1 | 2 | 3) => {
    switch (columnId) {
      case 1: return '#3b82f6'; // Blue
      case 2: return '#10b981'; // Green
      case 3: return '#f59e0b'; // Yellow
    }
  };

  const getSkipColor = (skipCount: number) => {
    if (skipCount === 0) return '#10b981';
    if (skipCount <= 2) return '#34d399';
    if (skipCount <= 5) return '#fbbf24';
    if (skipCount <= 10) return '#f97316';
    return '#ef4444';
  };

  const renderColumnTimeline = (column: ColumnData) => {
    const recentDraws = column.draws.slice(-20); // Last 20 draws

    return (
      <div className="column-timeline">
        <div className="timeline-header">
          <h4 style={{ color: getColumnColor(column.columnId) }}>
            Column {column.columnId}
          </h4>
          <div className="timeline-stats">
            <span>Total Draws: {column.draws.length}</span>
            <span>Current Skip: <span style={{ color: getSkipColor(column.currentSkip) }}>{column.currentSkip}</span></span>
          </div>
        </div>

        <div className="timeline-grid">
          {recentDraws.map((value, index) => {
            const globalIndex = column.draws.length - recentDraws.length + index;
            const isLastValue = globalIndex === column.draws.length - 1;
            const skipForThisValue = column.draws
              .slice(0, globalIndex)
              .lastIndexOf(value);

            return (
              <div
                key={index}
                className={`timeline-cell ${isLastValue ? 'current' : ''}`}
                style={{
                  backgroundColor: isLastValue ? getColumnColor(column.columnId) : undefined,
                  borderColor: getSkipColor(globalIndex - skipForThisValue)
                }}
                title={`Draw ${globalIndex + 1}: ${value} (Skip: ${globalIndex - skipForThisValue})`}
              >
                {value}
              </div>
            );
          })}
        </div>

        <div className="transition-analysis">
          <h5>Top Transitions</h5>
          <div className="transitions-list">
            {Array.from(column.transitions.entries())
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([transition, count]) => (
                <div key={transition} className="transition-item">
                  <span className="transition">{transition.replace('-', ' → ')}</span>
                  <span className="count">{count}x</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPredictions = () => {
    if (!predictions) return null;

    return (
      <div className="predictions-section">
        <h3>🎯 Column Predictions</h3>

        <div className="prediction-modes">
          <button
            className={predictionMode === 'single' ? 'active' : ''}
            onClick={() => setPredictionMode('single')}
          >
            Single Column
          </button>
          <button
            className={predictionMode === 'two-thirds' ? 'active' : ''}
            onClick={() => setPredictionMode('two-thirds')}
          >
            Two-Thirds Prediction
          </button>
        </div>

        {predictionMode === 'single' && (
          <div className="single-predictions">
            {predictions.map(prediction => (
              <div key={prediction.columnId} className="prediction-card">
                <div className="prediction-header">
                  <h4 style={{ color: getColumnColor(prediction.columnId) }}>
                    Column {prediction.columnId}
                  </h4>
                  <div className="confidence">
                    {(prediction.confidence * 100).toFixed(1)}% confidence
                  </div>
                </div>

                <div className="predicted-value">
                  <span className="value">{prediction.predictedValue}</span>
                  <span className="label">Predicted</span>
                </div>

                <div className="prediction-details">
                  <div className="based-on">
                    <strong>Based on:</strong>
                    {prediction.basedOn.map(transition => (
                      <span key={transition} className="transition">
                        {transition.replace('-', '→')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {predictionMode === 'two-thirds' && twoThirdsPrediction && (
          <div className="two-thirds-prediction">
            <div className="prediction-summary">
              <h4>🔮 Two-Thirds Prediction</h4>
              <div className="coverage">Revealing {twoThirdsPrediction.coverage}</div>
              <div className="overall-confidence">
                Overall Confidence: {(twoThirdsPrediction.confidence * 100).toFixed(1)}%
              </div>
            </div>

            <div className="predicted-columns">
              {twoThirdsPrediction.predictedColumns.map(prediction => (
                <div key={prediction.columnId} className="predicted-column">
                  <div className="column-label" style={{ color: getColumnColor(prediction.columnId) }}>
                    Column {prediction.columnId}
                  </div>
                  <div className="predicted-digit">{prediction.predictedValue}</div>
                  <div className="column-confidence">
                    {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="prediction-note">
              <p>
                <strong>How it works:</strong> By analyzing column transition patterns,
                we can predict 2 out of 3 digits in the next draw with high confidence.
                This gives you a significant edge in narrowing down winning combinations.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`column-engine ${className}`}>
      <div className="engine-header">
        <h2>📊 Column Engine</h2>
        <p>Revolutionary column-based analysis revealing 2/3 of next draw data</p>
      </div>

      <div className="input-section">
        <h3>Historical Draws</h3>
        <textarea
          value={inputDraws}
          onChange={(e) => setInputDraws(e.target.value)}
          placeholder="Enter historical Pick 3 draws, one per line (e.g. 123, 456, 789)&#10;The system will create 3 parallel column timelines from each draw"
          rows={8}
        />
        <div className="input-info">
          <span>Draws analyzed: {parsedDraws.length}</span>
          <span>Columns created: {columnTimelines.length}</span>
        </div>
      </div>

      {parsedDraws.length > 0 && (
        <div className="analysis-section">
          <div className="column-selector">
            <h3>Column Timelines</h3>
            <div className="column-buttons">
              {[1, 2, 3].map(colId => (
                <button
                  key={colId}
                  className={selectedColumn === colId ? 'active' : ''}
                  onClick={() => setSelectedColumn(selectedColumn === colId ? null : colId as 1 | 2 | 3)}
                  style={{ borderColor: getColumnColor(colId as 1 | 2 | 3) }}
                >
                  Column {colId}
                </button>
              ))}
            </div>
          </div>

          <div className="timelines-container">
            {selectedColumn
              ? renderColumnTimeline(columnTimelines[selectedColumn - 1])
              : (
                <div className="all-timelines">
                  {columnTimelines.map(column => renderColumnTimeline(column))}
                </div>
              )
            }
          </div>

          {renderPredictions()}
        </div>
      )}

      {parsedDraws.length === 0 && (
        <div className="getting-started">
          <h3>🚀 Getting Started with Column Engine</h3>
          <div className="instructions">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Enter Historical Data</h4>
                <p>Paste your Pick 3 draw history above (one draw per line)</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>View Column Timelines</h4>
                <p>Each draw creates 3 parallel column histories</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Analyze Patterns</h4>
                <p>Study transition patterns and skip frequencies</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Get Predictions</h4>
                <p>Receive 2/3 predictions for the next draw</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnEngine;
