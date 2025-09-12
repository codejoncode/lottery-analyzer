import React, { useState, useMemo } from 'react';

interface SumAnalysisProps {
  className?: string;
}

interface NumberAnalysis {
  digits: number[];
  sum: number;
  rootSum: number;
  sumLastDigit: number;
}

const SumAnalysisInspector: React.FC<SumAnalysisProps> = ({ className = '' }) => {
  const [inputNumbers, setInputNumbers] = useState<string>('');

  const analyzedNumbers = useMemo(() => {
    if (!inputNumbers.trim()) return [];

    const lines = inputNumbers.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      const sum = digits.reduce((a, b) => a + b, 0);
      const rootSum = sum % 9 || 9;
      const sumLastDigit = sum % 10;

      return {
        digits,
        sum,
        rootSum,
        sumLastDigit
      } as NumberAnalysis;
    }).filter(Boolean) as NumberAnalysis[];
  }, [inputNumbers]);

  const statistics = useMemo(() => {
    if (analyzedNumbers.length === 0) return null;

    const sumCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.sum] = (acc[num.sum] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const rootSumCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.rootSum] = (acc[num.rootSum] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const sumLastDigitCounts = analyzedNumbers.reduce((acc, num) => {
      acc[num.sumLastDigit] = (acc[num.sumLastDigit] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const avgSum = analyzedNumbers.reduce((sum, num) => sum + num.sum, 0) / analyzedNumbers.length;
    const minSum = Math.min(...analyzedNumbers.map(n => n.sum));
    const maxSum = Math.max(...analyzedNumbers.map(n => n.sum));

    return {
      total: analyzedNumbers.length,
      sumCounts,
      rootSumCounts,
      sumLastDigitCounts,
      avgSum,
      minSum,
      maxSum
    };
  }, [analyzedNumbers]);

  const getTopSums = (counts: Record<number, number>, limit = 10) => {
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([sum, count]) => [parseInt(sum), count] as [number, number]);
  };

  const sumRanges = [
    { range: '0-6', description: 'Very Low', color: 'bg-red-100 text-red-800' },
    { range: '7-9', description: 'Low', color: 'bg-orange-100 text-orange-800' },
    { range: '10-13', description: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { range: '14-16', description: 'High', color: 'bg-green-100 text-green-800' },
    { range: '17-27', description: 'Very High', color: 'bg-blue-100 text-blue-800' }
  ];

  const getSumRange = (sum: number) => {
    if (sum <= 6) return '0-6';
    if (sum <= 9) return '7-9';
    if (sum <= 13) return '10-13';
    if (sum <= 16) return '14-16';
    return '17-27';
  };

  return (
    <div className={`sum-analysis-inspector ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">🔍 Inspector 3 - Sum Analysis</h2>
        <p className="text-gray-600 mb-4">
          Analyze Pick 3 numbers by their sum patterns: total sum, digital root sum, and sum last digit.
          Discover patterns in how numbers add up and their mathematical properties.
        </p>

        <div className="bg-orange-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Sum Analysis Explained</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded">
              <strong className="text-orange-600">Total Sum</strong>
              <div className="mt-1">Sum of all three digits</div>
              <div className="font-mono text-xs">1+2+3 = 6</div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong className="text-red-600">Digital Root</strong>
              <div className="mt-1">Sum reduced to single digit</div>
              <div className="font-mono text-xs">6 → 6 (already single)</div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong className="text-blue-600">Sum Last Digit</strong>
              <div className="mt-1">Final digit of the sum</div>
              <div className="font-mono text-xs">6 → 6</div>
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
          <h3 className="text-lg font-semibold mb-4">Sum Range Categories</h3>
          <div className="space-y-2">
            {sumRanges.map(({ range, description, color }) => (
              <div key={range} className={`p-3 rounded-lg ${color}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{range}</div>
                    <div className="text-sm opacity-75">{description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {analyzedNumbers.filter(n => getSumRange(n.sum) === range).length}
                    </div>
                    <div className="text-xs">numbers</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analyzedNumbers.length > 0 && statistics && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Sum Analysis Results ({analyzedNumbers.length} numbers)</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4 text-orange-600">Total Sums (Top 10)</h4>
              <div className="space-y-2">
                {getTopSums(statistics.sumCounts).map(([sum, count]) => (
                  <div key={sum} className="flex justify-between items-center">
                    <span className="font-bold">{sum}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
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
              <h4 className="font-semibold mb-4 text-red-600">Digital Roots (Top 10)</h4>
              <div className="space-y-2">
                {getTopSums(statistics.rootSumCounts).map(([rootSum, count]) => (
                  <div key={rootSum} className="flex justify-between items-center">
                    <span className="font-bold">{rootSum}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
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
              <h4 className="font-semibold mb-4 text-blue-600">Sum Last Digits (Top 10)</h4>
              <div className="space-y-2">
                {getTopSums(statistics.sumLastDigitCounts).map(([lastDigit, count]) => (
                  <div key={lastDigit} className="flex justify-between items-center">
                    <span className="font-bold">{lastDigit}</span>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.avgSum.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Sum</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {statistics.minSum}-{statistics.maxSum}
              </div>
              <div className="text-sm text-gray-600">Sum Range</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(statistics.sumCounts).length}
              </div>
              <div className="text-sm text-gray-600">Unique Sums</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-semibold mb-4">Detailed Sum Analysis</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Number</th>
                    <th className="text-left p-2">Digits</th>
                    <th className="text-left p-2">Total Sum</th>
                    <th className="text-left p-2">Digital Root</th>
                    <th className="text-left p-2">Last Digit</th>
                    <th className="text-left p-2">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedNumbers.slice(0, 20).map((num, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono font-bold">
                        {num.digits.join('')}
                      </td>
                      <td className="p-2">
                        {num.digits.join(' + ')}
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-bold">
                          {num.sum}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                          {num.rootSum}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                          {num.sumLastDigit}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          getSumRange(num.sum) === '0-6' ? 'bg-red-100 text-red-800' :
                          getSumRange(num.sum) === '7-9' ? 'bg-orange-100 text-orange-800' :
                          getSumRange(num.sum) === '10-13' ? 'bg-yellow-100 text-yellow-800' :
                          getSumRange(num.sum) === '14-16' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {getSumRange(num.sum)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {analyzedNumbers.length > 20 && (
                    <tr>
                      <td colSpan={6} className="p-2 text-center text-gray-500">
                        ... and {analyzedNumbers.length - 20} more numbers
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SumAnalysisInspector;
