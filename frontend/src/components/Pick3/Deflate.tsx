import React, { useState, useMemo } from 'react';
import './Deflate.css';

interface DeflateProps {
  className?: string;
}

interface Combination {
  straight: string;
  box: string;
  sum: number;
  rootSum: number;
  parityPattern: string;
  highLowPattern: string;
}

const Deflate: React.FC<DeflateProps> = ({ className = '' }) => {
  const [inputCombinations, setInputCombinations] = useState<string>('');
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'single' | 'double' | 'triple',
    sumMin: 0,
    sumMax: 27,
    rootSum: [] as number[],
    parityPattern: [] as string[],
    highLowPattern: [] as string[],
    vtracFamily: [] as string[]
  });

  const parsedCombinations = useMemo(() => {
    if (!inputCombinations.trim()) return [];

    const lines = inputCombinations.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      const sum = digits.reduce((a, b) => a + b, 0);
      const rootSum = sum % 9 || 9;
      const parityPattern = digits.map(d => d % 2 === 0 ? 'E' : 'O').join('');
      const highLowPattern = digits.map(d => d >= 5 ? 'H' : 'L').join('');
      const box = [...digits].sort().join('');

      return {
        straight: digits.join(''),
        box,
        sum,
        rootSum,
        parityPattern,
        highLowPattern
      } as Combination;
    }).filter(Boolean) as Combination[];
  }, [inputCombinations]);

  const uniqueBoxCombinations = useMemo(() => {
    const boxMap = new Map<string, Combination>();

    parsedCombinations.forEach(combo => {
      if (!boxMap.has(combo.box)) {
        boxMap.set(combo.box, combo);
      }
    });

    return Array.from(boxMap.values());
  }, [parsedCombinations]);

  const filteredCombinations = useMemo(() => {
    let combos = uniqueBoxCombinations;

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
  }, [uniqueBoxCombinations, filters]);

  const statistics = useMemo(() => {
    return {
      original: parsedCombinations.length,
      uniqueBoxes: uniqueBoxCombinations.length,
      filtered: filteredCombinations.length,
      reductionPercent: uniqueBoxCombinations.length > 0
        ? ((uniqueBoxCombinations.length - filteredCombinations.length) / uniqueBoxCombinations.length * 100).toFixed(1)
        : '0.0'
    };
  }, [parsedCombinations, uniqueBoxCombinations, filteredCombinations]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as any[]).includes(value)
        ? (prev[key] as any[]).filter(item => item !== value)
        : [...(prev[key] as any[]), value]
    }));
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

  const exportResults = () => {
    const data = filteredCombinations.map(combo => combo.straight).join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deflated-combinations.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`deflate ${className}`}>
      <div className="deflate-header">
        <h2>🗜️ Deflate Module</h2>
        <p>Compress and filter Pick 3 combinations to actionable sets</p>
      </div>

      <div className="deflate-content">
        <div className="input-section">
          <h3>Input Combinations</h3>
          <textarea
            value={inputCombinations}
            onChange={(e) => setInputCombinations(e.target.value)}
            placeholder="Enter Pick 3 combinations, one per line (e.g. 123, 456, 789)&#10;Non-numeric characters will be ignored"
            rows={8}
          />
          <div className="input-stats">
            <span>Parsed: {statistics.original}</span>
            <span>Unique Boxes: {statistics.uniqueBoxes}</span>
          </div>
        </div>

        <div className="filters-section">
          <h3>Filters</h3>

          <div className="filter-group">
            <label>Type:</label>
            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="single">Singles (6-way)</option>
              <option value="double">Doubles (3-way)</option>
              <option value="triple">Triples (1-way)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sum Range:</label>
            <div className="range-inputs">
              <input
                type="number"
                min="0"
                max="27"
                value={filters.sumMin}
                onChange={(e) => updateFilter('sumMin', parseInt(e.target.value) || 0)}
              />
              <span>to</span>
              <input
                type="number"
                min="0"
                max="27"
                value={filters.sumMax}
                onChange={(e) => updateFilter('sumMax', parseInt(e.target.value) || 27)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Root Sum:</label>
            <div className="checkbox-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <label key={num} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.rootSum.includes(num)}
                    onChange={() => toggleArrayFilter('rootSum', num)}
                  />
                  {num}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Parity Patterns:</label>
            <div className="checkbox-grid">
              {['EEE', 'EEO', 'EOE', 'EOO', 'OEE', 'OEO', 'OOE', 'OOO'].map(pattern => (
                <label key={pattern} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.parityPattern.includes(pattern)}
                    onChange={() => toggleArrayFilter('parityPattern', pattern)}
                  />
                  {pattern}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>High/Low Patterns:</label>
            <div className="checkbox-grid">
              {['HHH', 'HHL', 'HLH', 'HLL', 'LHH', 'LHL', 'LLH', 'LLL'].map(pattern => (
                <label key={pattern} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.highLowPattern.includes(pattern)}
                    onChange={() => toggleArrayFilter('highLowPattern', pattern)}
                  />
                  {pattern}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="clear-btn">
              Clear All Filters
            </button>
          </div>
        </div>

        <div className="results-section">
          <div className="results-header">
            <h3>Filtered Results</h3>
            <div className="results-stats">
              <span>Filtered: {statistics.filtered}</span>
              <span>Reduction: {statistics.reductionPercent}%</span>
              <button onClick={exportResults} className="export-btn" disabled={filteredCombinations.length === 0}>
                Export Results
              </button>
            </div>
          </div>

          <div className="combinations-grid">
            {filteredCombinations.slice(0, 100).map((combo, index) => (
              <div key={index} className="combination-card">
                <div className="straight">{combo.straight}</div>
                <div className="box">Box: {combo.box}</div>
                <div className="properties">
                  <span>Sum: {combo.sum}</span>
                  <span>Root: {combo.rootSum}</span>
                  <span>{combo.parityPattern}</span>
                  <span>{combo.highLowPattern}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredCombinations.length > 100 && (
            <div className="load-more">
              Showing first 100 of {filteredCombinations.length} combinations
            </div>
          )}

          {filteredCombinations.length === 0 && uniqueBoxCombinations.length > 0 && (
            <div className="no-results">
              No combinations match the current filters. Try adjusting your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deflate;
