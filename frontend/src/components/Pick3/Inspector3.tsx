import React, { useState, useEffect, useMemo } from 'react';
import { pick3DataManager } from '../../services/Pick3DataManager';
import './Inspector3.css';

interface Inspector3Props {
  className?: string;
}

interface NumberAnalysis {
  digits: number[];
  sum: number;
  rootSum: number;
  parityPattern: string;
  highLowPattern: string;
  boxKey: string;
  pairs: {
    front: string;
    split: string;
    back: string;
  };
  drawDate?: string;
  source?: string;
}

interface DrawData {
  date: string;
  numbers?: number[];
  midday?: string;
  evening?: string;
}

const Inspector3: React.FC<Inspector3Props> = ({ className = '' }) => {
  const [historicalData, setHistoricalData] = useState<DrawData[]>([]);
  const [drawCount, setDrawCount] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<'overview' | 'parity' | 'highlow' | 'pairs' | 'box' | 'draws'>('overview');
  const [loading, setLoading] = useState(false);
  const [customDrawCount, setCustomDrawCount] = useState<string>('60');
  const [inputNumbers, setInputNumbers] = useState<string>('');

  // Load historical data on component mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    setLoading(true);
    try {
      const allDraws = pick3DataManager.getDraws();
      setHistoricalData(allDraws);
      console.log(`Loaded ${allDraws.length} historical draws for Inspector3`);
    } catch (error) {
      console.error('Error loading historical data:', error);
      setHistoricalData([]);
    }
    setLoading(false);
  };

  const handleDrawCountChange = (count: number) => {
    setDrawCount(count);
    setCustomDrawCount(count.toString());
  };

  const handleCustomDrawCountSubmit = () => {
    const count = parseInt(customDrawCount);
    if (!isNaN(count) && count > 0 && count <= historicalData.length) {
      setDrawCount(count);
    }
  };

  // Get the selected number of recent draws
  const selectedDraws = useMemo(() => {
    return historicalData.slice(-drawCount);
  }, [historicalData, drawCount]);

  const analyzedNumbers = useMemo(() => {
    return selectedDraws.map(draw => {
      // Extract digits from draw data
      let digits: number[] = [];
      if (Array.isArray(draw.numbers)) {
        digits = draw.numbers.slice(0, 3);
      } else if (typeof draw.midday === 'string') {
        digits = draw.midday.split('').map(d => parseInt(d)).slice(0, 3);
      } else if (typeof draw.evening === 'string') {
        digits = draw.evening.split('').map(d => parseInt(d)).slice(0, 3);
      }

      if (digits.length !== 3 || digits.some(isNaN)) return null;

      const sum = digits.reduce((a, b) => a + b, 0);
      const rootSum = sum % 9 || 9;
      const parityPattern = digits.map(d => d % 2 === 0 ? 'E' : 'O').join('');
      const highLowPattern = digits.map(d => d >= 5 ? 'H' : 'L').join('');
      const boxKey = [...digits].sort().join('');

      return {
        digits,
        sum,
        rootSum,
        parityPattern,
        highLowPattern,
        boxKey,
        drawDate: draw.date,
        source: Array.isArray(draw.numbers) ? 'numbers' : typeof draw.midday === 'string' ? 'midday' : 'evening',
        pairs: {
          front: digits.slice(0, 2).join(''),
          split: [digits[0], digits[2]].join(''),
          back: digits.slice(1).join('')
        }
      } as NumberAnalysis;
    }).filter(Boolean) as NumberAnalysis[];
  }, [selectedDraws]);

  const statistics = useMemo(() => {
    if (analyzedNumbers.length === 0) return null;

    const parityCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.parityPattern] = (acc[num.parityPattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const highLowCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.highLowPattern] = (acc[num.highLowPattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sumCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.sum] = (acc[num.sum] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const boxCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.boxKey] = (acc[num.boxKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: analyzedNumbers.length,
      parityCounts,
      highLowCounts,
      sumCounts,
      boxCounts,
      avgSum: analyzedNumbers.reduce((sum, num) => sum + num.sum, 0) / analyzedNumbers.length
    };
  }, [analyzedNumbers]);

  const renderOverview = () => (
    <div className="inspector-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Numbers</h3>
          <div className="stat-value">{analyzedNumbers.length}</div>
        </div>

        <div className="stat-card">
          <h3>Average Sum</h3>
          <div className="stat-value">{statistics?.avgSum.toFixed(1) || '0.0'}</div>
        </div>

        <div className="stat-card">
          <h3>Unique Boxes</h3>
          <div className="stat-value">{statistics ? Object.keys(statistics.boxCounts).length : 0}</div>
        </div>

        <div className="stat-card">
          <h3>Sum Range</h3>
          <div className="stat-value">
            {analyzedNumbers.length > 0
              ? `${Math.min(...analyzedNumbers.map(n => n.sum))} - ${Math.max(...analyzedNumbers.map(n => n.sum))}`
              : '0 - 0'
            }
          </div>
        </div>
      </div>

      <div className="numbers-table">
        <h3>Analyzed Numbers</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Sum</th>
                <th>Root Sum</th>
                <th>Parity</th>
                <th>High/Low</th>
                <th>Box</th>
                <th>Pairs (F/S/B)</th>
              </tr>
            </thead>
            <tbody>
              {analyzedNumbers.map((num, index) => (
                <tr key={index}>
                  <td className="number-cell">{num.digits.join('')}</td>
                  <td>{num.sum}</td>
                  <td>{num.rootSum}</td>
                  <td>{num.parityPattern}</td>
                  <td>{num.highLowPattern}</td>
                  <td>{num.boxKey}</td>
                  <td>{`${num.pairs.front}/${num.pairs.split}/${num.pairs.back}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderParityAnalysis = () => (
    <div className="parity-analysis">
      <h3>Parity Pattern Analysis</h3>
      <p>Even (E) / Odd (O) digit patterns</p>

      <div className="pattern-grid">
        {['EEE', 'EEO', 'EOE', 'EOO', 'OEE', 'OEO', 'OOE', 'OOO'].map(pattern => {
          const count = statistics?.parityCounts[pattern] || 0;
          const percentage = statistics ? (count / statistics.total * 100).toFixed(1) : '0.0';

          return (
            <div key={pattern} className="pattern-card">
              <div className="pattern">{pattern}</div>
              <div className="count">{count}</div>
              <div className="percentage">{percentage}%</div>
            </div>
          );
        })}
      </div>

      <div className="parity-examples">
        <h4>Pattern Examples</h4>
        <div className="examples-list">
          {analyzedNumbers
            .filter(num => num.parityPattern === 'EEE')
            .slice(0, 10)
            .map((num, index) => (
              <span key={index} className="example">{num.digits.join('')}</span>
            ))}
        </div>
      </div>
    </div>
  );

  const renderHighLowAnalysis = () => (
    <div className="highlow-analysis">
      <h3>High/Low Pattern Analysis</h3>
      <p>High (5-9) / Low (0-4) digit patterns</p>

      <div className="pattern-grid">
        {['HHH', 'HHL', 'HLH', 'HLL', 'LHH', 'LHL', 'LLH', 'LLL'].map(pattern => {
          const count = statistics?.highLowCounts[pattern] || 0;
          const percentage = statistics ? (count / statistics.total * 100).toFixed(1) : '0.0';

          return (
            <div key={pattern} className="pattern-card">
              <div className="pattern">{pattern}</div>
              <div className="count">{count}</div>
              <div className="percentage">{percentage}%</div>
            </div>
          );
        })}
      </div>

      <div className="highlow-examples">
        <h4>Pattern Examples</h4>
        <div className="examples-list">
          {analyzedNumbers
            .filter(num => num.highLowPattern === 'HHH')
            .slice(0, 10)
            .map((num, index) => (
              <span key={index} className="example">{num.digits.join('')}</span>
            ))}
        </div>
      </div>
    </div>
  );

  const renderPairsAnalysis = () => (
    <div className="pairs-analysis">
      <h3>Pairs Analysis</h3>
      <p>Front, Split, and Back pair patterns</p>

      <div className="pairs-tabs">
        <button
          className={activeTab === 'pairs' ? 'active' : ''}
          onClick={() => setActiveTab('pairs')}
        >
          Front Pairs
        </button>
        <button
          className="split-tab"
          onClick={() => setActiveTab('pairs')}
        >
          Split Pairs
        </button>
        <button
          className="back-tab"
          onClick={() => setActiveTab('pairs')}
        >
          Back Pairs
        </button>
      </div>

      <div className="pairs-grid">
        {analyzedNumbers.slice(0, 20).map((num, index) => (
          <div key={index} className="pairs-row">
            <div className="number">{num.digits.join('')}</div>
            <div className="pairs">
              <span className="front">{num.pairs.front}</span>
              <span className="split">{num.pairs.split}</span>
              <span className="back">{num.pairs.back}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBoxAnalysis = () => (
    <div className="box-analysis">
      <h3>Box Classification</h3>
      <p>Singles (6-way), Doubles (3-way), Triples (1-way)</p>

      <div className="box-stats">
        <div className="box-type-card">
          <h4>Singles (6-way)</h4>
          <div className="count">
            {analyzedNumbers.filter(num => num.boxKey[0] !== num.boxKey[1] &&
                                           num.boxKey[1] !== num.boxKey[2] &&
                                           num.boxKey[0] !== num.boxKey[2]).length}
          </div>
        </div>

        <div className="box-type-card">
          <h4>Doubles (3-way)</h4>
          <div className="count">
            {analyzedNumbers.filter(num => {
              const sorted = num.boxKey.split('');
              return (sorted[0] === sorted[1] && sorted[1] !== sorted[2]) ||
                     (sorted[1] === sorted[2] && sorted[0] !== sorted[1]) ||
                     (sorted[0] === sorted[2] && sorted[0] !== sorted[1]);
            }).length}
          </div>
        </div>

        <div className="box-type-card">
          <h4>Triples (1-way)</h4>
          <div className="count">
            {analyzedNumbers.filter(num => num.boxKey[0] === num.boxKey[1] &&
                                           num.boxKey[1] === num.boxKey[2]).length}
          </div>
        </div>
      </div>

      <div className="box-examples">
        <h4>Box Examples</h4>
        <div className="box-examples-grid">
          {Object.entries(statistics?.boxCounts || {})
            .sort(([,a], [,b]) => b - a)
            .slice(0, 12)
            .map(([box, count]) => (
              <div key={box} className="box-example">
                <div className="box-number">{box}</div>
                <div className="box-count">{count}x</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`inspector3 ${className}`}>
      <div className="inspector-header">
        <h2>🔍 Inspector 3</h2>
        <p>Advanced analysis of Pick 3 number patterns and classifications</p>
      </div>

      <div className="input-section">
        <h3>Enter Pick 3 Numbers</h3>
        <textarea
          value={inputNumbers}
          onChange={(e) => setInputNumbers(e.target.value)}
          placeholder="Enter Pick 3 numbers, one per line (e.g. 123, 456, 789)&#10;Non-numeric characters will be ignored"
          rows={10}
        />
        <div className="input-info">
          <span>Numbers analyzed: {analyzedNumbers.length}</span>
        </div>
      </div>

      <div className="draw-controls">
        <h3>Historical Data Analysis</h3>
        <div className="draw-count-selector">
          <label>Analyze last </label>
          <select
            value={drawCount}
            onChange={(e) => handleDrawCountChange(parseInt(e.target.value))}
          >
            <option value={30}>30 draws</option>
            <option value={60}>60 draws</option>
            <option value={90}>90 draws</option>
            <option value={120}>120 draws</option>
            <option value={historicalData.length}>All draws ({historicalData.length})</option>
          </select>
          <div className="custom-draw-input">
            <input
              type="number"
              value={customDrawCount}
              onChange={(e) => setCustomDrawCount(e.target.value)}
              placeholder="Custom count"
              min="1"
              max={historicalData.length}
            />
            <button onClick={handleCustomDrawCountSubmit}>Set</button>
          </div>
        </div>
        {loading && <div className="loading-indicator">Loading historical data...</div>}
        <div className="data-info">
          <span>Available draws: {historicalData.length}</span>
          <span>Analyzing: {selectedDraws.length} draws</span>
        </div>
      </div>

      {analyzedNumbers.length > 0 && (
        <div className="analysis-section">
          <div className="analysis-tabs">
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={activeTab === 'parity' ? 'active' : ''}
              onClick={() => setActiveTab('parity')}
            >
              Parity Patterns
            </button>
            <button
              className={activeTab === 'highlow' ? 'active' : ''}
              onClick={() => setActiveTab('highlow')}
            >
              High/Low Patterns
            </button>
            <button
              className={activeTab === 'pairs' ? 'active' : ''}
              onClick={() => setActiveTab('pairs')}
            >
              Pairs Analysis
            </button>
            <button
              className={activeTab === 'box' ? 'active' : ''}
              onClick={() => setActiveTab('box')}
            >
              Box Classification
            </button>
          </div>

          <div className="analysis-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'parity' && renderParityAnalysis()}
            {activeTab === 'highlow' && renderHighLowAnalysis()}
            {activeTab === 'pairs' && renderPairsAnalysis()}
            {activeTab === 'box' && renderBoxAnalysis()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspector3;
