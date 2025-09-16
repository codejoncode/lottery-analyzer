import React, { useState, useEffect, useMemo } from 'react';
import './SuperPredictorEngine.css';

interface Draw {
  digits: [number, number, number];
  date: string;
  drawNumber?: number;
}

interface MarkovTransition {
  from: string;
  to: string;
  probability: number;
  count: number;
  lastSeen: number;
}

interface ColumnMarkovModel {
  columnId: 1 | 2 | 3;
  transitions: Map<string, MarkovTransition[]>;
  currentState: string;
  skipCount: number;
}

interface SuperPrediction {
  combination: string;
  confidence: number;
  markovScore: number;
  boxScore: number;
  straightScore: number;
  pairScore: number;
  dueEngine: 'super' | 'column' | 'scoring';
  expectedAccuracy: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string[];
}

interface SuperPredictorEngineProps {
  historicalDraws: Draw[];
  targetDraws?: number;
  className?: string;
}

const SuperPredictorEngine: React.FC<SuperPredictorEngineProps> = ({
  historicalDraws,
  targetDraws = 10,
  className = ''
}) => {
  const [predictions, setPredictions] = useState<SuperPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Build column-wise Markov models
  const markovModels = useMemo(() => {
    if (historicalDraws.length < 10) return null;

    const models: ColumnMarkovModel[] = [1, 2, 3].map(columnId => ({
      columnId: columnId as 1 | 2 | 3,
      transitions: new Map(),
      currentState: '',
      skipCount: 0
    }));

    // Build transition matrices for each column
    historicalDraws.forEach((draw, index) => {
      [1, 2, 3].forEach(columnId => {
        const digit = draw.digits[columnId - 1];

        if (index > 0) {
          const prevDraw = historicalDraws[index - 1];
          const prevDigit = prevDraw.digits[columnId - 1];
          const transitionKey = `${prevDigit}`;

          if (!models[columnId - 1].transitions.has(transitionKey)) {
            models[columnId - 1].transitions.set(transitionKey, []);
          }

          const transitions = models[columnId - 1].transitions.get(transitionKey)!;
          const existingTransition = transitions.find(t => t.to === `${digit}`);

          if (existingTransition) {
            existingTransition.count++;
            existingTransition.lastSeen = index;
          } else {
            transitions.push({
              from: `${prevDigit}`,
              to: `${digit}`,
              probability: 0,
              count: 1,
              lastSeen: index
            });
          }
        }
      });
    });

    // Calculate probabilities
    models.forEach(model => {
      model.transitions.forEach(transitions => {
        const totalCount = transitions.reduce((sum, t) => sum + t.count, 0);
        transitions.forEach(t => {
          t.probability = t.count / totalCount;
        });
      });
    });

    // Set current states
    if (historicalDraws.length > 0) {
      const lastDraw = historicalDraws[historicalDraws.length - 1];
      models.forEach((model, index) => {
        model.currentState = `${lastDraw.digits[index]}`;
        // Calculate skip count
        let skipCount = 0;
        for (let i = historicalDraws.length - 2; i >= 0; i--) {
          if (historicalDraws[i].digits[index] === lastDraw.digits[index]) {
            skipCount++;
          } else {
            break;
          }
        }
        model.skipCount = skipCount;
      });
    }

    return models;
  }, [historicalDraws]);

  // Generate predictions using column-wise Markov chains
  const generatePredictions = () => {
    if (!markovModels || markovModels.length !== 3) return;

    setLoading(true);

    const newPredictions: SuperPrediction[] = [];
    const combinationsGenerated = new Set<string>();

    // Generate predictions for each possible combination of column predictions
    const columnPredictions = markovModels.map(model => {
      const transitions = model.transitions.get(model.currentState) || [];
      return transitions
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3) // Top 3 most probable transitions per column
        .map(t => ({
          digit: parseInt(t.to),
          probability: t.probability,
          skipAdjustedProb: t.probability * Math.max(0.1, 1 - (model.skipCount * 0.1))
        }));
    });

    // Generate combinations from column predictions
    for (const pred1 of columnPredictions[0]) {
      for (const pred2 of columnPredictions[1]) {
        for (const pred3 of columnPredictions[2]) {
          const combination = `${pred1.digit}${pred2.digit}${pred3.digit}`;

          if (combinationsGenerated.has(combination)) continue;
          combinationsGenerated.add(combination);

          // Calculate comprehensive scores
          const markovScore = (pred1.probability + pred2.probability + pred3.probability) / 3;
          const skipAdjustedScore = (pred1.skipAdjustedProb + pred2.skipAdjustedProb + pred3.skipAdjustedProb) / 3;

          // Box analysis (any order)
          const boxScore = calculateBoxScore([pred1.digit, pred2.digit, pred3.digit], historicalDraws);

          // Straight analysis (exact order)
          const straightScore = calculateStraightScore([pred1.digit, pred2.digit, pred3.digit], historicalDraws);

          // Pair analysis
          const pairScore = calculatePairScore([pred1.digit, pred2.digit, pred3.digit], historicalDraws);

          // Determine due engine
          const dueEngine = determineDueEngine(markovScore, boxScore, straightScore, pairScore);

          // Calculate overall confidence
          const confidence = (markovScore * 0.4 + skipAdjustedScore * 0.3 + boxScore * 0.2 + straightScore * 0.1);

          // Expected accuracy based on historical performance
          const expectedAccuracy = calculateExpectedAccuracy([pred1.digit, pred2.digit, pred3.digit], historicalDraws);

          // Risk assessment
          const riskLevel = confidence > 0.7 ? 'low' : confidence > 0.4 ? 'medium' : 'high';

          const reasoning = generateReasoning(
            [pred1, pred2, pred3],
            markovScore,
            boxScore,
            straightScore,
            pairScore,
            dueEngine
          );

          newPredictions.push({
            combination,
            confidence,
            markovScore,
            boxScore,
            straightScore,
            pairScore,
            dueEngine,
            expectedAccuracy,
            riskLevel,
            reasoning
          });

          if (newPredictions.length >= targetDraws) break;
        }
        if (newPredictions.length >= targetDraws) break;
      }
      if (newPredictions.length >= targetDraws) break;
    }

    // Sort by confidence
    newPredictions.sort((a, b) => b.confidence - a.confidence);

    setPredictions(newPredictions);
    setLastUpdated(new Date());
    setLoading(false);
  };

  // Helper functions
  const calculateBoxScore = (digits: number[], historicalDraws: Draw[]): number => {
    // Box score: how well this combination of digits has performed regardless of order
    const sortedDigits = [...digits].sort().join('');
    let matches = 0;

    historicalDraws.slice(-20).forEach(draw => {
      const sortedDraw = [...draw.digits].sort().join('');
      if (sortedDraw === sortedDigits) matches++;
    });

    return matches / 20; // Normalize to 0-1
  };

  const calculateStraightScore = (digits: number[], historicalDraws: Draw[]): number => {
    // Straight score: exact order matches
    const straightCombo = digits.join('');
    let matches = 0;

    historicalDraws.slice(-20).forEach(draw => {
      const drawCombo = draw.digits.join('');
      if (drawCombo === straightCombo) matches++;
    });

    return matches / 20;
  };

  const calculatePairScore = (digits: number[], historicalDraws: Draw[]): number => {
    // Pair score: how well digit pairs have performed
    let pairScore = 0;
    const pairs = [
      [digits[0], digits[1]],
      [digits[1], digits[2]],
      [digits[0], digits[2]]
    ];

    pairs.forEach(pair => {
      let pairMatches = 0;
      historicalDraws.slice(-20).forEach(draw => {
        if (draw.digits.includes(pair[0]) && draw.digits.includes(pair[1])) {
          pairMatches++;
        }
      });
      pairScore += pairMatches / 20;
    });

    return pairScore / 3;
  };

  const determineDueEngine = (
    markovScore: number,
    boxScore: number,
    straightScore: number,
    pairScore: number
  ): 'super' | 'column' | 'scoring' => {
    // Determine which engine is "due" based on recent performance patterns
    const scores = { markov: markovScore, box: boxScore, straight: straightScore, pair: pairScore };
    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === markovScore) return 'super';
    if (maxScore === boxScore || maxScore === straightScore) return 'column';
    return 'scoring';
  };

  const calculateExpectedAccuracy = (digits: number[], historicalDraws: Draw[]): number => {
    // Calculate expected accuracy based on historical patterns
    let totalAccuracy = 0;
    let count = 0;

    historicalDraws.slice(-30).forEach((draw, index) => {
      if (index < 2) return; // Need at least 3 draws for pattern

      const pattern = historicalDraws.slice(index - 2, index + 1);
      const predicted = predictFromPattern(pattern);
      const actual = draw.digits;

      let matches = 0;
      predicted.forEach((pred, i) => {
        if (pred === actual[i]) matches++;
      });

      totalAccuracy += matches / 3;
      count++;
    });

    return count > 0 ? totalAccuracy / count : 0.5;
  };

  const predictFromPattern = (pattern: Draw[]): number[] => {
    // Simple pattern-based prediction for accuracy calculation
    if (pattern.length < 3) return [0, 0, 0];

    const trends = [0, 1, 2].map(col => {
      const colValues = pattern.map(d => d.digits[col]);
      return colValues[2] - colValues[0]; // Trend direction
    });

    return pattern[2].digits.map((digit, col) => {
      const trend = trends[col];
      return Math.max(0, Math.min(9, digit + trend));
    });
  };

  const generateReasoning = (
    predictions: Array<{digit: number, probability: number, skipAdjustedProb: number}>,
    markovScore: number,
    boxScore: number,
    straightScore: number,
    pairScore: number,
    dueEngine: string
  ): string[] => {
    const reasoning: string[] = [];

    reasoning.push(`Column predictions: ${predictions.map(p => p.digit).join('-')} with avg probability ${(predictions.reduce((sum, p) => sum + p.probability, 0) / 3 * 100).toFixed(1)}%`);

    if (markovScore > 0.6) {
      reasoning.push('Strong Markov chain consistency detected');
    }

    if (boxScore > straightScore) {
      reasoning.push('Box pattern shows stronger historical performance than straight');
    } else {
      reasoning.push('Straight pattern shows stronger historical performance than box');
    }

    if (pairScore > 0.5) {
      reasoning.push('Digit pairs have strong historical correlation');
    }

    reasoning.push(`Recommended engine: ${dueEngine.toUpperCase()} (based on current performance patterns)`);

    return reasoning;
  };

  useEffect(() => {
    if (historicalDraws.length >= 10) {
      generatePredictions();
    }
  }, [historicalDraws, targetDraws]);

  return (
    <div className={`super-predictor-engine ${className}`}>
      <div className="engine-header">
        <h3>Super Predictor Engine</h3>
        <p>Column-wise Markov Model Analysis</p>
        <small>Last updated: {lastUpdated.toLocaleTimeString()}</small>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing patterns and generating predictions...</p>
        </div>
      ) : predictions.length > 0 ? (
        <div className="predictions-grid">
          {predictions.slice(0, targetDraws).map((prediction, index) => (
            <div key={prediction.combination} className={`prediction-card risk-${prediction.riskLevel}`}>
              <div className="prediction-header">
                <span className="combination">{prediction.combination}</span>
                <span className="rank">#{index + 1}</span>
                <span className={`engine-badge engine-${prediction.dueEngine}`}>
                  {prediction.dueEngine.toUpperCase()}
                </span>
              </div>

              <div className="prediction-scores">
                <div className="score-item">
                  <label>Confidence:</label>
                  <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="score-item">
                  <label>Expected Accuracy:</label>
                  <span>{(prediction.expectedAccuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="score-item">
                  <label>Markov Score:</label>
                  <span>{(prediction.markovScore * 100).toFixed(1)}%</span>
                </div>
                <div className="score-item">
                  <label>Box Score:</label>
                  <span>{(prediction.boxScore * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="prediction-reasoning">
                <h4>Analysis:</h4>
                <ul>
                  {prediction.reasoning.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data-state">
          <p>Insufficient historical data. Need at least 10 draws for analysis.</p>
        </div>
      )}

      <div className="engine-controls">
        <button
          onClick={generatePredictions}
          disabled={loading || historicalDraws.length < 10}
          className="generate-button"
        >
          {loading ? 'Analyzing...' : 'Generate Predictions'}
        </button>
      </div>
    </div>
  );
};

export default SuperPredictorEngine;