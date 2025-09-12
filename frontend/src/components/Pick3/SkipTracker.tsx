import React, { useState, useMemo } from 'react';
import './SkipTracker.css';

interface SkipTrackerProps {
  className?: string;
}

interface SkipInfo {
  value: string | number;
  lastSeen: number;
  currentSkip: number;
  totalHits: number;
  expectedHits: number;
  skipTier: 'current' | 'recent' | 'moderate' | 'late' | 'very-late';
  efficiency: number;
}

interface Draw {
  digits: [number, number, number];
  dateIndex: number;
}

const SkipTracker: React.FC<SkipTrackerProps> = ({ className = '' }) => {
  const [inputDraws, setInputDraws] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'digits' | 'pairs' | 'boxes' | 'combinations'>('digits');

  // Parse historical draws
  const parsedDraws = useMemo(() => {
    if (!inputDraws.trim()) return [];

    const lines = inputDraws.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      return {
        digits: digits as [number, number, number],
        dateIndex: index
      } as Draw;
    }).filter(Boolean) as Draw[];
  }, [inputDraws]);

  // Calculate digit skips
  const digitSkips = useMemo(() => {
    const skips = new Map<number, SkipInfo>();

    // Initialize all digits 0-9
    for (let i = 0; i <= 9; i++) {
      skips.set(i, {
        value: i,
        lastSeen: -1,
        currentSkip: 0,
        totalHits: 0,
        expectedHits: 0,
        skipTier: 'current',
        efficiency: 0
      });
    }

    // Analyze draws
    parsedDraws.forEach((draw, drawIndex) => {
      draw.digits.forEach(digit => {
        const info = skips.get(digit)!;
        info.totalHits++;
        info.lastSeen = drawIndex;
        info.currentSkip = 0;
      });

      // Update skip counts for digits not in this draw
      skips.forEach((info, digit) => {
        if (!draw.digits.includes(digit)) {
          info.currentSkip++;
        } else {
          info.currentSkip = 0;
        }
      });
    });

    // Calculate final skip counts and tiers
    const totalDraws = parsedDraws.length;
    skips.forEach(info => {
      if (info.lastSeen >= 0) {
        info.currentSkip = totalDraws - 1 - info.lastSeen;
      } else {
        info.currentSkip = totalDraws;
      }

      info.expectedHits = (info.totalHits / totalDraws) * totalDraws;
      info.efficiency = info.expectedHits > 0 ? (info.totalHits / info.expectedHits) - 1 : 0;

      // Determine skip tier
      if (info.currentSkip === 0) info.skipTier = 'current';
      else if (info.currentSkip <= 2) info.skipTier = 'recent';
      else if (info.currentSkip <= 5) info.skipTier = 'moderate';
      else if (info.currentSkip <= 10) info.skipTier = 'late';
      else info.skipTier = 'very-late';
    });

    return skips;
  }, [parsedDraws]);

  // Calculate pair skips
  const pairSkips = useMemo(() => {
    const skips = new Map<string, SkipInfo>();

    // Initialize all possible pairs (00-99)
    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j <= 9; j++) {
        const pair = `${i}${j}`;
        skips.set(pair, {
          value: pair,
          lastSeen: -1,
          currentSkip: 0,
          totalHits: 0,
          expectedHits: 0,
          skipTier: 'current',
          efficiency: 0
        });
      }
    }

    // Analyze draws for pairs
    parsedDraws.forEach((draw, drawIndex) => {
      const frontPair = `${draw.digits[0]}${draw.digits[1]}`;
      const splitPair = `${draw.digits[0]}${draw.digits[2]}`;
      const backPair = `${draw.digits[1]}${draw.digits[2]}`;

      [frontPair, splitPair, backPair].forEach(pair => {
        const info = skips.get(pair)!;
        info.totalHits++;
        info.lastSeen = drawIndex;
      });
    });

    // Calculate final skip counts
    const totalDraws = parsedDraws.length;
    skips.forEach(info => {
      if (info.lastSeen >= 0) {
        info.currentSkip = totalDraws - 1 - info.lastSeen;
      } else {
        info.currentSkip = totalDraws;
      }

      info.expectedHits = (info.totalHits / Math.max(totalDraws, 1)) * totalDraws;
      info.efficiency = info.expectedHits > 0 ? (info.totalHits / info.expectedHits) - 1 : 0;

      if (info.currentSkip === 0) info.skipTier = 'current';
      else if (info.currentSkip <= 2) info.skipTier = 'recent';
      else if (info.currentSkip <= 5) info.skipTier = 'moderate';
      else if (info.currentSkip <= 10) info.skipTier = 'late';
      else info.skipTier = 'very-late';
    });

    return skips;
  }, [parsedDraws]);

  // Calculate box combination skips
  const boxSkips = useMemo(() => {
    const skips = new Map<string, SkipInfo>();

    parsedDraws.forEach((draw, drawIndex) => {
      const box = [...draw.digits].sort().join('');
      if (!skips.has(box)) {
        skips.set(box, {
          value: box,
          lastSeen: drawIndex,
          currentSkip: 0,
          totalHits: 1,
          expectedHits: 0,
          skipTier: 'current',
          efficiency: 0
        });
      } else {
        const info = skips.get(box)!;
        info.totalHits++;
        info.lastSeen = drawIndex;
      }
    });

    // Calculate final skip counts
    const totalDraws = parsedDraws.length;
    const uniqueBoxes = skips.size;
    const expectedHitsPerBox = totalDraws / uniqueBoxes;

    skips.forEach(info => {
      if (info.lastSeen >= 0) {
        info.currentSkip = totalDraws - 1 - info.lastSeen;
      } else {
        info.currentSkip = totalDraws;
      }

      info.expectedHits = expectedHitsPerBox;
      info.efficiency = (info.totalHits / expectedHitsPerBox) - 1;

      if (info.currentSkip === 0) info.skipTier = 'current';
      else if (info.currentSkip <= 2) info.skipTier = 'recent';
      else if (info.currentSkip <= 5) info.skipTier = 'moderate';
      else if (info.currentSkip <= 10) info.skipTier = 'late';
      else info.skipTier = 'very-late';
    });

    return skips;
  }, [parsedDraws]);

  // Calculate straight combination skips
  const combinationSkips = useMemo(() => {
    const skips = new Map<string, SkipInfo>();

    parsedDraws.forEach((draw, drawIndex) => {
      const straight = draw.digits.join('');
      if (!skips.has(straight)) {
        skips.set(straight, {
          value: straight,
          lastSeen: drawIndex,
          currentSkip: 0,
          totalHits: 1,
          expectedHits: 0,
          skipTier: 'current',
          efficiency: 0
        });
      } else {
        const info = skips.get(straight)!;
        info.totalHits++;
        info.lastSeen = drawIndex;
      }
    });

    // Calculate final skip counts
    const totalDraws = parsedDraws.length;
    const uniqueCombos = skips.size;
    const expectedHitsPerCombo = totalDraws / uniqueCombos;

    skips.forEach(info => {
      if (info.lastSeen >= 0) {
        info.currentSkip = totalDraws - 1 - info.lastSeen;
      } else {
        info.currentSkip = totalDraws;
      }

      info.expectedHits = expectedHitsPerCombo;
      info.efficiency = (info.totalHits / expectedHitsPerCombo) - 1;

      if (info.currentSkip === 0) info.skipTier = 'current';
      else if (info.currentSkip <= 2) info.skipTier = 'recent';
      else if (info.currentSkip <= 5) info.skipTier = 'moderate';
      else if (info.currentSkip <= 10) info.skipTier = 'late';
      else info.skipTier = 'very-late';
    });

    return skips;
  }, [parsedDraws]);

  const getSkipColor = (tier: string) => {
    switch (tier) {
      case 'current': return '#10b981';
      case 'recent': return '#34d399';
      case 'moderate': return '#fbbf24';
      case 'late': return '#f97316';
      case 'very-late': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderDigitSkips = () => {
    const sortedDigits = Array.from(digitSkips.values())
      .sort((a, b) => b.currentSkip - a.currentSkip);

    return (
      <div className="skip-grid">
        {sortedDigits.map(digit => (
          <div
            key={digit.value}
            className={`skip-card ${digit.skipTier}`}
            style={{ borderColor: getSkipColor(digit.skipTier) }}
          >
            <div className="skip-value">{digit.value}</div>
            <div className="skip-metrics">
              <div className="metric">
                <span className="label">Skip:</span>
                <span className="value">{digit.currentSkip}</span>
              </div>
              <div className="metric">
                <span className="label">Hits:</span>
                <span className="value">{digit.totalHits}</span>
              </div>
              <div className="metric">
                <span className="label">Last:</span>
                <span className="value">
                  {digit.lastSeen >= 0 ? `Draw ${digit.lastSeen + 1}` : 'Never'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPairSkips = () => {
    const sortedPairs = Array.from(pairSkips.values())
      .sort((a, b) => b.currentSkip - a.currentSkip)
      .slice(0, 50); // Show top 50 overdue pairs

    return (
      <div className="skip-grid">
        {sortedPairs.map(pair => (
          <div
            key={pair.value}
            className={`skip-card ${pair.skipTier}`}
            style={{ borderColor: getSkipColor(pair.skipTier) }}
          >
            <div className="skip-value">{pair.value}</div>
            <div className="skip-metrics">
              <div className="metric">
                <span className="label">Skip:</span>
                <span className="value">{pair.currentSkip}</span>
              </div>
              <div className="metric">
                <span className="label">Hits:</span>
                <span className="value">{pair.totalHits}</span>
              </div>
              <div className="metric">
                <span className="label">Last:</span>
                <span className="value">
                  {pair.lastSeen >= 0 ? `Draw ${pair.lastSeen + 1}` : 'Never'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBoxSkips = () => {
    const sortedBoxes = Array.from(boxSkips.values())
      .sort((a, b) => b.currentSkip - a.currentSkip);

    return (
      <div className="skip-grid">
        {sortedBoxes.map(box => (
          <div
            key={box.value}
            className={`skip-card ${box.skipTier}`}
            style={{ borderColor: getSkipColor(box.skipTier) }}
          >
            <div className="skip-value">{box.value}</div>
            <div className="skip-metrics">
              <div className="metric">
                <span className="label">Skip:</span>
                <span className="value">{box.currentSkip}</span>
              </div>
              <div className="metric">
                <span className="label">Hits:</span>
                <span className="value">{box.totalHits}</span>
              </div>
              <div className="metric">
                <span className="label">Last:</span>
                <span className="value">
                  {box.lastSeen >= 0 ? `Draw ${box.lastSeen + 1}` : 'Never'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCombinationSkips = () => {
    const sortedCombos = Array.from(combinationSkips.values())
      .sort((a, b) => b.currentSkip - a.currentSkip)
      .slice(0, 30); // Show top 30 overdue combinations

    return (
      <div className="skip-grid">
        {sortedCombos.map(combo => (
          <div
            key={combo.value}
            className={`skip-card ${combo.skipTier}`}
            style={{ borderColor: getSkipColor(combo.skipTier) }}
          >
            <div className="skip-value">{combo.value}</div>
            <div className="skip-metrics">
              <div className="metric">
                <span className="label">Skip:</span>
                <span className="value">{combo.currentSkip}</span>
              </div>
              <div className="metric">
                <span className="label">Hits:</span>
                <span className="value">{combo.totalHits}</span>
              </div>
              <div className="metric">
                <span className="label">Last:</span>
                <span className="value">
                  {combo.lastSeen >= 0 ? `Draw ${combo.lastSeen + 1}` : 'Never'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getSummaryStats = () => {
    if (parsedDraws.length === 0) return null;

    let currentData, totalItems, avgSkip, maxSkip;

    switch (activeTab) {
      case 'digits':
        currentData = Array.from(digitSkips.values());
        totalItems = 10;
        break;
      case 'pairs':
        currentData = Array.from(pairSkips.values());
        totalItems = 100;
        break;
      case 'boxes':
        currentData = Array.from(boxSkips.values());
        totalItems = boxSkips.size;
        break;
      case 'combinations':
        currentData = Array.from(combinationSkips.values());
        totalItems = combinationSkips.size;
        break;
      default:
        return null;
    }

    const skips = currentData.map(d => d.currentSkip);
    avgSkip = skips.reduce((a, b) => a + b, 0) / skips.length;
    maxSkip = Math.max(...skips);

    const tierCounts = currentData.reduce((acc, item) => {
      acc[item.skipTier] = (acc[item.skipTier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      avgSkip: avgSkip.toFixed(1),
      maxSkip,
      tierCounts
    };
  };

  const summaryStats = getSummaryStats();

  return (
    <div className={`skip-tracker ${className}`}>
      <div className="tracker-header">
        <h2>⏰ Skip Tracking System</h2>
        <p>Comprehensive lateness detection for digits, pairs, and combinations</p>
      </div>

      <div className="input-section">
        <h3>Historical Draws</h3>
        <textarea
          value={inputDraws}
          onChange={(e) => setInputDraws(e.target.value)}
          placeholder="Enter historical Pick 3 draws, one per line (e.g. 123, 456, 789)&#10;The system will track skip patterns for all elements"
          rows={8}
        />
        <div className="input-info">
          <span>Draws analyzed: {parsedDraws.length}</span>
        </div>
      </div>

      {parsedDraws.length > 0 && (
        <div className="analysis-section">
          <div className="tab-selector">
            <div className="tab-buttons">
              <button
                className={activeTab === 'digits' ? 'active' : ''}
                onClick={() => setActiveTab('digits')}
              >
                Digits (0-9)
              </button>
              <button
                className={activeTab === 'pairs' ? 'active' : ''}
                onClick={() => setActiveTab('pairs')}
              >
                Pairs (00-99)
              </button>
              <button
                className={activeTab === 'boxes' ? 'active' : ''}
                onClick={() => setActiveTab('boxes')}
              >
                Box Combinations
              </button>
              <button
                className={activeTab === 'combinations' ? 'active' : ''}
                onClick={() => setActiveTab('combinations')}
              >
                Straight Combinations
              </button>
            </div>

            {summaryStats && (
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="label">Total Items:</span>
                  <span className="value">{summaryStats.totalItems}</span>
                </div>
                <div className="stat-item">
                  <span className="label">Avg Skip:</span>
                  <span className="value">{summaryStats.avgSkip}</span>
                </div>
                <div className="stat-item">
                  <span className="label">Max Skip:</span>
                  <span className="value">{summaryStats.maxSkip}</span>
                </div>
              </div>
            )}
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="color-box" style={{ backgroundColor: '#10b981' }}></div>
              <span>Current (0 skips)</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{ backgroundColor: '#34d399' }}></div>
              <span>Recent (1-2 skips)</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{ backgroundColor: '#fbbf24' }}></div>
              <span>Moderate (3-5 skips)</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{ backgroundColor: '#f97316' }}></div>
              <span>Late (6-10 skips)</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{ backgroundColor: '#ef4444' }}></div>
              <span>Very Late (11+ skips)</span>
            </div>
          </div>

          <div className="skip-content">
            {activeTab === 'digits' && renderDigitSkips()}
            {activeTab === 'pairs' && renderPairSkips()}
            {activeTab === 'boxes' && renderBoxSkips()}
            {activeTab === 'combinations' && renderCombinationSkips()}
          </div>
        </div>
      )}

      {parsedDraws.length === 0 && (
        <div className="getting-started">
          <h3>🚀 Start Tracking Skips</h3>
          <p>Enter your historical Pick 3 draws above to see comprehensive skip analysis for:</p>
          <ul>
            <li><strong>Digits:</strong> Individual number absence tracking</li>
            <li><strong>Pairs:</strong> Front/split/back pair lateness detection</li>
            <li><strong>Boxes:</strong> Unique combination skip patterns</li>
            <li><strong>Straights:</strong> Exact combination absence tracking</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SkipTracker;
