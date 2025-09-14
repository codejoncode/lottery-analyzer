import React, { useState, useEffect } from 'react';
import { PowerballScoringSystem, DataManager, type Draw } from '../utils/scoringSystem';
import { HoverAnalysis } from './HoverAnalysis';

interface DrawSummaryPageProps {
  selectedDraw?: Draw;
  onDrawSelect?: (draw: Draw) => void;
}

const DrawSummaryPage: React.FC<DrawSummaryPageProps> = ({
  selectedDraw,
  onDrawSelect
}) => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [selectedDrawData, setSelectedDrawData] = useState<Draw | undefined>(selectedDraw);
  const [loading, setLoading] = useState(true);
  const [scoringSystem] = useState(() => new PowerballScoringSystem());

  useEffect(() => {
    loadDraws();
  }, []);

  useEffect(() => {
    if (selectedDraw) {
      setSelectedDrawData(selectedDraw);
    }
  }, [selectedDraw]);

  const loadDraws = async () => {
    try {
      const dataManager = DataManager.getInstance();
      const allDraws = dataManager.loadData();
      setDraws(allDraws.slice(0, 50)); // Show last 50 draws
    } catch (error) {
      console.error('Error loading draws:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawClick = (draw: Draw) => {
    setSelectedDrawData(draw);
    if (onDrawSelect) {
      onDrawSelect(draw);
    }
  };

  const renderDrawCard = (draw: Draw, index: number) => {
    const whiteBalls = draw.white_balls;
    const powerball = draw.red_ball;
    const sum = whiteBalls.reduce((a: number, b: number) => a + b, 0);

    return (
      <HoverAnalysis
        key={index}
        draw={draw}
        columnAnalyzer={scoringSystem.getColumnAnalyzer()}
        position="right"
      >
        <div
          className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedDrawData?.date === draw.date
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleDrawClick(draw)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">{draw.date}</span>
            <span className="text-sm text-gray-600">Sum: {sum}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {whiteBalls.map((num: number, idx: number) => (
                <span
                  key={idx}
                  className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold"
                >
                  {num}
                </span>
              ))}
            </div>
            <span className="text-gray-400 text-sm">+</span>
            <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {powerball}
            </span>
          </div>
        </div>
      </HoverAnalysis>
    );
  };

  const renderDetailedAnalysis = () => {
    if (!selectedDrawData) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Draw</h3>
          <p className="text-gray-600">Click on any draw from the list to see detailed analysis</p>
        </div>
      );
    }

    const columnAnalyzer = scoringSystem.getColumnAnalyzer();
    const whiteBalls = selectedDrawData.white_balls;
    const powerball = selectedDrawData.red_ball;

    // Calculate comprehensive statistics
    const sum = whiteBalls.reduce((a: number, b: number) => a + b, 0);
    const evenCount = whiteBalls.filter((n: number) => n % 2 === 0).length;
    const highCount = whiteBalls.filter((n: number) => n > 34).length;
    const primeCount = whiteBalls.filter((n: number) => isPrime(n)).length;
    const consecutiveCount = whiteBalls.filter((n: number, idx: number) =>
      checkConsecutive(n, selectedDrawData, idx + 1)
    ).length;

    // Get column analysis for each number
    const columnAnalysis = [];
    for (let col = 1; col <= 6; col++) {
      const number = col === 6 ? powerball : whiteBalls[col - 1];
      const analysis = columnAnalyzer.analyzeColumn(col);
      const stats = analysis.numberStats.get(`${col}-${number}`);

      columnAnalysis.push({
        column: col,
        number,
        stats,
        analysis: analysis
      });
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Draw Analysis</h2>
            <span className="text-lg text-gray-600">{selectedDrawData.date}</span>
          </div>

          {/* Numbers Display */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex gap-2">
              {whiteBalls.map((number: number, index: number) => (
                <div key={index} className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {number}
                </div>
              ))}
            </div>
            <div className="text-2xl text-gray-400">+</div>
            <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              {powerball}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{sum}</div>
            <div className="text-gray-600">Total Sum</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{evenCount}/5</div>
            <div className="text-gray-600">Even Numbers</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{highCount}/5</div>
            <div className="text-gray-600">High Numbers</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{primeCount}/5</div>
            <div className="text-gray-600">Prime Numbers</div>
          </div>
        </div>

        {/* Column Analysis Grid */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Column-by-Column Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {columnAnalysis.map((col) => (
              <div key={col.column} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    {col.column === 6 ? 'Powerball' : `Column ${col.column}`}
                  </h4>
                  <span className="text-2xl font-bold text-blue-600">{col.number}</span>
                </div>

                {col.stats && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Skips:</span>
                      <span className="font-medium">{col.stats.drawsSinceLastAppearance}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Gap:</span>
                      <span className="font-medium">{col.stats.averageGap.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Trend:</span>
                      <span className={`font-medium ${
                        col.stats.trend === 'increasing' ? 'text-green-600' :
                        col.stats.trend === 'decreasing' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {col.stats.trend}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {col.stats.isHot && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Hot
                        </span>
                      )}
                      {col.stats.isCold && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Cold
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Pattern Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Even Numbers', value: `${evenCount}/5`, color: 'bg-green-100 text-green-800' },
              { label: 'High Numbers', value: `${highCount}/5`, color: 'bg-purple-100 text-purple-800' },
              { label: 'Prime Numbers', value: `${primeCount}/5`, color: 'bg-orange-100 text-orange-800' },
              { label: 'Consecutive', value: `${consecutiveCount}`, color: 'bg-yellow-100 text-yellow-800' }
            ].map((pattern, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold mb-1">{pattern.value}</div>
                <div className="text-sm text-gray-600">{pattern.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const isPrime = (num: number): boolean => {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
  };

  const checkConsecutive = (number: number, draw: Draw, _column: number): boolean => {
    const allNumbers = [...draw.white_balls, draw.red_ball];
    return allNumbers.some(n => Math.abs(n - number) === 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading draws...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Draw Summary & Analysis
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of individual Powerball draws with column-based insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Draws List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Draws</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {draws.map((draw, index) => renderDrawCard(draw, index))}
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="lg:col-span-2">
            {renderDetailedAnalysis()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawSummaryPage;
