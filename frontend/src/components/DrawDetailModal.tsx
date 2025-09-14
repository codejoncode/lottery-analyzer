import React from 'react';
import type { Draw, ColumnAnalyzer, ColumnStats, PatternColumnStats } from '../utils/scoringSystem';

interface DrawDetailModalProps {
  draw: Draw | null;
  columnAnalyzer: ColumnAnalyzer | null;
  onClose: () => void;
}

export const DrawDetailModal: React.FC<DrawDetailModalProps> = ({ draw, columnAnalyzer, onClose }) => {
  if (!draw || !columnAnalyzer) return null;

  const getColumnName = (column: number): string => {
    if (column === 6) return 'Powerball';
    return `Position ${column}`;
  };

  const getNumberStats = (number: number, column: number): ColumnStats | null => {
    if (!columnAnalyzer) return null;
    const analysis = columnAnalyzer.analyzeColumn(column);
    return analysis.numberStats.get(`${column}-${number}`) || null;
  };

  const getPatternStats = (pattern: string, column: number): PatternColumnStats | null => {
    if (!columnAnalyzer) return null;
    const analysis = columnAnalyzer.analyzeColumn(column);
    return analysis.patternStats.get(`${pattern}-${column}`) || null;
  };

  const analyzeNumber = (number: number, column: number) => {
    const isEven = number % 2 === 0;
    const isHigh = column === 6 ? number > 13 : number > 34;
    const isPrime = isPrimeNumber(number);
    const sumDigits = sumOfDigits(number);
    const lastDigit = number % 10;
    const firstDigit = Math.floor(number / 10);

    return {
      isEven,
      isHigh,
      isPrime,
      sumDigits,
      lastDigit,
      firstDigit,
      isConsecutive: checkConsecutive(number, draw, column)
    };
  };

  const isPrimeNumber = (num: number): boolean => {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
  };

  const sumOfDigits = (num: number): number => {
    return num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  };

  const checkConsecutive = (number: number, draw: Draw, _column: number): boolean => {
    const allNumbers = [...draw.white_balls, draw.red_ball];
    return allNumbers.some(n => Math.abs(n - number) === 1);
  };

  const renderNumberAnalysis = (number: number, column: number) => {
    const stats = getNumberStats(number, column);
    const analysis = analyzeNumber(number, column);

    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-lg font-bold text-gray-900">{number}</h4>
            <p className="text-sm text-gray-600">{getColumnName(column)}</p>
          </div>
          <div className="text-right">
            {stats && (
              <div className="text-sm">
                <div className="text-gray-600">Skips: <span className="font-semibold">{stats.drawsSinceLastAppearance}</span></div>
                <div className="text-gray-600">Avg Gap: <span className="font-semibold">{stats.averageGap.toFixed(1)}</span></div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className={`px-2 py-1 rounded ${analysis.isEven ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            {analysis.isEven ? 'Even' : 'Odd'}
          </div>
          <div className={`px-2 py-1 rounded ${analysis.isHigh ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {analysis.isHigh ? 'High' : 'Low'}
          </div>
          <div className={`px-2 py-1 rounded ${analysis.isPrime ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
            {analysis.isPrime ? 'Prime' : 'Non-Prime'}
          </div>
          <div className={`px-2 py-1 rounded ${analysis.isConsecutive ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'}`}>
            {analysis.isConsecutive ? 'Consec' : 'Non-Consec'}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
          <div>Sum: <span className="font-semibold">{analysis.sumDigits}</span></div>
          <div>Last: <span className="font-semibold">{analysis.lastDigit}</span></div>
          <div>First: <span className="font-semibold">{analysis.firstDigit}</span></div>
        </div>

        {stats && (
          <div className="mt-3 flex gap-2">
            {stats.isHot && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Hot
              </span>
            )}
            {stats.isCold && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Cold
              </span>
            )}
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              stats.trend === 'increasing' ? 'bg-green-100 text-green-800' :
              stats.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {stats.trend}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderPatternAnalysis = () => {
    const patterns = [
      { name: 'Even Numbers', pattern: 'even', column: 1 },
      { name: 'Odd Numbers', pattern: 'odd', column: 1 },
      { name: 'High Numbers', pattern: 'high', column: 1 },
      { name: 'Low Numbers', pattern: 'low', column: 1 },
      { name: 'Prime Numbers', pattern: 'prime', column: 1 },
      { name: 'Consecutive', pattern: 'consecutive', column: 1 },
    ];

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patterns.map(({ name, pattern, column }) => {
            const stats = getPatternStats(pattern, column);
            if (!stats) return null;

            return (
              <div key={pattern} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{name}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Skips: <span className="font-semibold">{stats.drawsSinceLastAppearance}</span></div>
                  <div className="text-gray-600">Avg Gap: <span className="font-semibold">{stats.averageGap.toFixed(1)}</span></div>
                  <div className="text-gray-600">Appearances: <span className="font-semibold">{stats.totalAppearances}</span></div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    stats.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                    stats.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {stats.trend}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDrawSummary = () => {
    const whiteBalls = draw.white_balls;
    const powerball = draw.red_ball;
    const sum = whiteBalls.reduce((a, b) => a + b, 0);
    const evenCount = whiteBalls.filter(n => n % 2 === 0).length;
    const highCount = whiteBalls.filter(n => n > 34).length;
    const primeCount = whiteBalls.filter(n => isPrimeNumber(n)).length;

    // Calculate column performance
    const columnPerformance = [];
    for (let col = 1; col <= 6; col++) {
      const number = col === 6 ? powerball : whiteBalls[col - 1];
      const stats = getNumberStats(number, col);
      columnPerformance.push({
        column: col,
        number,
        isHot: stats?.isHot || false,
        isCold: stats?.isCold || false,
        skips: stats?.drawsSinceLastAppearance || 0,
        trend: stats?.trend || 'stable'
      });
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Draw Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{sum}</div>
            <div className="text-sm text-blue-800">Sum</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{evenCount}/5</div>
            <div className="text-sm text-green-800">Even</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{highCount}/5</div>
            <div className="text-sm text-purple-800">High</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{primeCount}/5</div>
            <div className="text-sm text-orange-800">Prime</div>
          </div>
        </div>

        {/* Column Performance Grid */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Column Performance</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {columnPerformance.map((perf) => (
              <div key={perf.column} className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-sm font-medium text-gray-900">
                  {perf.column === 6 ? 'PB' : `Col ${perf.column}`}
                </div>
                <div className="text-lg font-bold text-blue-600">{perf.number}</div>
                <div className="flex justify-center gap-1 mt-1">
                  {perf.isHot && (
                    <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
                      H
                    </span>
                  )}
                  {perf.isCold && (
                    <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                      C
                    </span>
                  )}
                  <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded ${
                    perf.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                    perf.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {perf.trend === 'increasing' ? '↗' : perf.trend === 'decreasing' ? '↘' : '→'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">Skip: {perf.skips}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Draw Analysis</h2>
            <p className="text-gray-600">{draw.date}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Draw Numbers Display */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Numbers Drawn</h3>
            <div className="flex flex-wrap gap-4">
              {draw.white_balls.map((number, index) =>
                renderNumberAnalysis(number, index + 1)
              )}
              {renderNumberAnalysis(draw.red_ball, 6)}
            </div>
          </div>

          {/* Draw Summary */}
          {renderDrawSummary()}

          {/* Pattern Analysis */}
          {renderPatternAnalysis()}

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Power Play:</span> {draw.power_play}
              </div>
              <div>
                <span className="font-medium">Draw Date:</span> {draw.date}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
