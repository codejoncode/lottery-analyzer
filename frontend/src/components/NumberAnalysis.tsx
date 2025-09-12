import React, { useState, useEffect } from 'react';
import { Link } from "react-router";

interface Draw {
  date: string;
  white_balls: number[];
  red_ball: number;
  power_play: string;
}

interface CategoryGroup {
  name: string;
  numbers: number[];
  expectedHits: number; // based on 14 draws and group size
}

const NumberAnalysis: React.FC = () => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define all the category groups organized by sections
  const categorySections = [
    {
      title: "Last Digit Ending Same",
      description: "Numbers grouped by their last digit",
      groups: [
        { name: "Last Digit 0", numbers: [10, 20, 30, 40, 50, 60, 70], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 1", numbers: [1, 11, 21, 31, 41, 51, 61], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 2", numbers: [2, 12, 22, 32, 42, 52, 62], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 3", numbers: [3, 13, 23, 33, 43, 53, 63], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 4", numbers: [4, 14, 24, 34, 44, 54, 64], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 5", numbers: [5, 15, 25, 35, 45, 55, 65], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 6", numbers: [6, 16, 26, 36, 46, 56, 66], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 7", numbers: [7, 17, 27, 37, 47, 57, 67], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 8", numbers: [8, 18, 28, 38, 48, 58, 68], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Last Digit 9", numbers: [9, 19, 29, 39, 49, 59, 69], expectedHits: Math.round((7/69) * 14 * 5) },
      ]
    },
    {
      title: "First Digit Beginning Same",
      description: "Numbers grouped by their first digit",
      groups: [
        { name: "First Digit 1", numbers: [10,11,12,13,14,15,16,17,18,19], expectedHits: Math.round((10/69) * 14 * 5) },
        { name: "First Digit 2", numbers: [20,21,22,23,24,25,26,27,28,29], expectedHits: Math.round((10/69) * 14 * 5) },
        { name: "First Digit 0", numbers: [1,2,3,4,5,6,7,8,9], expectedHits: Math.round((9/69) * 14 * 5) },
        { name: "First Digit 3", numbers: [30,31,32,33,34,35,36,37,38,39], expectedHits: Math.round((10/69) * 14 * 5) },
        { name: "First Digit 4", numbers: [40,41,42,43,44,45,46,47,48,49], expectedHits: Math.round((10/69) * 14 * 5) },
        { name: "First Digit 5", numbers: [50,51,52,53,54,55,56,57,58,59], expectedHits: Math.round((10/69) * 14 * 5) },
        { name: "First Digit 6", numbers: [60,61,62,63,64,65,66,67,68,69], expectedHits: Math.round((10/69) * 14 * 5) },
      ]
    },
    {
      title: "Sum of Digits",
      description: "Numbers grouped by sum of their digits",
      groups: [
        { name: "Sum 1", numbers: [1,10], expectedHits: Math.round((2/69) * 14 * 5) },
        { name: "Sum 2", numbers: [2,11,20], expectedHits: Math.round((3/69) * 14 * 5) },
        { name: "Sum 3", numbers: [3,12,21,30], expectedHits: Math.round((4/69) * 14 * 5) },
        { name: "Sum 4", numbers: [4,13,22,31,40], expectedHits: Math.round((5/69) * 14 * 5) },
        { name: "Sum 5", numbers: [5,14,23,32,41,50], expectedHits: Math.round((6/69) * 14 * 5) },
        { name: "Sum 6", numbers: [6,15,24,33,42,51,60], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Sum 7", numbers: [7,16,25,34,43,52,61], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Sum 8", numbers: [8,17,26,35,44,53,62], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Sum 9", numbers: [9,18,27,36,45,54,63], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Sum 10", numbers: [19,28,37,46,55,64], expectedHits: Math.round((6/69) * 14 * 5) },
        { name: "Sum 11", numbers: [29,38,47,56,65], expectedHits: Math.round((5/69) * 14 * 5) },
        { name: "Sum 12", numbers: [39,48,57,66], expectedHits: Math.round((4/69) * 14 * 5) },
        { name: "Sum 13", numbers: [49,58,67], expectedHits: Math.round((3/69) * 14 * 5) },
        { name: "Sum 14", numbers: [59,68], expectedHits: Math.round((2/69) * 14 * 5) },
        { name: "Sum 15", numbers: [69], expectedHits: Math.round((1/69) * 14 * 5) },
      ]
    },
    {
      title: "Sum Multiples",
      description: "Numbers that are multiples of specific values",
      groups: [
        { name: "Sum ×3", numbers: [3,6,9,12,15,18,21,24,27,30,33,36,39,42,45,48,51,54,57,60,63,66,69], expectedHits: Math.round((23/69) * 14 * 5) },
        { name: "Sum ×4", numbers: [4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68], expectedHits: Math.round((17/69) * 14 * 5) },
        { name: "Sum ×5", numbers: [5,10,15,20,25,30,35,40,45,50], expectedHits: Math.round((10/69) * 14 * 5) },
        { name: "Sum ×6", numbers: [6,12,18,24,30,36,42,48], expectedHits: Math.round((8/69) * 14 * 5) },
        { name: "Sum ×7", numbers: [7,14,21,28,35,42], expectedHits: Math.round((6/69) * 14 * 5) },
        { name: "Sum ×8", numbers: [8,16,24,32,40,48], expectedHits: Math.round((6/69) * 14 * 5) },
        { name: "Sum ×9", numbers: [9,18,27,36,45,54,63], expectedHits: Math.round((7/69) * 14 * 5) },
        { name: "Sum ×10", numbers: [10,20,30,40,50,60], expectedHits: Math.round((6/69) * 14 * 5) },
        { name: "Sum ×11", numbers: [11,22,33,44,55,66], expectedHits: Math.round((6/69) * 14 * 5) },
        { name: "Sum ×12", numbers: [12,24,36,48,60], expectedHits: Math.round((5/69) * 14 * 5) },
        { name: "Sum ×13", numbers: [13,26,39,52,65], expectedHits: Math.round((5/69) * 14 * 5) },
        { name: "Sum ×14", numbers: [14,28,42,56], expectedHits: Math.round((4/69) * 14 * 5) },
        { name: "Sum ×15", numbers: [15,30,45,60], expectedHits: Math.round((4/69) * 14 * 5) },
        { name: "Sum ×16", numbers: [16,32,48], expectedHits: Math.round((3/69) * 14 * 5) },
        { name: "Sum ×17", numbers: [17,34,51], expectedHits: Math.round((3/69) * 14 * 5) },
        { name: "Sum ×18", numbers: [18,36,54], expectedHits: Math.round((3/69) * 14 * 5) },
        { name: "Sum ×19", numbers: [19,38,57], expectedHits: Math.round((3/69) * 14 * 5) },
        { name: "Sum ×20", numbers: [20,40,60], expectedHits: Math.round((3/69) * 14 * 5) },
      ]
    }
  ];

  useEffect(() => {
    const fetchDraws = async () => {
      try {
        const response = await fetch('/powerball.txt');
        const csvText = await response.text();
        const parsedDraws = parseCSV(csvText);
        setDraws(parsedDraws);
      } catch (err) {
        setError('Error loading draws');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDraws();
  }, []);

  const parseCSV = (csvText: string): Draw[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const draws: Draw[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const draw: any = {};
      headers.forEach((header, index) => {
        if (header === 'white_balls') {
          draw[header] = values[index].split('|').map(Number);
        } else if (header === 'red_ball') {
          draw[header] = Number(values[index]);
        } else {
          draw[header] = values[index];
        }
      });
      draws.push(draw);
    }

    // Sort from latest to oldest
    draws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return draws;
  };

  const getHitsInLast14Draws = (group: { name: string; numbers: number[]; expectedHits: number }, draws: Draw[]): number => {
    let hits = 0;
    const last14Draws = draws.slice(0, 14);

    last14Draws.forEach(draw => {
      draw.white_balls.forEach(ball => {
        if (group.numbers.includes(ball)) {
          hits++;
        }
      });
    });

    return hits;
  };

  const getStatus = (actual: number, expected: number): { status: string; color: string } => {
    if (actual < expected) return { status: 'Cold/Due', color: 'text-blue-600' };
    if (actual === expected) return { status: 'Even/Due', color: 'text-yellow-600' };
    return { status: 'Hot/Over', color: 'text-red-600' };
  };

  const getDrawCategories = (draw: Draw): string[] => {
    const categories: string[] = [];

    categorySections.forEach(section => {
      section.groups.forEach(group => {
        const hasWhiteBall = draw.white_balls.some(ball => group.numbers.includes(ball));
        if (hasWhiteBall) {
          categories.push(group.name);
        }
      });
    });

    return categories;
  };

  const getSectionStats = (section: typeof categorySections[0]) => {
    let coldCount = 0;
    let evenCount = 0;
    let hotCount = 0;

    section.groups.forEach(group => {
      const actualHits = getHitsInLast14Draws(group, draws);
      const status = getStatus(actualHits, group.expectedHits);
      if (status.status === 'Cold/Due') coldCount++;
      else if (status.status === 'Even/Due') evenCount++;
      else if (status.status === 'Hot/Over') hotCount++;
    });

    return { coldCount, evenCount, hotCount };
  };

  const getSectionHitAnalysis = (section: typeof categorySections[0]) => {
    let coldHits = 0;
    let evenHits = 0;
    let hotHits = 0;
    const last14Draws = draws.slice(0, 14);

    last14Draws.forEach(draw => {
      draw.white_balls.forEach(ball => {
        section.groups.forEach(group => {
          if (group.numbers.includes(ball)) {
            const actualHits = getHitsInLast14Draws(group, draws);
            const status = getStatus(actualHits, group.expectedHits);
            if (status.status === 'Cold/Due') coldHits++;
            else if (status.status === 'Even/Due') evenHits++;
            else if (status.status === 'Hot/Over') hotHits++;
          }
        });
      });
    });

    return { coldHits, evenHits, hotHits };
  };

  const getGamesSinceLastDrawnForNumber = (number: number, group: { name: string; numbers: number[]; expectedHits: number }, draws: Draw[]): number => {
    // Find when this GROUP last had a hit (any number from the group)
    for (let i = 0; i < draws.length; i++) {
      const draw = draws[i];
      // Check if any number from this group appears in this draw
      const groupHit = draw.white_balls.some(ball => group.numbers.includes(ball));
      if (groupHit) {
        return i; // Return how many draws ago this group last hit
      }
    }
    return draws.length; // Group has never hit
  };

  const getPatternAnalysis = (section: typeof categorySections[0]) => {
    const patterns = [
      { cold: 5, hot: 0, label: '5-0' },
      { cold: 4, hot: 1, label: '4-1' },
      { cold: 3, hot: 2, label: '3-2' },
      { cold: 2, hot: 3, label: '2-3' },
      { cold: 1, hot: 4, label: '1-4' },
      { cold: 0, hot: 5, label: '0-5' }
    ];

    // Analyze only recent draws (last 200) to get meaningful pattern frequencies
    const recentDraws = draws.slice(0, 200);

    return patterns.map(pattern => {
      let lifetimeOccurrences = 0;
      let lastOccurrenceIndex = -1;

      // Analyze each recent draw
      for (let i = 0; i < recentDraws.length; i++) {
        const draw = recentDraws[i];
        let coldHits = 0;
        let hotHits = 0;

        // Count how many balls from this draw came from cold/due vs hot/over groups
        draw.white_balls.forEach(ball => {
          section.groups.forEach(group => {
            if (group.numbers.includes(ball)) {
              // Check current status of this group (based on most recent 14 draws)
              const actualHits = getHitsInLast14Draws(group, draws);
              const status = getStatus(actualHits, group.expectedHits);
              if (status.status === 'Cold/Due') coldHits++;
              else if (status.status === 'Hot/Over') hotHits++;
            }
          });
        });

        // Check if this draw matches the pattern
        if (coldHits === pattern.cold && hotHits === pattern.hot) {
          lifetimeOccurrences++;
          if (lastOccurrenceIndex === -1 || i < lastOccurrenceIndex) {
            lastOccurrenceIndex = i; // Keep track of most recent occurrence
          }
        }
      }

      const avgLifetimeOccurrence = lifetimeOccurrences > 0 ? (recentDraws.length / lifetimeOccurrences).toFixed(1) : 'N/A';
      const drawsSince = lastOccurrenceIndex >= 0 ? lastOccurrenceIndex : 'Never';

      return {
        ...pattern,
        lifetimeOccurrences,
        drawsSince,
        avgLifetimeOccurrence
      };
    });
  };

  // Helper functions for Even/Odd and High/Low analysis
  const isEven = (num: number): boolean => num % 2 === 0;
  const isOdd = (num: number): boolean => num % 2 !== 0;
  const isLow = (num: number): boolean => num >= 1 && num <= 34;
  const isHigh = (num: number): boolean => num >= 35 && num <= 70;

  // Calculate skips for all numbers across all draws
  const calculateNumberSkips = (allDraws: Draw[]): Map<number, { lastSeen: number; totalSkips: number; lastSkipCount: number }> => {
    const numberStats = new Map<number, { lastSeen: number; totalSkips: number; lastSkipCount: number }>();

    // Initialize all possible numbers that could exist
    for (let i = 1; i <= 69; i++) {
      numberStats.set(i, { lastSeen: -1, totalSkips: 0, lastSkipCount: 0 });
    }

    // Process draws from oldest to newest (reverse the array since it's sorted newest to oldest)
    const chronologicalDraws = [...allDraws].reverse();

    // Go through each draw in chronological order and update number statistics
    for (let drawIndex = 0; drawIndex < chronologicalDraws.length; drawIndex++) {
      const draw = chronologicalDraws[drawIndex];

      // Mark numbers that appeared in this draw
      draw.white_balls.forEach(number => {
        const stats = numberStats.get(number);
        if (stats) {
          if (stats.lastSeen === -1) {
            // First time seeing this number
            stats.lastSeen = drawIndex;
            stats.lastSkipCount = 0; // First time, no previous skips
          } else {
            // Calculate skips since last seen
            const skips = drawIndex - stats.lastSeen - 1;
            if (skips > 0) {
              stats.totalSkips += skips;
              stats.lastSkipCount = skips; // Store the skip count for this hit
            }
            stats.lastSeen = drawIndex;
          }
        }
      });
    }

    return numberStats;
  };

  // Calculate current skip count for all numbers from the most recent draw
  const getAllNumbersCurrentSkips = (allDraws: Draw[], numberStats: Map<number, { lastSeen: number; totalSkips: number; lastSkipCount: number }>) => {
    const allNumbers: Array<{ number: number; currentSkips: number; lastSkipCount: number }> = [];

    // Generate all possible numbers
    for (let i = 1; i <= 69; i++) {
      const stats = numberStats.get(i);

      let currentSkips = 0;
      if (stats) {
        if (stats.lastSeen === -1) {
          // Never seen before
          currentSkips = allDraws.length;
        } else {
          // Calculate draws since last seen
          // lastSeen is the chronological index (0 = oldest draw)
          // So current skips = total draws - 1 - lastSeen
          currentSkips = allDraws.length - 1 - stats.lastSeen;
        }
      }

      allNumbers.push({
        number: i,
        currentSkips: Math.max(0, currentSkips),
        lastSkipCount: stats?.lastSkipCount || 0
      });
    }

    return allNumbers;
  };

  // Get Even/Odd pattern for a draw
  const getEvenOddPattern = (draw: Draw): string => {
    const pattern = draw.white_balls.map(ball => isEven(ball) ? 'E' : 'O').join('');
    return pattern;
  };

  // Get High/Low pattern for a draw
  const getHighLowPattern = (draw: Draw): string => {
    const pattern = draw.white_balls.map(ball => isLow(ball) ? 'L' : 'H').join('');
    return pattern;
  };

  // Analyze Even/Odd patterns
  const getEvenOddPatternAnalysis = () => {
    const patterns = [
      { even: 5, odd: 0, label: '5-0' },
      { even: 4, odd: 1, label: '4-1' },
      { even: 3, odd: 2, label: '3-2' },
      { even: 2, odd: 3, label: '2-3' },
      { even: 1, odd: 4, label: '1-4' },
      { even: 0, odd: 5, label: '0-5' }
    ];

    const recentDraws = draws.slice(0, 200);

    return patterns.map(pattern => {
      let lifetimeOccurrences = 0;
      let lastOccurrenceIndex = -1;

      for (let i = 0; i < recentDraws.length; i++) {
        const draw = recentDraws[i];
        const drawPattern = getEvenOddPattern(draw);
        const evenCount = (drawPattern.match(/E/g) || []).length;
        const oddCount = (drawPattern.match(/O/g) || []).length;

        if (evenCount === pattern.even && oddCount === pattern.odd) {
          lifetimeOccurrences++;
          if (lastOccurrenceIndex === -1 || i < lastOccurrenceIndex) {
            lastOccurrenceIndex = i;
          }
        }
      }

      const avgLifetimeOccurrence = lifetimeOccurrences > 0 ? (recentDraws.length / lifetimeOccurrences).toFixed(1) : 'N/A';
      const drawsSince = lastOccurrenceIndex >= 0 ? lastOccurrenceIndex : 'Never';

      return {
        ...pattern,
        lifetimeOccurrences,
        drawsSince,
        avgLifetimeOccurrence
      };
    });
  };

  // Analyze High/Low patterns
  const getHighLowPatternAnalysis = () => {
    const patterns = [
      { high: 5, low: 0, label: '5-0' },
      { high: 4, low: 1, label: '4-1' },
      { high: 3, low: 2, label: '3-2' },
      { high: 2, low: 3, label: '2-3' },
      { high: 1, low: 4, label: '1-4' },
      { high: 0, low: 5, label: '0-5' }
    ];

    const recentDraws = draws.slice(0, 200);

    return patterns.map(pattern => {
      let lifetimeOccurrences = 0;
      let lastOccurrenceIndex = -1;

      for (let i = 0; i < recentDraws.length; i++) {
        const draw = recentDraws[i];
        const drawPattern = getHighLowPattern(draw);
        const highCount = (drawPattern.match(/H/g) || []).length;
        const lowCount = (drawPattern.match(/L/g) || []).length;

        if (highCount === pattern.high && lowCount === pattern.low) {
          lifetimeOccurrences++;
          if (lastOccurrenceIndex === -1 || i < lastOccurrenceIndex) {
            lastOccurrenceIndex = i;
          }
        }
      }

      const avgLifetimeOccurrence = lifetimeOccurrences > 0 ? (recentDraws.length / lifetimeOccurrences).toFixed(1) : 'N/A';
      const drawsSince = lastOccurrenceIndex >= 0 ? lastOccurrenceIndex : 'Never';

      return {
        ...pattern,
        lifetimeOccurrences,
        drawsSince,
        avgLifetimeOccurrence
      };
    });
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  const last30Draws = draws.slice(0, 30);

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
          </div>
        </div>
      </nav>
      <h1 className="text-3xl font-bold mb-6">Number Analysis - Last 14 Draws</h1>

      {/* Category Analysis Sections */}
      <div className="space-y-8">
        {categorySections.map((section, sectionIndex) => {
          const stats = getSectionStats(section);
          return (
            <div key={sectionIndex} className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{section.title}</h2>
                <p className="text-gray-600 mb-4">{section.description}</p>
                
                {/* Section Summary */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Section Summary (Last 14 Draws)</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-100 p-3 rounded">
                      <div className="text-2xl font-bold text-blue-600">{stats.coldCount}</div>
                      <div className="text-sm text-blue-800">Cold/Due Groups</div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{stats.evenCount}</div>
                      <div className="text-sm text-yellow-800">Even/Due Groups</div>
                    </div>
                    <div className="bg-red-100 p-3 rounded">
                      <div className="text-2xl font-bold text-red-600">{stats.hotCount}</div>
                      <div className="text-sm text-red-800">Hot/Over Groups</div>
                    </div>
                  </div>
                </div>

                {/* Hit Analysis */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Hit Source Analysis (Last 14 Draws)</h3>
                  {(() => {
                    const hitAnalysis = getSectionHitAnalysis(section);
                    return (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-50 p-3 rounded border">
                          <div className="text-xl font-bold text-blue-600">{hitAnalysis.coldHits}</div>
                          <div className="text-sm text-blue-800">Hits from Cold/Due Groups</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded border">
                          <div className="text-xl font-bold text-yellow-600">{hitAnalysis.evenHits}</div>
                          <div className="text-sm text-yellow-800">Hits from Even/Due Groups</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded border">
                          <div className="text-xl font-bold text-red-600">{hitAnalysis.hotHits}</div>
                          <div className="text-sm text-red-800">Hits from Hot/Over Groups</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Groups Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 border-b text-left font-semibold">Group</th>
                      <th className="px-4 py-3 border-b text-center font-semibold">Numbers</th>
                      <th className="px-4 py-3 border-b text-center font-semibold">Group Size</th>
                      <th className="px-4 py-3 border-b text-center font-semibold">Expected Hits</th>
                      <th className="px-4 py-3 border-b text-center font-semibold">Actual Hits</th>
                      <th className="px-4 py-3 border-b text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.groups.map((group, groupIndex) => {
                      const actualHits = getHitsInLast14Draws(group, draws);
                      const status = getStatus(actualHits, group.expectedHits);
                      return (
                        <tr key={groupIndex} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b font-medium">{group.name}</td>
                          <td className="px-4 py-3 border-b text-center text-sm">
                            {group.numbers.join(', ')}
                          </td>
                          <td className="px-4 py-3 border-b text-center">{group.numbers.length}</td>
                          <td className="px-4 py-3 border-b text-center">{group.expectedHits}</td>
                          <td className="px-4 py-3 border-b text-center font-semibold">{actualHits}</td>
                          <td className={`px-4 py-3 border-b text-center font-semibold ${status.color}`}>
                            {status.status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Numbers Tracking */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Group Tracking - Games Since Last Hit</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-3 border-b text-left font-semibold">Group</th>
                          <th className="px-4 py-3 border-b text-center font-semibold">Numbers</th>
                          <th className="px-4 py-3 border-b text-center font-semibold">Group Size</th>
                          <th className="px-4 py-3 border-b text-center font-semibold">Expected Hits</th>
                          <th className="px-4 py-3 border-b text-center font-semibold">Actual Hits</th>
                          <th className="px-4 py-3 border-b text-center font-semibold">Status</th>
                          <th className="px-4 py-3 border-b text-center font-semibold">Games Since Last Hit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.groups.map((group, groupIndex) => {
                          const actualHits = getHitsInLast14Draws(group, draws);
                          const status = getStatus(actualHits, group.expectedHits);
                          const gamesSince = getGamesSinceLastDrawnForNumber(group.numbers[0], group, draws);
                          return (
                            <tr key={groupIndex} className="hover:bg-gray-50">
                              <td className="px-4 py-3 border-b font-medium">{group.name}</td>
                              <td className="px-4 py-3 border-b text-center text-sm">
                                {group.numbers.join(', ')}
                              </td>
                              <td className="px-4 py-3 border-b text-center">{group.numbers.length}</td>
                              <td className="px-4 py-3 border-b text-center">{group.expectedHits}</td>
                              <td className="px-4 py-3 border-b text-center font-semibold">{actualHits}</td>
                              <td className={`px-4 py-3 border-b text-center font-semibold ${status.color}`}>
                                {status.status}
                              </td>
                              <td className="px-4 py-3 border-b text-center">
                                <span className={`font-semibold ${gamesSince === 0 ? 'text-green-600' : gamesSince <= 3 ? 'text-orange-600' : 'text-gray-700'}`}>
                                  {gamesSince}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Even/Odd Pattern Analysis */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Pattern Analysis - Even vs Odd Combinations</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 border-b text-center font-semibold">Pattern (Even-Odd)</th>
                          <th className="px-3 py-2 border-b text-center font-semibold">Lifetime Occurrences</th>
                          <th className="px-3 py-2 border-b text-center font-semibold">Draws Since Last</th>
                          <th className="px-3 py-2 border-b text-center font-semibold">Avg Occurrence (Draws)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const patterns = getEvenOddPatternAnalysis();
                          return patterns.map((pattern, patternIndex) => (
                            <tr key={patternIndex} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border-b text-center font-medium">{pattern.label}</td>
                              <td className="px-3 py-2 border-b text-center">{pattern.lifetimeOccurrences}</td>
                              <td className="px-3 py-2 border-b text-center">
                                <span className={`font-semibold ${pattern.drawsSince === 0 ? 'text-green-600' : (typeof pattern.drawsSince === 'number' && pattern.drawsSince <= 5) ? 'text-orange-600' : 'text-gray-700'}`}>
                                  {pattern.drawsSince}
                                </span>
                              </td>
                              <td className="px-3 py-2 border-b text-center">{pattern.avgLifetimeOccurrence}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* High/Low Pattern Analysis */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Pattern Analysis - High vs Low Combinations</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 border-b text-center font-semibold">Pattern (High-Low)</th>
                          <th className="px-3 py-2 border-b text-center font-semibold">Lifetime Occurrences</th>
                          <th className="px-3 py-2 border-b text-center font-semibold">Draws Since Last</th>
                          <th className="px-3 py-2 border-b text-center font-semibold">Avg Occurrence (Draws)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const patterns = getHighLowPatternAnalysis();
                          return patterns.map((pattern, patternIndex) => (
                            <tr key={patternIndex} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border-b text-center font-medium">{pattern.label}</td>
                              <td className="px-3 py-2 border-b text-center">{pattern.lifetimeOccurrences}</td>
                              <td className="px-3 py-2 border-b text-center">
                                <span className={`font-semibold ${pattern.drawsSince === 0 ? 'text-green-600' : (typeof pattern.drawsSince === 'number' && pattern.drawsSince <= 5) ? 'text-orange-600' : 'text-gray-700'}`}>
                                  {pattern.drawsSince}
                                </span>
                              </td>
                              <td className="px-3 py-2 border-b text-center">{pattern.avgLifetimeOccurrence}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pattern Tracking - Last 20 Draws */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Pattern Tracking - Last 20 Draws</h2>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 border-b text-center font-semibold">Draw Date</th>
                  <th className="px-4 py-3 border-b text-center font-semibold">Numbers</th>
                  <th className="px-4 py-3 border-b text-center font-semibold">Even/Odd Pattern</th>
                  <th className="px-4 py-3 border-b text-center font-semibold">High/Low Pattern</th>
                </tr>
              </thead>
              <tbody>
                {draws.slice(0, 20).map((draw, index) => {
                  const evenOddPattern = getEvenOddPattern(draw);
                  const highLowPattern = getHighLowPattern(draw);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b text-center font-medium">{draw.date}</td>
                      <td className="px-4 py-3 border-b text-center">
                        <div className="flex justify-center gap-1">
                          {draw.white_balls.map((ball, i) => (
                            <div key={i} className="w-6 h-6 bg-white border border-gray-400 rounded-full flex items-center justify-center text-xs font-bold">
                              {ball}
                            </div>
                          ))}
                          <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold ml-1">
                            {draw.red_ball}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b text-center font-mono font-semibold text-blue-600">
                        {evenOddPattern}
                      </td>
                      <td className="px-4 py-3 border-b text-center font-mono font-semibold text-green-600">
                        {highLowPattern}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Skip Range Analysis */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Number Skip Range Analysis (Most Recent Draw)</h2>

        {(() => {
          const numberStats = calculateNumberSkips(draws);
          const allNumbersCurrentSkips = getAllNumbersCurrentSkips(draws, numberStats);

          // Categorize all numbers by their current skip ranges
          const skipRanges = {
            '0 (Just Hit)': allNumbersCurrentSkips.filter(n => n.currentSkips === 0).length,
            '1-5': allNumbersCurrentSkips.filter(n => n.currentSkips >= 1 && n.currentSkips <= 5).length,
            '6-10': allNumbersCurrentSkips.filter(n => n.currentSkips >= 6 && n.currentSkips <= 10).length,
            '11-20': allNumbersCurrentSkips.filter(n => n.currentSkips >= 11 && n.currentSkips <= 20).length,
            '21-50': allNumbersCurrentSkips.filter(n => n.currentSkips >= 21 && n.currentSkips <= 50).length,
            '51-100': allNumbersCurrentSkips.filter(n => n.currentSkips >= 51 && n.currentSkips <= 100).length,
            '100+': allNumbersCurrentSkips.filter(n => n.currentSkips > 100).length
          };

          const over100 = skipRanges['100+'];
          const under20 = skipRanges['0 (Just Hit)'] + skipRanges['1-5'] + skipRanges['6-10'] + skipRanges['11-20'];

          // Calculate averages for each range
          const rangeAverages = {
            '0 (Just Hit)': 0,
            '1-5': allNumbersCurrentSkips.filter(n => n.currentSkips >= 1 && n.currentSkips <= 5).reduce((sum, n) => sum + n.currentSkips, 0) /
                   Math.max(1, allNumbersCurrentSkips.filter(n => n.currentSkips >= 1 && n.currentSkips <= 5).length),
            '6-10': allNumbersCurrentSkips.filter(n => n.currentSkips >= 6 && n.currentSkips <= 10).reduce((sum, n) => sum + n.currentSkips, 0) /
                    Math.max(1, allNumbersCurrentSkips.filter(n => n.currentSkips >= 6 && n.currentSkips <= 10).length),
            '11-20': allNumbersCurrentSkips.filter(n => n.currentSkips >= 11 && n.currentSkips <= 20).reduce((sum, n) => sum + n.currentSkips, 0) /
                     Math.max(1, allNumbersCurrentSkips.filter(n => n.currentSkips >= 11 && n.currentSkips <= 20).length),
            '21-50': allNumbersCurrentSkips.filter(n => n.currentSkips >= 21 && n.currentSkips <= 50).reduce((sum, n) => sum + n.currentSkips, 0) /
                     Math.max(1, allNumbersCurrentSkips.filter(n => n.currentSkips >= 21 && n.currentSkips <= 50).length),
            '51-100': allNumbersCurrentSkips.filter(n => n.currentSkips >= 51 && n.currentSkips <= 100).reduce((sum, n) => sum + n.currentSkips, 0) /
                      Math.max(1, allNumbersCurrentSkips.filter(n => n.currentSkips >= 51 && n.currentSkips <= 100).length),
            '100+': allNumbersCurrentSkips.filter(n => n.currentSkips > 100).reduce((sum, n) => sum + n.currentSkips, 0) /
                    Math.max(1, allNumbersCurrentSkips.filter(n => n.currentSkips > 100).length)
          };

          return (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                  <div className="text-2xl font-bold text-red-600">{over100}</div>
                  <div className="text-sm text-red-800">Numbers with 100+ draws out</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="text-2xl font-bold text-green-600">{under20}</div>
                  <div className="text-sm text-green-800">Numbers with &lt;20 draws out</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{(under20 / 69 * 100).toFixed(1)}%</div>
                  <div className="text-sm text-blue-800">Numbers &lt;20 draws out (%)</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{(over100 / 69 * 100).toFixed(1)}%</div>
                  <div className="text-sm text-purple-800">Numbers 100+ draws out (%)</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border-b text-center font-semibold">Skip Range</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Count</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Percentage</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Avg Draws Out</th>
                      <th className="px-4 py-2 border-b text-center font-semibold">Sample Numbers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(skipRanges).map(([range, count]) => (
                      <tr key={range} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b text-center font-medium">{range}</td>
                        <td className="px-4 py-2 border-b text-center font-semibold">{count}</td>
                        <td className="px-4 py-2 border-b text-center">{((count / 69) * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2 border-b text-center">{rangeAverages[range as keyof typeof rangeAverages]?.toFixed(1) || '0.0'}</td>
                        <td className="px-4 py-2 border-b text-center text-sm">
                          {allNumbersCurrentSkips
                            .filter(n => {
                              if (range === '0 (Just Hit)') return n.currentSkips === 0;
                              if (range === '100+') return n.currentSkips > 100;
                              if (range.includes('-')) {
                                const [min, max] = range.split('-').map(n => parseInt(n));
                                return n.currentSkips >= min && n.currentSkips <= max;
                              }
                              return false;
                            })
                            .sort((a, b) => b.currentSkips - a.currentSkips) // Sort by highest skips first
                            .slice(0, 5) // Show top 5
                            .map(n => `${n.number}(${n.currentSkips})`)
                            .join(', ')}
                          {allNumbersCurrentSkips.filter(n => {
                            if (range === '0 (Just Hit)') return n.currentSkips === 0;
                            if (range === '100+') return n.currentSkips > 100;
                            if (range.includes('-')) {
                              const [min, max] = range.split('-').map(n => parseInt(n));
                              return n.currentSkips >= min && n.currentSkips <= max;
                            }
                            return false;
                          }).length > 5 ? '...' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Last 30 Draws with Categories */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Last 30 Draws - Category Identification</h2>
        <div className="space-y-4">
          {last30Draws.map((draw, index) => {
            const categories = getDrawCategories(draw);
            return (
              <div key={index} className="border border-gray-300 rounded-lg p-4 bg-white shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{draw.date}</h3>
                  <div className="text-sm text-gray-600">
                    Categories: {categories.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {draw.white_balls.map((ball, i) => (
                    <div key={i} className="w-8 h-8 bg-white border-2 border-gray-800 rounded-full flex items-center justify-center font-bold text-xs">
                      {ball}
                    </div>
                  ))}
                  <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {draw.red_ball}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NumberAnalysis;
