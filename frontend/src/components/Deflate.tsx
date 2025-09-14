import React, { useState } from 'react';
import BoxConsolidation from './BoxConsolidation';
import FilterApplication from './FilterApplication';
import SetReduction from './SetReduction';

interface Combination {
  straight: string;
  box: string;
  sum: number;
  rootSum: number;
  parityPattern: string;
  highLowPattern: string;
}

const Deflate: React.FC = () => {
  const consolidatedCombinations: Combination[] = [];
  const [filteredCombinations, setFilteredCombinations] = useState<Combination[]>([]);
  const [activeSubsection, setActiveSubsection] = useState<'consolidation' | 'filter' | 'reduction'>('consolidation');

  const handleFilteredChange = (combinations: Combination[]) => {
    setFilteredCombinations(combinations);
  };

  const subsections = [
    {
      id: 'consolidation' as const,
      title: 'Box Consolidation',
      description: 'Convert straight combinations to unique boxes',
      component: <BoxConsolidation />
    },
    {
      id: 'filter' as const,
      title: 'Filter Application',
      description: 'Apply multiple filters to refine combinations',
      component: (
        <FilterApplication
          combinations={consolidatedCombinations}
          onFilteredChange={handleFilteredChange}
        />
      )
    },
    {
      id: 'reduction' as const,
      title: 'Set Reduction',
      description: 'View final results and export combinations',
      component: <SetReduction combinations={filteredCombinations} />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🗜️ Deflate</h1>
          <p className="text-gray-600">Compress and filter Pick 3 combinations to actionable sets</p>
        </div>

        {/* Subsection Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Progress Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Process Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {consolidatedCombinations.length}
              </div>
              <div className="text-sm text-gray-600">Consolidated Combinations</div>
              <div className="text-xs text-gray-500 mt-1">From box consolidation</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {filteredCombinations.length}
              </div>
              <div className="text-sm text-gray-600">Filtered Combinations</div>
              <div className="text-xs text-gray-500 mt-1">
                {consolidatedCombinations.length > 0
                  ? `${((filteredCombinations.length / consolidatedCombinations.length) * 100).toFixed(1)}% of consolidated`
                  : 'After applying filters'
                }
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {consolidatedCombinations.length - filteredCombinations.length}
              </div>
              <div className="text-sm text-gray-600">Combinations Removed</div>
              <div className="text-xs text-gray-500 mt-1">
                {consolidatedCombinations.length > 0
                  ? `${(((consolidatedCombinations.length - filteredCombinations.length) / consolidatedCombinations.length) * 100).toFixed(1)}% reduction`
                  : 'Through filtering'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deflate;
