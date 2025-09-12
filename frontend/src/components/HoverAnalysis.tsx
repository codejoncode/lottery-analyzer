import React, { useState } from 'react';
import type { Draw, ColumnAnalyzer } from '../utils/scoringSystem';

interface HoverAnalysisProps {
  draw: Draw;
  columnAnalyzer: ColumnAnalyzer | null;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const HoverAnalysis: React.FC<HoverAnalysisProps> = ({
  draw,
  columnAnalyzer,
  children,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const renderQuickAnalysis = () => {
    if (!columnAnalyzer) return null;

    const whiteBalls = draw.white_balls;
    const powerball = draw.red_ball;
    const sum = whiteBalls.reduce((a, b) => a + b, 0);
    const evenCount = whiteBalls.filter(n => n % 2 === 0).length;
    const highCount = whiteBalls.filter(n => n > 34).length;

    // Get column stats for each number
    const columnStats = [];
    for (let col = 1; col <= 6; col++) {
      const number = col === 6 ? powerball : whiteBalls[col - 1];
      const analysis = columnAnalyzer.analyzeColumn(col);
      const stats = analysis.numberStats.get(`${col}-${number}`);
      columnStats.push({
        column: col,
        number,
        skips: stats?.drawsSinceLastAppearance || 0,
        isHot: stats?.isHot || false,
        isCold: stats?.isCold || false
      });
    }

    return (
      <div className={`absolute ${getPositionClasses()} bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-80`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Draw Analysis</h4>
          <span className="text-xs text-gray-500">{draw.date}</span>
        </div>

        {/* Numbers Display */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            {whiteBalls.map((num, idx) => (
              <span key={idx} className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {num}
              </span>
            ))}
          </div>
          <span className="text-gray-400">+</span>
          <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {powerball}
          </span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{sum}</div>
            <div className="text-gray-600">Sum</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{evenCount}/5</div>
            <div className="text-gray-600">Even</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">{highCount}/5</div>
            <div className="text-gray-600">High</div>
          </div>
        </div>

        {/* Column Performance */}
        <div className="border-t pt-3">
          <div className="text-xs text-gray-600 mb-2">Column Status:</div>
          <div className="grid grid-cols-6 gap-1">
            {columnStats.map((stat) => (
              <div key={stat.column} className="text-center">
                <div className="text-xs font-medium">
                  {stat.column === 6 ? 'PB' : stat.column}
                </div>
                <div className="text-xs text-gray-600">{stat.number}</div>
                <div className="flex justify-center gap-0.5 mt-1">
                  {stat.isHot && <span className="w-2 h-2 bg-red-500 rounded-full" title="Hot"></span>}
                  {stat.isCold && <span className="w-2 h-2 bg-blue-500 rounded-full" title="Cold"></span>}
                </div>
                <div className="text-xs text-gray-500">{stat.skips}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow pointer */}
        <div className={`absolute w-2 h-2 bg-white border-gray-200 transform rotate-45 ${
          position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-b border-r' :
          position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-t border-l' :
          position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r' :
          'right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l'
        }`}></div>
      </div>
    );
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && renderQuickAnalysis()}
    </div>
  );
};
