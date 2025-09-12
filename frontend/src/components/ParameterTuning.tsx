import React, { useState, useEffect } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface Parameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface TuningResult {
  parameters: Record<string, number>;
  score: number;
  improvement: number;
  timestamp: Date;
}

const ParameterTuning: React.FC = () => {
  const [parameters, setParameters] = useState<Parameter[]>([
    {
      name: 'columnPrediction',
      value: 0.20,
      min: 0.05,
      max: 0.40,
      step: 0.01,
      description: 'Weight for column transition predictions',
      impact: 'high'
    },
    {
      name: 'skipAnalysis',
      value: 0.18,
      min: 0.05,
      max: 0.35,
      step: 0.01,
      description: 'Weight for skip pattern analysis',
      impact: 'high'
    },
    {
      name: 'pairCoverage',
      value: 0.15,
      min: 0.05,
      max: 0.30,
      step: 0.01,
      description: 'Weight for pair frequency analysis',
      impact: 'medium'
    },
    {
      name: 'patternRecognition',
      value: 0.12,
      min: 0.05,
      max: 0.25,
      step: 0.01,
      description: 'Weight for pattern matching',
      impact: 'medium'
    },
    {
      name: 'sumOptimization',
      value: 0.10,
      min: 0.05,
      max: 0.20,
      step: 0.01,
      description: 'Weight for sum range optimization',
      impact: 'low'
    },
    {
      name: 'vtracAlignment',
      value: 0.10,
      min: 0.05,
      max: 0.20,
      step: 0.01,
      description: 'Weight for VTrac pattern alignment',
      impact: 'low'
    },
    {
      name: 'deflateEfficiency',
      value: 0.15,
      min: 0.05,
      max: 0.30,
      step: 0.01,
      description: 'Weight for filter efficiency',
      impact: 'high'
    }
  ]);

  const [tuningResults, setTuningResults] = useState<TuningResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [baselineScore, setBaselineScore] = useState(0.72);
  const [currentScore, setCurrentScore] = useState(0.72);

  const updateParameter = (name: string, value: number) => {
    setParameters(prev => prev.map(param =>
      param.name === name ? { ...param, value: Math.max(param.min, Math.min(param.max, value)) } : param
    ));
  };

  const calculateScore = (params: Parameter[]): number => {
    // Mock score calculation based on parameter values
    const totalWeight = params.reduce((sum, param) => sum + param.value, 0);

    // Penalize if weights don't sum to 1.0
    const balancePenalty = Math.abs(totalWeight - 1.0) * 0.1;

    // Calculate score based on parameter optimization
    let score = 0.7; // Base score

    // High impact parameters should be in optimal ranges
    const highImpactParams = params.filter(p => p.impact === 'high');
    highImpactParams.forEach(param => {
      if (param.value >= 0.15 && param.value <= 0.25) {
        score += 0.02; // Bonus for optimal range
      }
    });

    // Medium impact parameters
    const mediumImpactParams = params.filter(p => p.impact === 'medium');
    mediumImpactParams.forEach(param => {
      if (param.value >= 0.10 && param.value <= 0.20) {
        score += 0.01;
      }
    });

    return Math.max(0.5, Math.min(0.95, score - balancePenalty));
  };

  const runOptimization = async () => {
    setIsOptimizing(true);

    // Simulate optimization process
    const iterations = 20;
    const results: TuningResult[] = [];

    for (let i = 0; i < iterations; i++) {
      // Generate slightly modified parameters
      const modifiedParams = parameters.map(param => ({
        ...param,
        value: param.value + (Math.random() - 0.5) * 0.05 // Small random adjustment
      }));

      const score = calculateScore(modifiedParams);
      const improvement = score - baselineScore;

      results.push({
        parameters: Object.fromEntries(modifiedParams.map(p => [p.name, p.value])),
        score,
        improvement,
        timestamp: new Date()
      });

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Find best result
    const bestResult = results.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    // Update parameters with best result
    Object.entries(bestResult.parameters).forEach(([name, value]) => {
      updateParameter(name, value);
    });

    setTuningResults(results);
    setCurrentScore(bestResult.score);
    setIsOptimizing(false);
  };

  const resetToDefaults = () => {
    setParameters(prev => prev.map(param => ({
      ...param,
      value: param.name === 'columnPrediction' ? 0.20 :
             param.name === 'skipAnalysis' ? 0.18 :
             param.name === 'pairCoverage' ? 0.15 :
             param.name === 'patternRecognition' ? 0.12 :
             param.name === 'sumOptimization' ? 0.10 :
             param.name === 'vtracAlignment' ? 0.10 :
             param.name === 'deflateEfficiency' ? 0.15 : param.value
    })));
    setCurrentScore(baselineScore);
  };

  useEffect(() => {
    const score = calculateScore(parameters);
    setCurrentScore(score);
  }, [parameters]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalWeight = parameters.reduce((sum, param) => sum + param.value, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">⚙️ Parameter Tuning</h2>
        <p className="text-gray-600 mb-4">
          Optimize scoring algorithm parameters for maximum prediction accuracy
        </p>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={runOptimization}
            disabled={isOptimizing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isOptimizing ? '🔄 Optimizing...' : '🎯 Auto-Optimize'}
          </button>

          <button
            onClick={resetToDefaults}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      {/* Current Score Display */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
              {(currentScore * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Current Score</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentScore >= baselineScore ? 'text-green-600' : 'text-red-600'}`}>
              {currentScore >= baselineScore ? '+' : ''}{((currentScore - baselineScore) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">vs Baseline</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${Math.abs(totalWeight - 1.0) < 0.01 ? 'text-green-600' : 'text-yellow-600'}`}>
              {(totalWeight * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Total Weight</div>
          </div>
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="space-y-4 mb-8">
        {parameters.map((param) => (
          <div key={param.name} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold capitalize">
                  {param.name.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </h3>
                <p className="text-sm text-gray-600">{param.description}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getImpactColor(param.impact)}`}>
                  {param.impact.toUpperCase()} IMPACT
                </span>
                <div className="text-lg font-bold text-blue-600">
                  {(param.value * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={param.value}
                onChange={(e) => updateParameter(param.name, parseFloat(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min={param.min}
                max={param.max}
                step={param.step}
                value={param.value}
                onChange={(e) => updateParameter(param.name, parseFloat(e.target.value))}
                className="w-20 px-2 py-1 border rounded text-center"
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{(param.min * 100).toFixed(1)}%</span>
              <span>{(param.max * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Optimization Results */}
      {tuningResults.length > 0 && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">🎯 Optimization Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(Math.max(...tuningResults.map(r => r.score)) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Best Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{((Math.max(...tuningResults.map(r => r.improvement)) * 100)).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Max Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {tuningResults.length}
              </div>
              <div className="text-sm text-gray-600">Iterations</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium mb-2">Optimization Summary</h4>
            <p className="text-sm text-gray-700">
              Auto-optimization tested {tuningResults.length} parameter combinations,
              achieving a maximum score improvement of +{(Math.max(...tuningResults.map(r => r.improvement)) * 100).toFixed(1)}%
              over the baseline. The optimized parameters have been applied to the current configuration.
            </p>
          </div>
        </div>
      )}

      {/* Parameter Impact Analysis */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">Parameter Impact Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-blue-800">High Impact Parameters</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Column Prediction: Affects position-based accuracy</li>
              <li>• Skip Analysis: Critical for timing predictions</li>
              <li>• Deflate Efficiency: Impacts filter effectiveness</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-blue-800">Optimization Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Keep total weight at 100% for best results</li>
              <li>• High impact parameters should be 15-25%</li>
              <li>• Test changes gradually to measure impact</li>
              <li>• Use auto-optimization for systematic improvement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterTuning;
