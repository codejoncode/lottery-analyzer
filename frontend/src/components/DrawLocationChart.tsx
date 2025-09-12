import React, { useState, useEffect } from 'react';
import { DrawLocationAnalyzer } from '../prediction-engine/analysis/DrawLocationAnalyzer';
import type { Draw } from '../utils/scoringSystem';

interface DrawLocationChartProps {
  draws: Draw[];
}

const DrawLocationChart: React.FC<DrawLocationChartProps> = ({ draws }) => {
  const [drawLocationAnalyzer] = useState(() => new DrawLocationAnalyzer(draws));
  const [analysis, setAnalysis] = useState<any>(null);
  const [overUnderAnalysis, setOverUnderAnalysis] = useState<any>(null);
  const [drawRange, setDrawRange] = useState<any>(null);

  useEffect(() => {
    updateAnalysis();
  }, [draws]);

  const updateAnalysis = () => {
    const locationAnalysis = drawLocationAnalyzer.getAnalysis();
    const overUnder = drawLocationAnalyzer.getOverUnderAnalysis();
    const range = drawLocationAnalyzer.getDrawIndexRange();

    setAnalysis(locationAnalysis);
    setOverUnderAnalysis(overUnder);
    setDrawRange(range);
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'increasing': return 'text-green-600 bg-green-100';
      case 'decreasing': return 'text-red-600 bg-red-100';
      case 'stable': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOverUnderColor = (value: number): string => {
    if (value > 0) return 'text-green-600 bg-green-100';
    if (value < 0) return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  if (!analysis || !overUnderAnalysis) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing draw locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📍 Draw Location Analysis</h2>
        <button
          onClick={updateAnalysis}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Draw Range Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-md">
          <div className="text-3xl font-bold text-blue-600">{drawRange.start}</div>
          <div className="text-sm text-blue-800">Start Draw</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-md">
          <div className="text-3xl font-bold text-green-600">{drawRange.end}</div>
          <div className="text-sm text-green-800">End Draw</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-md">
          <div className="text-3xl font-bold text-purple-600">{drawRange.total}</div>
          <div className="text-sm text-purple-800">Total Draws</div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">📈 Trend Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Draw Sum Trend</h4>
            <div className={`p-3 rounded-md ${getTrendColor(analysis.sumTrend)}`}>
              <div className="text-lg font-bold capitalize">{analysis.sumTrend}</div>
              <div className="text-sm mt-1">
                Average Change: {analysis.averageChange?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Volatility</h4>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-lg font-bold">{analysis.volatility?.toFixed(2) || 'N/A'}</div>
              <div className="text-sm text-gray-600">Standard Deviation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Over/Under Analysis */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">⚖️ Over/Under Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Recent Performance</h4>
            <div className={`p-3 rounded-md ${getOverUnderColor(overUnderAnalysis.recentOverUnder)}`}>
              <div className="text-lg font-bold">
                {overUnderAnalysis.recentOverUnder > 0 ? 'Over' : overUnderAnalysis.recentOverUnder < 0 ? 'Under' : 'At Average'}
              </div>
              <div className="text-sm mt-1">
                Deviation: {overUnderAnalysis.recentOverUnder?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Prediction Zone</h4>
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="text-lg font-bold">
                {overUnderAnalysis.predictedRange ? `${overUnderAnalysis.predictedRange[0]} - ${overUnderAnalysis.predictedRange[1]}` : 'N/A'}
              </div>
              <div className="text-sm text-blue-600">Next Draw Range</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">🔄 Pattern Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-md">
            <div className="text-2xl font-bold text-green-600">
              {analysis.patternStrength?.toFixed(2) || 'N/A'}
            </div>
            <div className="text-sm text-green-800">Pattern Strength</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-md">
            <div className="text-2xl font-bold text-yellow-600">
              {analysis.autocorrelation?.toFixed(2) || 'N/A'}
            </div>
            <div className="text-sm text-yellow-800">Autocorrelation</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-md">
            <div className="text-2xl font-bold text-red-600">
              {analysis.confidence?.toFixed(1) || 'N/A'}%
            </div>
            <div className="text-sm text-red-800">Confidence</div>
          </div>
        </div>
      </div>

      {/* Jump Analysis */}
      <div>
        <h3 className="text-lg font-medium mb-4">📊 Jump Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Average Jump</h4>
            <div className="text-2xl font-bold text-blue-600">
              {analysis.averageJump?.toFixed(1) || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Between consecutive draws</div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Jump Volatility</h4>
            <div className="text-2xl font-bold text-purple-600">
              {analysis.jumpVolatility?.toFixed(2) || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Standard deviation of jumps</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawLocationChart;
