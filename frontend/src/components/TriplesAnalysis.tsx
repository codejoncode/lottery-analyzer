import React, { useState, useEffect } from 'react';
import { Link } from "react-router";

interface Draw {
  date: string;
  white_balls: number[];
  red_ball: number;
  power_play: string;
}

interface Triple {
  numbers: [number, number, number];
  key: string;
  lastSeen: number; // draws since last occurrence
  totalSkips: number; // total draws this triple has been out
  lastSkipCount: number; // how many draws it was out before last hit
}

const TriplesAnalysis: React.FC = () => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/powerball.txt');
        const text = await response.text();
        const lines = text.trim().split('\n');

        const parsedDraws: Draw[] = lines.slice(1).map(line => { // Skip header row
          const parts = line.split(',');
          return {
            date: parts[0],
            white_balls: parts[1].split('|').map(n => parseInt(n)).sort((a, b) => a - b),
            red_ball: parseInt(parts[2]),
            power_play: parts[3] || ''
          };
        });

        // Sort from latest to oldest (same as PowerballDraws component)
        parsedDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setDraws(parsedDraws);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate all possible triples from 5 numbers (combinations of 3)
  const generateTriples = (numbers: number[]): Triple[] => {
    const triples: Triple[] = [];
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        for (let k = j + 1; k < numbers.length; k++) {
          const triple: [number, number, number] = [numbers[i], numbers[j], numbers[k]];
          triples.push({
            numbers: triple,
            key: `${triple[0]}-${triple[1]}-${triple[2]}`,
            lastSeen: 0,
            totalSkips: 0,
            lastSkipCount: 0
          });
        }
      }
    }
    return triples;
  };

  // Calculate skips for all triples across all draws
  const calculateTripleSkips = (allDraws: Draw[]): Map<string, { lastSeen: number; totalSkips: number; lastSkipCount: number }> => {
    const tripleStats = new Map<string, { lastSeen: number; totalSkips: number; lastSkipCount: number }>();

    // Initialize all possible triples that could exist
    for (let i = 1; i <= 69; i++) {
      for (let j = i + 1; j <= 69; j++) {
        for (let k = j + 1; k <= 69; k++) {
          const key = `${i}-${j}-${k}`;
          tripleStats.set(key, { lastSeen: -1, totalSkips: 0, lastSkipCount: 0 });
        }
      }
    }

    // Process draws from oldest to newest (reverse the array since it's sorted newest to oldest)
    const chronologicalDraws = [...allDraws].reverse();

    // Go through each draw in chronological order and update triple statistics
    for (let drawIndex = 0; drawIndex < chronologicalDraws.length; drawIndex++) {
      const draw = chronologicalDraws[drawIndex];
      const drawTriples = generateTriples(draw.white_balls);

      // Mark triples that appeared in this draw
      drawTriples.forEach(triple => {
        const stats = tripleStats.get(triple.key);
        if (stats) {
          if (stats.lastSeen === -1) {
            // First time seeing this triple
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

    return tripleStats;
  };

  // Get triples for a specific draw with their skip information
  const getDrawTriplesWithSkips = (draw: Draw, tripleStats: Map<string, { lastSeen: number; totalSkips: number; lastSkipCount: number }>, currentIndex: number) => {
    const triples = generateTriples(draw.white_balls);
    const totalDraws = draws.length;

    return triples.map(triple => {
      const stats = tripleStats.get(triple.key);
      let currentSkips = 0;

      if (stats) {
        // Convert display index to chronological index
        // draws[0] = newest, draws[totalDraws-1] = oldest
        const chronologicalIndex = totalDraws - currentIndex - 1;

        if (stats.lastSeen === -1) {
          // Never seen before - count from the beginning to this draw
          currentSkips = chronologicalIndex + 1;
        } else if (chronologicalIndex > stats.lastSeen) {
          // This draw is after the last time this triple was seen
          currentSkips = chronologicalIndex - stats.lastSeen;
        } else if (chronologicalIndex === stats.lastSeen) {
          // This is the draw where the triple was last seen (it just hit)
          currentSkips = 0;
        } else {
          // This draw is before the last time this triple was seen
          // This shouldn't happen in our display logic since we show recent draws
          currentSkips = 0;
        }
      }

      return {
        ...triple,
        currentSkips: Math.max(0, currentSkips), // Ensure non-negative
        totalSkips: stats?.totalSkips || 0,
        lastSkipCount: stats?.lastSkipCount || 0
      };
    });
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  const tripleStats = calculateTripleSkips(draws);
  const last30Draws = draws.slice(0, 30);

  // Calculate total skips for all triples
  let totalTripleSkips = 0;
  tripleStats.forEach(stats => {
    totalTripleSkips += stats.totalSkips;
  });

  // Calculate current skip count for all triples from the most recent draw
  const getAllTriplesCurrentSkips = (allDraws: Draw[], tripleStats: Map<string, { lastSeen: number; totalSkips: number; lastSkipCount: number }>) => {
    const allTriples: Array<{ key: string; currentSkips: number; lastSkipCount: number }> = [];

    // Generate all possible triples
    for (let i = 1; i <= 69; i++) {
      for (let j = i + 1; j <= 69; j++) {
        for (let k = j + 1; k <= 69; k++) {
          const key = `${i}-${j}-${k}`;
          const stats = tripleStats.get(key);

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

          allTriples.push({
            key,
            currentSkips: Math.max(0, currentSkips),
            lastSkipCount: stats?.lastSkipCount || 0
          });
        }
      }
    }

    return allTriples;
  };

  // Calculate per-draw statistics for the last 30 draws
  const drawStats = last30Draws.map((draw, index) => {
    const drawTriples = getDrawTriplesWithSkips(draw, tripleStats, index);
    const totalDrawSkips = drawTriples.reduce((sum, triple) => {
      if (triple.currentSkips === 0 && triple.lastSkipCount > 0) {
        return sum + triple.lastSkipCount;
      }
      return sum + triple.currentSkips;
    }, 0);
    const avgSkipsPerTriple = totalDrawSkips / drawTriples.length;

    return {
      date: draw.date,
      totalSkips: totalDrawSkips,
      avgSkipsPerTriple: avgSkipsPerTriple,
      tripleCount: drawTriples.length
    };
  });

  // Calculate overall average skips per draw
  const totalDrawSkipsSum = drawStats.reduce((sum, stat) => sum + stat.totalSkips, 0);
  const avgSkipsPerDraw = totalDrawSkipsSum / drawStats.length;

  // Analyze up/down patterns
  const patternAnalysis = drawStats.slice(1).map((current, index) => {
    const previous = drawStats[index];
    const trend = current.totalSkips > previous.totalSkips ? 'up' :
                  current.totalSkips < previous.totalSkips ? 'down' : 'same';
    return {
      date: current.date,
      trend,
      skips: current.totalSkips,
      change: current.totalSkips - previous.totalSkips
    };
  });

  // Calculate pattern consistency
  const upDownPattern = patternAnalysis.map(p => p.trend);
  const upCount = upDownPattern.filter(t => t === 'up').length;
  const downCount = upDownPattern.filter(t => t === 'down').length;
  const sameCount = upDownPattern.filter(t => t === 'same').length;

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

      <h1 className="text-3xl font-bold mb-6">Triples Analysis</h1>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Triples Statistics Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{tripleStats.size.toLocaleString()}</div>
            <div className="text-sm text-blue-800">Total Possible Triples</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalTripleSkips.toLocaleString()}</div>
            <div className="text-sm text-green-800">Total Triple Skips</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{avgSkipsPerDraw.toFixed(1)}</div>
            <div className="text-sm text-orange-800">Avg Skips Per Draw</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{(totalDrawSkipsSum / (drawStats.length * 10)).toFixed(1)}</div>
            <div className="text-sm text-purple-800">Avg Skips Per Triple (Active)</div>
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Pattern Analysis (Last 29 Draws)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-xl font-bold text-red-600">{upCount}</div>
              <div className="text-sm text-red-800">Up Trends</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{downCount}</div>
              <div className="text-sm text-blue-800">Down Trends</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xl font-bold text-gray-600">{sameCount}</div>
              <div className="text-sm text-gray-800">No Change</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Pattern: {upDownPattern.join(' → ')}
          </div>
        </div>
      </div>

      {/* Skip Range Analysis - Draws Out */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Skip Range Analysis - Draws Out (All Triples)</h2>

        {(() => {
          const allTriplesCurrentSkips = getAllTriplesCurrentSkips(draws, tripleStats);

          // Categorize all triples by their current skip ranges
          const skipRanges = {
            '0 (Just Hit)': allTriplesCurrentSkips.filter(t => t.currentSkips === 0).length,
            '1-10': allTriplesCurrentSkips.filter(t => t.currentSkips >= 1 && t.currentSkips <= 10).length,
            '11-25': allTriplesCurrentSkips.filter(t => t.currentSkips >= 11 && t.currentSkips <= 25).length,
            '26-50': allTriplesCurrentSkips.filter(t => t.currentSkips >= 26 && t.currentSkips <= 50).length,
            '51-100': allTriplesCurrentSkips.filter(t => t.currentSkips >= 51 && t.currentSkips <= 100).length,
            '101-200': allTriplesCurrentSkips.filter(t => t.currentSkips >= 101 && t.currentSkips <= 200).length,
            '200+': allTriplesCurrentSkips.filter(t => t.currentSkips > 200).length
          };

          const over100 = skipRanges['101-200'] + skipRanges['200+'];
          const under50 = skipRanges['0 (Just Hit)'] + skipRanges['1-10'] + skipRanges['11-25'] + skipRanges['26-50'];

          // Calculate averages for each range
          const rangeAverages = {
            '0 (Just Hit)': 0,
            '1-10': allTriplesCurrentSkips.filter(t => t.currentSkips >= 1 && t.currentSkips <= 10).reduce((sum, t) => sum + t.currentSkips, 0) /
                    Math.max(1, allTriplesCurrentSkips.filter(t => t.currentSkips >= 1 && t.currentSkips <= 10).length),
            '11-25': allTriplesCurrentSkips.filter(t => t.currentSkips >= 11 && t.currentSkips <= 25).reduce((sum, t) => sum + t.currentSkips, 0) /
                     Math.max(1, allTriplesCurrentSkips.filter(t => t.currentSkips >= 11 && t.currentSkips <= 25).length),
            '26-50': allTriplesCurrentSkips.filter(t => t.currentSkips >= 26 && t.currentSkips <= 50).reduce((sum, t) => sum + t.currentSkips, 0) /
                     Math.max(1, allTriplesCurrentSkips.filter(t => t.currentSkips >= 26 && t.currentSkips <= 50).length),
            '51-100': allTriplesCurrentSkips.filter(t => t.currentSkips >= 51 && t.currentSkips <= 100).reduce((sum, t) => sum + t.currentSkips, 0) /
                      Math.max(1, allTriplesCurrentSkips.filter(t => t.currentSkips >= 51 && t.currentSkips <= 100).length),
            '101-200': allTriplesCurrentSkips.filter(t => t.currentSkips >= 101 && t.currentSkips <= 200).reduce((sum, t) => sum + t.currentSkips, 0) /
                       Math.max(1, allTriplesCurrentSkips.filter(t => t.currentSkips >= 101 && t.currentSkips <= 200).length),
            '200+': allTriplesCurrentSkips.filter(t => t.currentSkips > 200).reduce((sum, t) => sum + t.currentSkips, 0) /
                    Math.max(1, allTriplesCurrentSkips.filter(t => t.currentSkips > 200).length)
          };

          return (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                  <div className="text-2xl font-bold text-red-600">{over100}</div>
                  <div className="text-sm text-red-800">Triples with 100+ draws out</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="text-2xl font-bold text-green-600">{under50}</div>
                  <div className="text-sm text-green-800">Triples with &lt;50 draws out</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{(under50 / 11480 * 100).toFixed(1)}%</div>
                  <div className="text-sm text-blue-800">Triples &lt;50 draws out (%)</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{(over100 / 11480 * 100).toFixed(1)}%</div>
                  <div className="text-sm text-purple-800">Triples 100+ draws out (%)</div>
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
                      <th className="px-4 py-2 border-b text-center font-semibold">Sample Triples</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(skipRanges).map(([range, count]) => (
                      <tr key={range} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b text-center font-medium">{range}</td>
                        <td className="px-4 py-2 border-b text-center font-semibold">{count.toLocaleString()}</td>
                        <td className="px-4 py-2 border-b text-center">{((count / 11480) * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2 border-b text-center">{rangeAverages[range as keyof typeof rangeAverages]?.toFixed(1) || '0.0'}</td>
                        <td className="px-4 py-2 border-b text-center text-sm">
                          {allTriplesCurrentSkips
                            .filter(t => {
                              if (range === '0 (Just Hit)') return t.currentSkips === 0;
                              if (range === '200+') return t.currentSkips > 200;
                              if (range.includes('-')) {
                                const [min, max] = range.split('-').map(n => parseInt(n));
                                return t.currentSkips >= min && t.currentSkips <= max;
                              }
                              return false;
                            })
                            .sort((a, b) => b.currentSkips - a.currentSkips) // Sort by highest skips first
                            .slice(0, 3) // Show top 3
                            .map(t => `${t.key}(${t.currentSkips})`)
                            .join(', ')}
                          {allTriplesCurrentSkips.filter(t => {
                            if (range === '0 (Just Hit)') return t.currentSkips === 0;
                            if (range === '200+') return t.currentSkips > 200;
                            if (range.includes('-')) {
                              const [min, max] = range.split('-').map(n => parseInt(n));
                              return t.currentSkips >= min && t.currentSkips <= max;
                            }
                            return false;
                          }).length > 3 ? '...' : ''}
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

      {/* Detailed Pattern Analysis */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Detailed Pattern Analysis</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border-b text-center font-semibold">Draw Date</th>
                <th className="px-4 py-2 border-b text-center font-semibold">Total Triple Skips</th>
                <th className="px-4 py-2 border-b text-center font-semibold">Avg Skips/Triple</th>
                <th className="px-4 py-2 border-b text-center font-semibold">Trend vs Previous</th>
                <th className="px-4 py-2 border-b text-center font-semibold">Change</th>
              </tr>
            </thead>
            <tbody>
              {drawStats.map((stat, index) => {
                const trend = index > 0 ? patternAnalysis[index - 1] : null;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b text-center font-medium">{stat.date}</td>
                    <td className="px-4 py-2 border-b text-center font-semibold">{stat.totalSkips}</td>
                    <td className="px-4 py-2 border-b text-center">{stat.avgSkipsPerTriple.toFixed(1)}</td>
                    <td className="px-4 py-2 border-b text-center">
                      {trend ? (
                        <span className={`font-semibold ${
                          trend.trend === 'up' ? 'text-red-600' :
                          trend.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {trend.trend === 'up' ? '↗️ UP' :
                           trend.trend === 'down' ? '↘️ DOWN' : '➡️ SAME'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border-b text-center">
                      {trend ? (
                        <span className={`font-semibold ${
                          trend.change > 0 ? 'text-red-600' :
                          trend.change < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {trend.change > 0 ? '+' : ''}{trend.change}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Last 30 Draws with Triples */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Last 30 Draws - Triples Analysis</h2>
        <div className="space-y-4">
          {last30Draws.map((draw, index) => {
            const drawTriples = getDrawTriplesWithSkips(draw, tripleStats, index);
            // Calculate total skips for this draw - use the number it was out before hitting
            const totalDrawSkips = drawTriples.reduce((sum, triple) => {
              if (triple.currentSkips === 0 && triple.lastSkipCount > 0) {
                // For triples that just hit, add the skip count they had before hitting
                return sum + triple.lastSkipCount;
              }
              return sum + triple.currentSkips;
            }, 0);

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{draw.date}</h3>
                    <div className="flex items-center gap-2 mt-1">
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
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total Triple Skips</div>
                    <div className="text-xl font-bold text-orange-600">{totalDrawSkips}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {drawTriples.map((triple, tripleIndex) => {
                    const chronologicalIndex = draws.length - index - 1;
                    const justHit = triple.currentSkips === 0 && triple.totalSkips > 0;
                    const previousSkips = justHit ? (triple.totalSkips > 0 ? 'was out' : 'first time') : '';

                    return (
                      <div key={tripleIndex} className="bg-gray-50 rounded p-2 text-center">
                        <div className="font-semibold text-sm">{triple.key}</div>
                        <div className={`text-xs font-bold ${
                          triple.currentSkips === 0 ? 'text-green-600' :
                          triple.currentSkips <= 10 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {triple.currentSkips === 0 && triple.lastSkipCount > 0
                            ? triple.lastSkipCount
                            : triple.currentSkips === 0
                            ? '0'
                            : triple.currentSkips
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Triples Skip Distribution */}
      <div className="bg-white rounded-lg p-6 mt-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Triples Skip Distribution</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border-b text-center font-semibold">Skip Range</th>
                <th className="px-4 py-2 border-b text-center font-semibold">Count</th>
                <th className="px-4 py-2 border-b text-center font-semibold">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const skipCounts = new Map<number, number>();
                tripleStats.forEach(stats => {
                  const skips = stats.lastSeen === -1 ? draws.length : draws.length - 1 - stats.lastSeen;
                  skipCounts.set(skips, (skipCounts.get(skips) || 0) + 1);
                });

                const ranges = [
                  { label: '0-10', min: 0, max: 10 },
                  { label: '11-25', min: 11, max: 25 },
                  { label: '26-50', min: 26, max: 50 },
                  { label: '51-100', min: 51, max: 100 },
                  { label: '101-200', min: 101, max: 200 },
                  { label: '200+', min: 201, max: Infinity }
                ];

                return ranges.map(range => {
                  let count = 0;
                  for (let i = range.min; i <= (range.max === Infinity ? Math.max(...Array.from(skipCounts.keys())) : range.max); i++) {
                    count += skipCounts.get(i) || 0;
                  }
                  const percentage = ((count / tripleStats.size) * 100).toFixed(1);

                  return (
                    <tr key={range.label} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b text-center font-medium">{range.label}</td>
                      <td className="px-4 py-2 border-b text-center">{count.toLocaleString()}</td>
                      <td className="px-4 py-2 border-b text-center">{percentage}%</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TriplesAnalysis;
