import React, { useState, useEffect } from 'react';
import { Link } from "react-router";

interface Draw {
  date: string;
  white_balls: number[];
  red_ball: number;
  power_play: string;
}

interface NumberSkipData {
  number: number;
  currentSkip: number;
  totalSkips: number;
  averageSkip: number;
  maxSkip: number;
  lastAppearance: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

const SkipAnalysis: React.FC = () => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysToShow, setDaysToShow] = useState(30);
  const [numberSkipData, setNumberSkipData] = useState<Map<number, NumberSkipData>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/powerball.txt');
        const text = await response.text();
        const lines = text.trim().split('\n');

        const parsedDraws: Draw[] = lines.slice(1).map(line => {
          const parts = line.split(',');
          return {
            date: parts[0],
            white_balls: parts[1].split('|').map(n => parseInt(n)).sort((a, b) => a - b),
            red_ball: parseInt(parts[2]),
            power_play: parts[3] || ''
          };
        });

        // Sort from latest to oldest
        parsedDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setDraws(parsedDraws);
        setLoading(false);
      } catch {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate skip data for all numbers
  useEffect(() => {
    if (draws.length === 0) return;

    const skipData = new Map<number, NumberSkipData>();

    // Initialize all numbers 1-70
    for (let num = 1; num <= 70; num++) {
      skipData.set(num, {
        number: num,
        currentSkip: 0,
        totalSkips: 0,
        averageSkip: 0,
        maxSkip: 0,
        lastAppearance: '',
        trend: 'stable'
      });
    }

    // Calculate skip statistics
    const recentDraws = draws.slice(0, daysToShow);
    const allDraws = draws.slice(0, Math.max(daysToShow * 2, 100)); // Use more data for better statistics

    // Track last appearance for each number
    const lastAppearanceMap = new Map<number, number>();

    // Process all draws to calculate statistics
    for (let drawIndex = 0; drawIndex < allDraws.length; drawIndex++) {
      const draw = allDraws[drawIndex];
      const drawnNumbers = new Set(draw.white_balls);

      // Update skip counts for numbers that didn't appear
      for (let num = 1; num <= 70; num++) {
        if (!drawnNumbers.has(num)) {
          const currentData = skipData.get(num)!;
          currentData.totalSkips++;
          currentData.currentSkip = drawIndex - (lastAppearanceMap.get(num) || -1);
          if (currentData.currentSkip > currentData.maxSkip) {
            currentData.maxSkip = currentData.currentSkip;
          }
        } else {
          // Number appeared, reset current skip and record appearance
          lastAppearanceMap.set(num, drawIndex);
          const currentData = skipData.get(num)!;
          currentData.lastAppearance = draw.date;
          currentData.currentSkip = 0;
        }
      }
    }

    // Calculate averages and trends
    for (let num = 1; num <= 70; num++) {
      const data = skipData.get(num)!;
      const appearances = allDraws.length - data.totalSkips;
      data.averageSkip = appearances > 0 ? data.totalSkips / appearances : allDraws.length;

      // Calculate trend based on recent vs historical performance
      const recentAppearances = recentDraws.filter(draw => draw.white_balls.includes(num)).length;
      const expectedRecent = (recentDraws.length / allDraws.length) * appearances;
      if (recentAppearances > expectedRecent * 1.2) {
        data.trend = 'increasing';
      } else if (recentAppearances < expectedRecent * 0.8) {
        data.trend = 'decreasing';
      } else {
        data.trend = 'stable';
      }
    }

    setNumberSkipData(skipData);
  }, [draws, daysToShow]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  const recentDraws = draws.slice(0, daysToShow);

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

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Global Skip Analysis</h1>

        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <label className="font-semibold">Analyze last</label>
            <select
              value={daysToShow}
              onChange={(e) => setDaysToShow(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={21}>21 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
            <label className="font-semibold">of draws</label>
          </div>
        </div>
      </div>

      {/* Recent Draws with Skip Information */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Draws & Skip Patterns</h2>
        <div className="space-y-4">
          {recentDraws.map((draw, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">{draw.date}</h3>
                <div className="text-sm text-gray-600">
                  Draw #{recentDraws.length - index}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Numbers Drawn:</h4>
                  <div className="flex flex-wrap gap-2">
                    {draw.white_balls.map((num, numIndex) => {
                      const skipData = numberSkipData.get(num);
                      return (
                        <div key={numIndex} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {num}
                          <span className="ml-1 text-xs text-blue-600">
                            (skip: {skipData?.currentSkip || 0})
                          </span>
                        </div>
                      );
                    })}
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold ml-2">
                      PB: {draw.red_ball}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Skip Statistics:</h4>
                  <div className="text-sm space-y-1">
                    <div>Total numbers skipped this draw: {70 - draw.white_balls.length}</div>
                    <div>Average skip of drawn numbers: {(draw.white_balls.reduce((sum, num) => {
                      const skipData = numberSkipData.get(num);
                      return sum + (skipData?.currentSkip || 0);
                    }, 0) / draw.white_balls.length).toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Number Skip Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Number Skip Summary</h2>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from(numberSkipData.values()).map((data) => (
              <div key={data.number} className="border rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{data.number}</div>
                <div className="text-sm text-gray-600">
                  <div>Current: {data.currentSkip}</div>
                  <div>Avg: {data.averageSkip.toFixed(1)}</div>
                  <div className={`text-xs ${getTrendColor(data.trend)}`}>
                    {getTrendIcon(data.trend)} {data.trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Skip Distribution</h3>
          <div className="space-y-2">
            {[
              { range: '0-5', count: Array.from(numberSkipData.values()).filter(d => d.currentSkip <= 5).length },
              { range: '6-10', count: Array.from(numberSkipData.values()).filter(d => d.currentSkip > 5 && d.currentSkip <= 10).length },
              { range: '11-20', count: Array.from(numberSkipData.values()).filter(d => d.currentSkip > 10 && d.currentSkip <= 20).length },
              { range: '21+', count: Array.from(numberSkipData.values()).filter(d => d.currentSkip > 20).length }
            ].map((item) => (
              <div key={item.range} className="flex justify-between">
                <span>{item.range} skips:</span>
                <span className="font-semibold">{item.count} numbers</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
          <div className="space-y-2">
            {[
              { trend: 'increasing', count: Array.from(numberSkipData.values()).filter(d => d.trend === 'increasing').length, color: 'text-green-600' },
              { trend: 'stable', count: Array.from(numberSkipData.values()).filter(d => d.trend === 'stable').length, color: 'text-gray-600' },
              { trend: 'decreasing', count: Array.from(numberSkipData.values()).filter(d => d.trend === 'decreasing').length, color: 'text-red-600' }
            ].map((item) => (
              <div key={item.trend} className="flex justify-between">
                <span className={`capitalize ${item.color}`}>{item.trend}:</span>
                <span className="font-semibold">{item.count} numbers</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Overall Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total draws analyzed:</span>
              <span className="font-semibold">{daysToShow}</span>
            </div>
            <div className="flex justify-between">
              <span>Average skip across all numbers:</span>
              <span className="font-semibold">
                {(Array.from(numberSkipData.values()).reduce((sum, d) => sum + d.averageSkip, 0) / 70).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Numbers with skip &gt; 15:</span>
              <span className="font-semibold text-red-600">
                {Array.from(numberSkipData.values()).filter(d => d.currentSkip > 15).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkipAnalysis;
