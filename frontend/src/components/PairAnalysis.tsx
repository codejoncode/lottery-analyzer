import React, { useState, useMemo } from 'react';

interface PairAnalysisProps {
  className?: string;
}

interface NumberAnalysis {
  digits: number[];
  pairs: {
    front: string;
    split: string;
    back: string;
  };
}

const PairAnalysis: React.FC<PairAnalysisProps> = ({ className = '' }) => {
  const [inputNumbers, setInputNumbers] = useState<string>('');

  const analyzedNumbers = useMemo(() => {
    if (!inputNumbers.trim()) return [];

    const lines = inputNumbers.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      return {
        digits,
        pairs: {
          front: digits.slice(0, 2).join(''),
          split: [digits[0], digits[2]].join(''),
          back: digits.slice(1).join('')
        }
      } as NumberAnalysis;
    }).filter(Boolean) as NumberAnalysis[];
  }, [inputNumbers]);

  const statistics = useMemo(() => {
    if (analyzedNumbers.length === 0) return null;

    const frontCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.pairs.front] = (acc[num.pairs.front] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const splitCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.pairs.split] = (acc[num.pairs.split] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const backCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.pairs.back] = (acc[num.pairs.back] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: analyzedNumbers.length,
      frontCounts,
      splitCounts,
      backCounts
    };
  }, [analyzedNumbers]);

  const getTopPairs = (counts: Record<string, number>, limit = 10) => {
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
  };

  return (
    <div className={`pair-analysis ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">🔍 Inspector 3 - Pair Analysis</h2>
        <p className="text-gray-600 mb-4">
          Analyze Pick 3 numbers by their pair patterns: Front pairs (first two digits),
          Split pairs (first and third digits), and Back pairs (last two digits).
        </p>

        <div className="bg-purple-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Pair Types Explained</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded">
              <strong className="text-purple-600">Front Pair</strong>
              <div className="mt-1">First two digits</div>
              <div className="font-mono text-xs">123 → 12</div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong className="text-blue-600">Split Pair</strong>
              <div className="mt-1">First and third digits</div>
              <div className="font-mono text-xs">123 → 13</div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong className="text-green-600">Back Pair</strong>
              <div className="mt-1">Last two digits</div>
              <div className="font-mono text-xs">123 → 23</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Enter Pick 3 Numbers (one per line):</label>
          <textarea
            value={inputNumbers}
            onChange={(e) => setInputNumbers(e.target.value)}
            placeholder="123&#10;456&#10;789"
            className="w-full h-48 p-3 border rounded-lg font-mono text-sm"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Pair Pattern Examples</h3>
          <div className="space-y-3">
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-mono font-bold text-lg">123</div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div className="text-center">
                  <div className="text-purple-600 font-semibold">Front</div>
                  <div className="font-mono">12</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 font-semibold">Split</div>
                  <div className="font-mono">13</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-semibold">Back</div>
                  <div className="font-mono">23</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <div className="font-mono font-bold text-lg">456</div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div className="text-center">
                  <div className="text-purple-600 font-semibold">Front</div>
                  <div className="font-mono">45</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 font-semibold">Split</div>
                  <div className="font-mono">46</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-semibold">Back</div>
                  <div className="font-mono">56</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {analyzedNumbers.length > 0 && statistics && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Pair Analysis Results ({analyzedNumbers.length} numbers)</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4 text-purple-600">Front Pairs (Top 10)</h4>
              <div className="space-y-2">
                {getTopPairs(statistics.frontCounts).map(([pair, count]) => (
                  <div key={pair} className="flex justify-between items-center">
                    <span className="font-mono font-bold">{pair}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(count / statistics.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4 text-blue-600">Split Pairs (Top 10)</h4>
              <div className="space-y-2">
                {getTopPairs(statistics.splitCounts).map(([pair, count]) => (
                  <div key={pair} className="flex justify-between items-center">
                    <span className="font-mono font-bold">{pair}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / statistics.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4 text-green-600">Back Pairs (Top 10)</h4>
              <div className="space-y-2">
                {getTopPairs(statistics.backCounts).map(([pair, count]) => (
                  <div key={pair} className="flex justify-between items-center">
                    <span className="font-mono font-bold">{pair}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(count / statistics.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-semibold mb-4">Detailed Pair Analysis</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Number</th>
                    <th className="text-left p-2">Front Pair</th>
                    <th className="text-left p-2">Split Pair</th>
                    <th className="text-left p-2">Back Pair</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedNumbers.slice(0, 20).map((num, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono font-bold">
                        {num.digits.join('')}
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono">
                          {num.pairs.front}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                          {num.pairs.split}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono">
                          {num.pairs.back}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {analyzedNumbers.length > 20 && (
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-gray-500">
                        ... and {analyzedNumbers.length - 20} more numbers
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(statistics.frontCounts).length}
              </div>
              <div className="text-sm text-gray-600">Unique Front Pairs</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(statistics.splitCounts).length}
              </div>
              <div className="text-sm text-gray-600">Unique Split Pairs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(statistics.backCounts).length}
              </div>
              <div className="text-sm text-gray-600">Unique Back Pairs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PairAnalysis;
