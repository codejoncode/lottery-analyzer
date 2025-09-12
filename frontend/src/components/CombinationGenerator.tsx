import React, { useState, useMemo } from 'react';
import { Link } from "react-router";

interface Combination {
  white_balls: number[];
  powerball: number;
  sum: number;
  evenCount: number;
  oddCount: number;
  hotCount: number;
  coldCount: number;
  range: string;
}

interface FilterCriteria {
  sumRange: { min: number; max: number };
  evenCount: { min: number; max: number };
  oddCount: { min: number; max: number };
  hotCount: { min: number; max: number };
  coldCount: { min: number; max: number };
  includeNumbers: number[];
  excludeNumbers: number[];
  powerballRange: { min: number; max: number };
  customLists: number[][];
  digitSumRange: { min: number; max: number };
  lastDigitPattern: string;
  firstDigitPattern: string;
  consecutiveNumbers: { min: number; max: number };
  numberSpacing: { min: number; max: number };
}

const CombinationGenerator: React.FC = () => {
  const [filters, setFilters] = useState<FilterCriteria>({
    sumRange: { min: 0, max: 1000 },
    evenCount: { min: 0, max: 5 },
    oddCount: { min: 0, max: 5 },
    hotCount: { min: 0, max: 5 },
    coldCount: { min: 0, max: 5 },
    includeNumbers: [],
    excludeNumbers: [],
    powerballRange: { min: 1, max: 26 },
    customLists: [],
    digitSumRange: { min: 0, max: 100 },
    lastDigitPattern: '',
    firstDigitPattern: '',
    consecutiveNumbers: { min: 0, max: 5 },
    numberSpacing: { min: 1, max: 69 }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [maxResults, setMaxResults] = useState(1000);

  // Optimized combination generation with pre-filtering
  const generateFilteredCombinations = async () => {
    setIsGenerating(true);
    const results: Combination[] = [];

    // For better performance, we'll use a sampling approach
    // Generate combinations in batches and apply filters progressively
    const batchSize = 10000;
    const maxIterations = Math.min(maxResults * 2, 50000); // Limit iterations for performance

    for (let i = 0; i < maxIterations && results.length < maxResults; i++) {
      // Generate a batch of random combinations
      for (let j = 0; j < batchSize && results.length < maxResults; j++) {
        const white_balls = generateRandomCombination();
        const powerball = Math.floor(Math.random() * 26) + 1;

        const combination = createCombination(white_balls, powerball);

        if (matchesFilters(combination)) {
          results.push(combination);
        }
      }

      // Yield control to prevent blocking the UI
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    setCombinations(results);
    setIsGenerating(false);
  };

  const generateRandomCombination = (): number[] => {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 69) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  };

  const createCombination = (white_balls: number[], powerball: number): Combination => {
    const sum = white_balls.reduce((a, b) => a + b, 0);
    const evenCount = white_balls.filter(n => n % 2 === 0).length;
    const oddCount = 5 - evenCount;

    // Mock hot/cold classification (in real app, this would be based on actual data)
    const hotNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // Example
    const hotCount = white_balls.filter(n => hotNumbers.includes(n)).length;
    const coldCount = 5 - hotCount;

    const min = Math.min(...white_balls);
    const max = Math.max(...white_balls);
    const range = `${min}-${max}`;

    return {
      white_balls,
      powerball,
      sum,
      evenCount,
      oddCount,
      hotCount,
      coldCount,
      range
    };
  };

  const matchesFilters = (combo: Combination): boolean => {
    // Sum range filter
    if (combo.sum < filters.sumRange.min || combo.sum > filters.sumRange.max) return false;

    // Even/odd count filters
    if (combo.evenCount < filters.evenCount.min || combo.evenCount > filters.evenCount.max) return false;
    if (combo.oddCount < filters.oddCount.min || combo.oddCount > filters.oddCount.max) return false;

    // Hot/cold count filters
    if (combo.hotCount < filters.hotCount.min || combo.hotCount > filters.hotCount.max) return false;
    if (combo.coldCount < filters.coldCount.min || combo.coldCount > filters.coldCount.max) return false;

    // Include/exclude numbers
    if (filters.includeNumbers.length > 0) {
      const hasAllIncluded = filters.includeNumbers.every(num => combo.white_balls.includes(num));
      if (!hasAllIncluded) return false;
    }

    if (filters.excludeNumbers.length > 0) {
      const hasExcluded = filters.excludeNumbers.some(num => combo.white_balls.includes(num));
      if (hasExcluded) return false;
    }

    // Powerball range
    if (combo.powerball < filters.powerballRange.min || combo.powerball > filters.powerballRange.max) return false;

    // Custom lists (must match at least one list if any are defined)
    if (filters.customLists.length > 0) {
      const matchesList = filters.customLists.some(list =>
        list.every(num => combo.white_balls.includes(num))
      );
      if (!matchesList) return false;
    }

    // Digit sum range
    const digitSum = combo.white_balls.reduce((sum, num) => {
      return sum + num.toString().split('').reduce((dSum, digit) => dSum + parseInt(digit), 0);
    }, 0);
    if (digitSum < filters.digitSumRange.min || digitSum > filters.digitSumRange.max) return false;

    // Last digit pattern
    if (filters.lastDigitPattern) {
      const lastDigits = combo.white_balls.map(num => num % 10).join('');
      if (!lastDigits.includes(filters.lastDigitPattern)) return false;
    }

    // First digit pattern
    if (filters.firstDigitPattern) {
      const firstDigits = combo.white_balls.map(num => Math.floor(num / 10)).join('');
      if (!firstDigits.includes(filters.firstDigitPattern)) return false;
    }

    // Consecutive numbers
    let consecutiveCount = 0;
    for (let i = 0; i < combo.white_balls.length - 1; i++) {
      if (combo.white_balls[i + 1] - combo.white_balls[i] === 1) {
        consecutiveCount++;
      }
    }
    if (consecutiveCount < filters.consecutiveNumbers.min || consecutiveCount > filters.consecutiveNumbers.max) return false;

    // Number spacing
    const spacing = combo.white_balls[combo.white_balls.length - 1] - combo.white_balls[0];
    if (spacing < filters.numberSpacing.min || spacing > filters.numberSpacing.max) return false;

    return true;
  };

  const updateFilter = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addToList = (listType: 'includeNumbers' | 'excludeNumbers' | 'customLists', value: string) => {
    if (listType === 'customLists') {
      const numbers = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        setFilters(prev => ({
          ...prev,
          customLists: [...prev.customLists, numbers]
        }));
      }
    } else {
      const numbers = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      setFilters(prev => ({
        ...prev,
        [listType]: [...prev[listType], ...numbers]
      }));
    }
  };

  const filterPresets = {
    'Balanced': {
      sumRange: { min: 150, max: 220 },
      evenCount: { min: 2, max: 3 },
      hotCount: { min: 2, max: 3 },
      consecutiveNumbers: { min: 0, max: 1 }
    },
    'High Sum': {
      sumRange: { min: 220, max: 300 },
      evenCount: { min: 1, max: 4 },
      hotCount: { min: 3, max: 5 }
    },
    'Low Sum': {
      sumRange: { min: 100, max: 150 },
      evenCount: { min: 1, max: 4 },
      coldCount: { min: 2, max: 4 }
    },
    'Even Heavy': {
      evenCount: { min: 3, max: 5 },
      oddCount: { min: 0, max: 2 }
    },
    'Odd Heavy': {
      oddCount: { min: 3, max: 5 },
      evenCount: { min: 0, max: 2 }
    }
  };

  const applyPreset = (presetName: string) => {
    const preset = filterPresets[presetName as keyof typeof filterPresets];
    if (preset) {
      setFilters(prev => ({ ...prev, ...preset }));
    }
  };

  const clearList = (listType: 'includeNumbers' | 'excludeNumbers' | 'customLists', index?: number) => {
    if (listType === 'customLists' && index !== undefined) {
      setFilters(prev => ({
        ...prev,
        customLists: prev.customLists.filter((_, i) => i !== index)
      }));
    } else {
      setFilters(prev => ({ ...prev, [listType]: [] }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <nav className="bg-gray-800 text-white p-4 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Powerball Analyzer</h1>
          <div className="space-x-4">
            <Link to="/" className="hover:text-gray-300">Historical Draws</Link>
            <Link to="/analysis" className="hover:text-gray-300">Number Analysis</Link>
            <Link to="/pairs" className="hover:text-gray-300">Pairs Analysis</Link>
            <Link to="/triples" className="hover:text-gray-300">Triples Analysis</Link>
            <Link to="/grid" className="hover:text-gray-300">Grid Analysis</Link>
            <Link to="/skip" className="hover:text-gray-300">Skip Analysis</Link>
            <Link to="/combinations" className="hover:text-gray-300">Combinations</Link>
            <Link to="/scoring" className="hover:text-gray-300">Scoring System</Link>
          </div>
        </div>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Combination Generator</h1>
        <p className="text-gray-600 mb-4">
          Generate Powerball combinations based on multiple filters. Combine filters to find specific patterns.
        </p>
      </div>

      {/* Filter Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter Configuration</h2>

        {/* Preset Filters */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Quick Presets</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(filterPresets).map(presetName => (
              <button
                key={presetName}
                onClick={() => applyPreset(presetName)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sum Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Sum Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.sumRange.min}
                onChange={(e) => updateFilter('sumRange', { ...filters.sumRange, min: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.sumRange.max}
                onChange={(e) => updateFilter('sumRange', { ...filters.sumRange, max: parseInt(e.target.value) || 1000 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Even Count */}
          <div>
            <label className="block text-sm font-medium mb-2">Even Numbers</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.evenCount.min}
                onChange={(e) => updateFilter('evenCount', { ...filters.evenCount, min: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.evenCount.max}
                onChange={(e) => updateFilter('evenCount', { ...filters.evenCount, max: parseInt(e.target.value) || 5 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Hot Count */}
          <div>
            <label className="block text-sm font-medium mb-2">Hot Numbers</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.hotCount.min}
                onChange={(e) => updateFilter('hotCount', { ...filters.hotCount, min: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.hotCount.max}
                onChange={(e) => updateFilter('hotCount', { ...filters.hotCount, max: parseInt(e.target.value) || 5 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Powerball Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Powerball Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.powerballRange.min}
                onChange={(e) => updateFilter('powerballRange', { ...filters.powerballRange, min: parseInt(e.target.value) || 1 })}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.powerballRange.max}
                onChange={(e) => updateFilter('powerballRange', { ...filters.powerballRange, max: parseInt(e.target.value) || 26 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Include Numbers */}
          <div>
            <label className="block text-sm font-medium mb-2">Include Numbers</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="1,2,3"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addToList('includeNumbers', (e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={() => clearList('includeNumbers')}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {filters.includeNumbers.join(', ')}
            </div>
          </div>

          {/* Digit Sum Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Digit Sum Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.digitSumRange.min}
                onChange={(e) => updateFilter('digitSumRange', { ...filters.digitSumRange, min: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.digitSumRange.max}
                onChange={(e) => updateFilter('digitSumRange', { ...filters.digitSumRange, max: parseInt(e.target.value) || 100 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Last Digit Pattern */}
          <div>
            <label className="block text-sm font-medium mb-2">Last Digit Pattern</label>
            <input
              type="text"
              placeholder="e.g., 123"
              value={filters.lastDigitPattern}
              onChange={(e) => updateFilter('lastDigitPattern', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Consecutive Numbers */}
          <div>
            <label className="block text-sm font-medium mb-2">Consecutive Numbers</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.consecutiveNumbers.min}
                onChange={(e) => updateFilter('consecutiveNumbers', { ...filters.consecutiveNumbers, min: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.consecutiveNumbers.max}
                onChange={(e) => updateFilter('consecutiveNumbers', { ...filters.consecutiveNumbers, max: parseInt(e.target.value) || 5 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Number Spacing */}
          <div>
            <label className="block text-sm font-medium mb-2">Number Spacing</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.numberSpacing.min}
                onChange={(e) => updateFilter('numberSpacing', { ...filters.numberSpacing, min: parseInt(e.target.value) || 1 })}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.numberSpacing.max}
                onChange={(e) => updateFilter('numberSpacing', { ...filters.numberSpacing, max: parseInt(e.target.value) || 69 })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Generation Controls */}
        <div className="mt-6 flex gap-4 items-center">
          <button
            onClick={generateFilteredCombinations}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isGenerating ? 'Generating...' : 'Generate Combinations'}
          </button>

          <div>
            <label className="block text-sm font-medium mb-1">Max Results</label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 1000)}
              className="w-24 p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {combinations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Generated Combinations ({combinations.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Numbers</th>
                  <th className="text-left p-2">Powerball</th>
                  <th className="text-left p-2">Sum</th>
                  <th className="text-left p-2">Even</th>
                  <th className="text-left p-2">Odd</th>
                  <th className="text-left p-2">Hot</th>
                  <th className="text-left p-2">Cold</th>
                  <th className="text-left p-2">Digit Sum</th>
                  <th className="text-left p-2">Last Digits</th>
                  <th className="text-left p-2">Range</th>
                </tr>
              </thead>
              <tbody>
                {combinations.slice(0, 100).map((combo, index) => {
                  const digitSum = combo.white_balls.reduce((sum, num) => {
                    return sum + num.toString().split('').reduce((dSum, digit) => dSum + parseInt(digit), 0);
                  }, 0);
                  const lastDigits = combo.white_balls.map(num => num % 10).join('');

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {combo.white_balls.join(', ')}
                      </td>
                      <td className="p-2">
                        <span className="inline-block w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {combo.powerball}
                        </span>
                      </td>
                      <td className="p-2">{combo.sum}</td>
                      <td className="p-2">{combo.evenCount}</td>
                      <td className="p-2">{combo.oddCount}</td>
                      <td className="p-2">{combo.hotCount}</td>
                      <td className="p-2">{combo.coldCount}</td>
                      <td className="p-2">{digitSum}</td>
                      <td className="p-2">{lastDigits}</td>
                      <td className="p-2">{combo.range}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {combinations.length > 100 && (
            <p className="text-sm text-gray-600 mt-4">
              Showing first 100 results. Total: {combinations.length} combinations found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CombinationGenerator;
