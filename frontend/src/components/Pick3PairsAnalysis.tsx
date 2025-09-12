import React, { useState } from 'react';
import FullPairsGrid from './FullPairsGrid';
import UniquePairsGrid from './UniquePairsGrid';
import FrontSplitBackGrids from './FrontSplitBackGrids';
import EmptyColumnDetection from './EmptyColumnDetection';

const Pick3PairsAnalysis: React.FC = () => {
  const [activeSubsection, setActiveSubsection] = useState<'full' | 'unique' | 'front-split-back' | 'empty-detection'>('full');

  const subsections = [
    {
      id: 'full' as const,
      title: '10×10 Full Pairs',
      description: 'Complete grid of all possible pairs with interactive analysis',
      component: <FullPairsGrid />
    },
    {
      id: 'unique' as const,
      title: '5×9 Unique Pairs',
      description: 'Unique pairs grid with sum-based analysis',
      component: <UniquePairsGrid />
    },
    {
      id: 'front-split-back' as const,
      title: 'Front/Split/Back Grids',
      description: 'Position-specific pair analysis across different combinations',
      component: <FrontSplitBackGrids />
    },
    {
      id: 'empty-detection' as const,
      title: 'Empty Column Detection',
      description: 'Identify and analyze empty columns in pair grids',
      component: <EmptyColumnDetection />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔢 Pairs Analysis</h1>
          <p className="text-gray-600">Comprehensive analysis of pair patterns in Pick 3 combinations</p>
        </div>

        {/* Subsection Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subsections.map((subsection) => (
                <button
                  key={subsection.id}
                  onClick={() => setActiveSubsection(subsection.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    activeSubsection === subsection.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-1">{subsection.title}</h3>
                  <p className="text-sm opacity-75">{subsection.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Subsection Content */}
        <div className="mb-8">
          {subsections.find(s => s.id === activeSubsection)?.component}
        </div>

        {/* Analysis Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Pairs Analysis Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">100</div>
              <div className="text-sm text-gray-600">Total Possible Pairs</div>
              <div className="text-xs text-gray-500 mt-1">00-99 combinations</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">55</div>
              <div className="text-sm text-gray-600">Unique Pairs</div>
              <div className="text-xs text-gray-500 mt-1">Unordered combinations</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">3</div>
              <div className="text-sm text-gray-600">Position Types</div>
              <div className="text-xs text-gray-500 mt-1">Front, split, and back pairs</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">~30%</div>
              <div className="text-sm text-gray-600">Avg Empty Rate</div>
              <div className="text-xs text-gray-500 mt-1">Columns without recent hits</div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🔍 Pattern Detection</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Hot pairs: High frequency combinations</li>
                <li>• Cold pairs: Long time since last appearance</li>
                <li>• Consecutive pairs: Adjacent digit combinations</li>
                <li>• Mirror pairs: Symmetrical digit relationships</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">📈 Analysis Features</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Real-time frequency tracking</li>
                <li>• Skip count analysis</li>
                <li>• Trend identification</li>
                <li>• Position-specific insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pick3PairsAnalysis;
