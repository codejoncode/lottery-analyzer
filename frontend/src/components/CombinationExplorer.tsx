import React, { useState, useMemo } from 'react';
import { pick3Analyzer } from '../utils/pick3Analyzer';

interface CombinationExplorerProps {
  className?: string;
}

const CombinationExplorer: React.FC<CombinationExplorerProps> = ({ className = '' }) => {
  const [filterType, setFilterType] = useState<'all' | 'single' | 'double' | 'triple'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const combinations = pick3Analyzer.getAllCombinations();
  const singles = pick3Analyzer.getCombinationsByType('single');
  const doubles = pick3Analyzer.getCombinationsByType('double');
  const triples = pick3Analyzer.getCombinationsByType('triple');

  const filteredCombinations = useMemo(() => {
    let combos = combinations;

    switch (filterType) {
      case 'single': combos = singles; break;
      case 'double': combos = doubles; break;
      case 'triple': combos = triples; break;
    }

    if (searchTerm) {
      combos = combos.filter(combo =>
        combo.straight.includes(searchTerm) ||
        combo.box.includes(searchTerm) ||
        combo.sum.toString().includes(searchTerm) ||
        combo.rootSum.toString().includes(searchTerm) ||
        combo.vtrac.includes(searchTerm)
      );
    }

    return combos;
  }, [combinations, singles, doubles, triples, filterType, searchTerm]);

  return (
    <div className={`combination-explorer ${className}`}>
      <div className="explorer-controls">
        <div className="filter-buttons">
          <button
            className={filterType === 'all' ? 'active' : ''}
            onClick={() => setFilterType('all')}
          >
            All ({combinations.length})
          </button>
          <button
            className={filterType === 'single' ? 'active' : ''}
            onClick={() => setFilterType('single')}
          >
            Singles ({singles.length})
          </button>
          <button
            className={filterType === 'double' ? 'active' : ''}
            onClick={() => setFilterType('double')}
          >
            Doubles ({doubles.length})
          </button>
          <button
            className={filterType === 'triple' ? 'active' : ''}
            onClick={() => setFilterType('triple')}
          >
            Triples ({triples.length})
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search combinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="combinations-table">
        <div className="table-header">
          <div>Straight</div>
          <div>Box</div>
          <div>Sum</div>
          <div>Root Sum</div>
          <div>Sum Last Digit</div>
          <div>VTrac</div>
          <div>Mirror</div>
          <div>Type</div>
        </div>

        <div className="table-body">
          {filteredCombinations.slice(0, 100).map((combo, index) => (
            <div key={index} className="table-row">
              <div className="combination-cell">{combo.straight}</div>
              <div className="combination-cell">{combo.box}</div>
              <div className="number-cell">{combo.sum}</div>
              <div className="number-cell">{combo.rootSum}</div>
              <div className="number-cell">{combo.sumLastDigit}</div>
              <div className="combination-cell">{combo.vtrac}</div>
              <div className="combination-cell">{combo.mirror}</div>
              <div className="type-cell">
                {combo.isTriple ? 'Triple' : combo.isDouble ? 'Double' : 'Single'}
              </div>
            </div>
          ))}
        </div>

        {filteredCombinations.length > 100 && (
          <div className="load-more">
            Showing first 100 of {filteredCombinations.length} combinations
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinationExplorer;
