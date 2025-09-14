import React, { useState, useMemo } from 'react';

interface Combination {
  straight: string;
  box: string;
  sum: number;
  rootSum: number;
  parityPattern: string;
  highLowPattern: string;
}

interface FilterApplicationProps {
  combinations: Combination[];
  onFilteredChange: (filtered: Combination[]) => void;
}

type FilterValue = 'all' | 'single' | 'double' | 'triple' | number | number[] | string[];

const FilterApplication: React.FC<FilterApplicationProps> = ({ combinations, onFilteredChange }) => {
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'single' | 'double' | 'triple',
    sumMin: 0,
    sumMax: 27,
    rootSum: [] as number[],
    parityPattern: [] as string[],
    highLowPattern: [] as string[],
    vtracFamily: [] as string[]
  });

  const filteredCombinations = useMemo(() => {
    let combos = combinations;

    // Type filter
    if (filters.type !== 'all') {
      combos = combos.filter(combo => {
        const sorted = combo.box.split('');
        switch (filters.type) {
          case 'single':
            return sorted[0] !== sorted[1] && sorted[1] !== sorted[2] && sorted[0] !== sorted[2];
          case 'double':
            return (sorted[0] === sorted[1] && sorted[1] !== sorted[2]) ||
                   (sorted[1] === sorted[2] && sorted[0] !== sorted[1]) ||
                   (sorted[0] === sorted[2] && sorted[0] !== sorted[1]);
          case 'triple':
            return sorted[0] === sorted[1] && sorted[1] === sorted[2];
          default:
            return true;
        }
      });
    }

    // Sum range filter
    combos = combos.filter(combo =>
      combo.sum >= filters.sumMin && combo.sum <= filters.sumMax
    );

    // Root sum filter
    if (filters.rootSum.length > 0) {
      combos = combos.filter(combo => filters.rootSum.includes(combo.rootSum));
    }

    // Parity pattern filter
    if (filters.parityPattern.length > 0) {
      combos = combos.filter(combo => filters.parityPattern.includes(combo.parityPattern));
    }

    // High/Low pattern filter
    if (filters.highLowPattern.length > 0) {
      combos = combos.filter(combo => filters.highLowPattern.includes(combo.highLowPattern));
    }

    return combos;
  }, [combinations, filters]);

  // Notify parent of filtered results
  React.useEffect(() => {
    onFilteredChange(filteredCombinations);
  }, [filteredCombinations, onFilteredChange]);

  const updateFilter = (key: string, value: FilterValue) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof typeof filters, value: number | string) => {
    setFilters(prev => {
      const currentArray = prev[key] as (number | string)[];
      const isIncluded = currentArray.includes(value);
      return {
        ...prev,
        [key]: isIncluded
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      sumMin: 0,
      sumMax: 27,
      rootSum: [],
      parityPattern: [],
      highLowPattern: [],
      vtracFamily: []
    });
  };

  const filterStats = useMemo(() => {
    const total = combinations.length;
    const filtered = filteredCombinations.length;
    const reduction = total - filtered;
    const reductionPercent = total > 0 ? (reduction / total * 100).toFixed(1) : '0.0';

    return {
      total,
      filtered,
      reduction,
      reductionPercent
    };
  }, [combinations, filteredCombinations]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">🔍 Filter Application</h3>
        <p className="text-gray-600">Apply multiple filters to refine your combination set</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filters Section */}
        <div className="space-y-6">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Combination Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value as 'all' | 'single' | 'double' | 'triple')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="single">Singles (6-way)</option>
              <option value="double">Doubles (3-way)</option>
              <option value="triple">Triples (1-way)</option>
            </select>
          </div>

          {/* Sum Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sum Range
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                max="27"
                value={filters.sumMin}
                onChange={(e) => updateFilter('sumMin', parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min="0"
                max="27"
                value={filters.sumMax}
                onChange={(e) => updateFilter('sumMax', parseInt(e.target.value) || 27)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Root Sum Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Root Sum
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <label key={num} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.rootSum.includes(num)}
                    onChange={() => toggleArrayFilter('rootSum', num)}
                    className="mr-2"
                  />
                  <span className="text-sm">{num}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Parity Pattern Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parity Patterns (Even/Odd)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['EEE', 'EEO', 'EOE', 'EOO', 'OEE', 'OEO', 'OOE', 'OOO'].map(pattern => (
                <label key={pattern} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.parityPattern.includes(pattern)}
                    onChange={() => toggleArrayFilter('parityPattern', pattern)}
                    className="mr-2"
                  />
                  <span className="text-sm font-mono">{pattern}</span>
                </label>
              ))}
            </div>
          </div>

          {/* High/Low Pattern Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              High/Low Patterns
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['HHH', 'HHL', 'HLH', 'HLL', 'LHH', 'LHL', 'LLH', 'LLL'].map(pattern => (
                <label key={pattern} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.highLowPattern.includes(pattern)}
                    onChange={() => toggleArrayFilter('highLowPattern', pattern)}
                    className="mr-2"
                  />
                  <span className="text-sm font-mono">{pattern}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="pt-4">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Filter Results Summary */}
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Filter Results</h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{filterStats.total}</div>
                <div className="text-sm text-blue-800">Total Combinations</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{filterStats.filtered}</div>
                <div className="text-sm text-green-800">Filtered Combinations</div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {filterStats.reduction} combinations filtered out ({filterStats.reductionPercent}% reduction)
              </div>
              <div className="text-sm text-red-800">Filter Efficiency</div>
            </div>
          </div>

          {/* Active Filters Summary */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Active Filters</h4>
            <div className="space-y-2">
              {filters.type !== 'all' && (
                <div className="flex justify-between items-center py-2 px-3 bg-gray-100 rounded">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm text-gray-600 capitalize">{filters.type}</span>
                </div>
              )}

              {(filters.sumMin !== 0 || filters.sumMax !== 27) && (
                <div className="flex justify-between items-center py-2 px-3 bg-gray-100 rounded">
                  <span className="text-sm font-medium">Sum Range:</span>
                  <span className="text-sm text-gray-600">{filters.sumMin} - {filters.sumMax}</span>
                </div>
              )}

              {filters.rootSum.length > 0 && (
                <div className="flex justify-between items-center py-2 px-3 bg-gray-100 rounded">
                  <span className="text-sm font-medium">Root Sum:</span>
                  <span className="text-sm text-gray-600">{filters.rootSum.join(', ')}</span>
                </div>
              )}

              {filters.parityPattern.length > 0 && (
                <div className="flex justify-between items-center py-2 px-3 bg-gray-100 rounded">
                  <span className="text-sm font-medium">Parity:</span>
                  <span className="text-sm text-gray-600 font-mono">{filters.parityPattern.join(', ')}</span>
                </div>
              )}

              {filters.highLowPattern.length > 0 && (
                <div className="flex justify-between items-center py-2 px-3 bg-gray-100 rounded">
                  <span className="text-sm font-medium">High/Low:</span>
                  <span className="text-sm text-gray-600 font-mono">{filters.highLowPattern.join(', ')}</span>
                </div>
              )}

              {filters.type === 'all' && filters.sumMin === 0 && filters.sumMax === 27 &&
               filters.rootSum.length === 0 && filters.parityPattern.length === 0 &&
               filters.highLowPattern.length === 0 && (
                <div className="py-4 px-3 text-center text-gray-500">
                  No active filters
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterApplication;
