import React, { useState, useMemo } from 'react';
import './PairsAnalysis.css';

interface PairsAnalysisProps {
  className?: string;
}

interface PairData {
  pair: string;
  count: number;
  lastSeen: number;
  skipCount: number;
  isFront: boolean;
  isSplit: boolean;
  isBack: boolean;
}

const PairsAnalysis: React.FC<PairsAnalysisProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'10x10' | '5x9'>('10x10');
  const [inputDraws, setInputDraws] = useState<string>('');
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  // Generate all possible pairs (00-99)
  const allPairs = useMemo(() => {
    const pairs: PairData[] = [];
    for (let i = 0; i <= 9; i++) {
      for (let j = 0; j <= 9; j++) {
        const pair = `${i}${j}`;
        pairs.push({
          pair,
          count: 0,
          lastSeen: -1,
          skipCount: 0,
          isFront: false,
          isSplit: false,
          isBack: false
        });
      }
    }
    return pairs;
  }, []);

  const parsedDraws = useMemo(() => {
    if (!inputDraws.trim()) return [];

    const lines = inputDraws.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      return {
        digits,
        index,
        front: `${digits[0]}${digits[1]}`,
        split: `${digits[0]}${digits[2]}`,
        back: `${digits[1]}${digits[2]}`
      };
    }).filter(Boolean);
  }, [inputDraws]);

  const pairsAnalysis = useMemo(() => {
    const analysis = new Map<string, PairData>();

    // Initialize all pairs
    allPairs.forEach(pairData => {
      analysis.set(pairData.pair, { ...pairData });
    });

    // Analyze draws
    parsedDraws.forEach((draw, drawIndex) => {
      if (!draw) return;

      const pairs = [draw.front, draw.split, draw.back];

      pairs.forEach((pair, pairIndex) => {
        const existing = analysis.get(pair);
        if (existing) {
          existing.count++;
          existing.lastSeen = drawIndex;
          existing.skipCount = 0;

          // Mark position flags
          if (pairIndex === 0) existing.isFront = true;
          else if (pairIndex === 1) existing.isSplit = true;
          else if (pairIndex === 2) existing.isBack = true;
        }
      });
    });

    // Calculate skip counts for pairs not seen recently
    const lastDrawIndex = parsedDraws.length - 1;
    analysis.forEach(pairData => {
      if (pairData.lastSeen >= 0) {
        pairData.skipCount = lastDrawIndex - pairData.lastSeen;
      } else {
        pairData.skipCount = lastDrawIndex + 1;
      }
    });

    return analysis;
  }, [parsedDraws, allPairs]);

  const getSkipColor = (skipCount: number) => {
    if (skipCount === 0) return 'current';
    if (skipCount <= 2) return 'recent';
    if (skipCount <= 5) return 'moderate';
    if (skipCount <= 10) return 'late';
    return 'very-late';
  };

  const getPairStats = (pair: string) => {
    const data = pairsAnalysis.get(pair);
    if (!data) return null;

    const frontCount = parsedDraws.filter(d => d?.front === pair).length;
    const splitCount = parsedDraws.filter(d => d?.split === pair).length;
    const backCount = parsedDraws.filter(d => d?.back === pair).length;

    return {
      ...data,
      frontCount,
      splitCount,
      backCount,
      totalCount: data.count
    };
  };

  const render10x10Grid = () => (
    <div className="pairs-grid grid-10x10">
      <div className="grid-header">
        <div></div>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="header-cell">{i}</div>
        ))}
      </div>

      {Array.from({ length: 10 }, (_, row) => (
        <div key={row} className="grid-row">
          <div className="row-header">{row}</div>
          {Array.from({ length: 10 }, (_, col) => {
            const pair = `${row}${col}`;
            const data = pairsAnalysis.get(pair);
            if (!data) return null;

            const skipClass = getSkipColor(data.skipCount);
            const isSelected = selectedPair === pair;

            return (
              <div
                key={col}
                className={`grid-cell ${skipClass} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPair(isSelected ? null : pair)}
                title={`${pair}: ${data.count} hits, ${data.skipCount} skips`}
              >
                <div className="pair-number">{pair}</div>
                <div className="pair-stats">
                  <div className="hit-count">{data.count}</div>
                  <div className="skip-count">{data.skipCount}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const render5x9Grid = () => (
    <div className="pairs-grid grid-5x9">
      <div className="grid-header">
        <div></div>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="header-cell">{i}</div>
        ))}
      </div>

      {Array.from({ length: 10 }, (_, row) => (
        <div key={row} className="grid-row">
          <div className="row-header">{row}</div>
          {Array.from({ length: 10 }, (_, col) => {
            if (row > col) {
              // Don't show cells where row > col for unique pairs
              return <div key={col} className="grid-cell empty"></div>;
            }

            const pair = `${row}${col}`;
            const data = pairsAnalysis.get(pair);
            if (!data) return null;

            const skipClass = getSkipColor(data.skipCount);
            const isSelected = selectedPair === pair;

            return (
              <div
                key={col}
                className={`grid-cell ${skipClass} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPair(isSelected ? null : pair)}
                title={`${pair}: ${data.count} hits, ${data.skipCount} skips`}
              >
                <div className="pair-number">{pair}</div>
                <div className="pair-stats">
                  <div className="hit-count">{data.count}</div>
                  <div className="skip-count">{data.skipCount}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderPairDetails = () => {
    if (!selectedPair) return null;

    const stats = getPairStats(selectedPair);
    if (!stats) return null;

    const occurrences = parsedDraws
      .map((draw, index) => ({ draw, index }))
      .filter(({ draw }) =>
        draw?.front === selectedPair ||
        draw?.split === selectedPair ||
        draw?.back === selectedPair
      )
      .slice(-10); // Last 10 occurrences

    return (
      <div className="pair-details">
        <h3>Pair {selectedPair} Analysis</h3>

        <div className="pair-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Hits</div>
            <div className="stat-value">{stats.totalCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Current Skip</div>
            <div className="stat-value">{stats.skipCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Front Position</div>
            <div className="stat-value">{stats.frontCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Split Position</div>
            <div className="stat-value">{stats.splitCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Back Position</div>
            <div className="stat-value">{stats.backCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Last Seen</div>
            <div className="stat-value">
              {stats.lastSeen >= 0 ? `Draw ${stats.lastSeen + 1}` : 'Never'}
            </div>
          </div>
        </div>

        <div className="recent-occurrences">
          <h4>Recent Occurrences</h4>
          <div className="occurrences-list">
            {occurrences.map(({ draw, index }) => (
              <div key={index} className="occurrence">
                <span className="draw-number">Draw {index + 1}:</span>
                <span className="combination">{draw?.digits.join('')}</span>
                <span className="position">
                  {draw?.front === selectedPair && <span className="pos-front">(Front)</span>}
                  {draw?.split === selectedPair && <span className="pos-split">(Split)</span>}
                  {draw?.back === selectedPair && <span className="pos-back">(Back)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`pairs-analysis ${className}`}>
      <div className="pairs-header">
        <h2>🔢 Pairs Analysis</h2>
        <p>Comprehensive pair tracking for Pick 3 combinations</p>
      </div>

      <div className="input-section">
        <h3>Historical Draws</h3>
        <textarea
          value={inputDraws}
          onChange={(e) => setInputDraws(e.target.value)}
          placeholder="Enter historical Pick 3 draws, one per line (e.g. 123, 456, 789)&#10;Non-numeric characters will be ignored"
          rows={6}
        />
        <div className="input-info">
          <span>Draws analyzed: {parsedDraws.length}</span>
        </div>
      </div>

      <div className="analysis-section">
        <div className="tabs-section">
          <div className="tab-buttons">
            <button
              className={activeTab === '10x10' ? 'active' : ''}
              onClick={() => setActiveTab('10x10')}
            >
              10×10 Full Pairs
            </button>
            <button
              className={activeTab === '5x9' ? 'active' : ''}
              onClick={() => setActiveTab('5x9')}
            >
              5×9 Unique Pairs
            </button>
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="color-box current"></div>
              <span>Current (0 skips)</span>
            </div>
            <div className="legend-item">
              <div className="color-box recent"></div>
              <span>Recent (1-2 skips)</span>
            </div>
            <div className="legend-item">
              <div className="color-box moderate"></div>
              <span>Moderate (3-5 skips)</span>
            </div>
            <div className="legend-item">
              <div className="color-box late"></div>
              <span>Late (6-10 skips)</span>
            </div>
            <div className="legend-item">
              <div className="color-box very-late"></div>
              <span>Very Late (11+ skips)</span>
            </div>
          </div>
        </div>

        <div className="grid-section">
          {activeTab === '10x10' && render10x10Grid()}
          {activeTab === '5x9' && render5x9Grid()}
        </div>

        {renderPairDetails()}
      </div>
    </div>
  );
};

export default PairsAnalysis;
