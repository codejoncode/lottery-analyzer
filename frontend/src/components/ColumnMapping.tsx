import React, { useState, useMemo } from 'react';

interface ColumnMappingProps {
  className?: string;
}

interface NumberAnalysis {
  digits: number[];
  columns: {
    c1: number;
    c2: number;
    c3: number;
  };
}

const ColumnMapping: React.FC<ColumnMappingProps> = ({ className = '' }) => {
  const [inputNumbers, setInputNumbers] = useState<string>('');

  const analyzedNumbers = useMemo(() => {
    if (!inputNumbers.trim()) return [];

    const lines = inputNumbers.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      return {
        digits,
        columns: {
          c1: digits[0],
          c2: digits[1],
          c3: digits[2]
        }
      } as NumberAnalysis;
    }).filter(Boolean) as NumberAnalysis[];
  }, [inputNumbers]);

  const statistics = useMemo(() => {
    if (analyzedNumbers.length === 0) return null;

    const column1Counts = analyzedNumbers.reduce((acc, num) => {
      acc[num.columns.c1] = (acc[num.columns.c1] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const column2Counts = analyzedNumbers.reduce((acc, num) => {
      acc[num.columns.c2] = (acc[num.columns.c2] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const column3Counts = analyzedNumbers.reduce((acc, num) => {
      acc[num.columns.c3] = (acc[num.columns.c3] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      total: analyzedNumbers.length,
      column1Counts,
      column2Counts,
      column3Counts
    };
  }, [analyzedNumbers]);

  const getTopDigits = (counts: Record<number, number>) => {
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .map(([digit, count]) => [parseInt(digit), count] as [number, number]);
  };

  const getDigitFrequency = (digit: number, counts: Record<number, number>) => {
    return counts[digit] || 0;
  };

  return (
    <div className={`column-mapping ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">🔍 Inspector 3 - Column Mapping</h2>
        <p className="text-gray-600 mb-4">
          Analyze how digits are distributed across the three positions (columns) in Pick 3 numbers.
          Discover position-specific patterns and digit preferences for each column.
        </p>

        <div className="bg-indigo-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Column Positions Explained</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded text-center">
              <strong className="text-indigo-600">Column 1</strong>
              <div className="mt-1">Hundreds position</div>
              <div className="font-mono text-lg">1</div>
              <div className="text-xs text-gray-600">First digit</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <strong className="text-purple-600">Column 2</strong>
              <div className="mt-1">Tens position</div>
              <div className="font-mono text-lg">2</div>
              <div className="text-xs text-gray-600">Middle digit</div>
            </div>
            <div className="bg-white p-3 rounded text-center">
              <strong className="text-green-600">Column 3</strong>
              <div className="mt-1">Units position</div>
              <div className="font-mono text-lg">3</div>
              <div className="text-xs text-gray-600">Last digit</div>
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
          <h3 className="text-lg font-semibold mb-4">Column Pattern Examples</h3>
          <div className="space-y-3">
            <div className="bg-gray-100 p-3 rounded">
              <div className="font-mono font-bold text-lg mb-2">123</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="text-indigo-600 font-semibold">Col 1</div>
                  <div className="text-2xl font-bold">1</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-600 font-semibold">Col 2</div>
                  <div className="text-2xl font-bold">2</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-semibold">Col 3</div>
                  <div className="text-2xl font-bold">3</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <div className="font-mono font-bold text-lg mb-2">789</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="text-indigo-600 font-semibold">Col 1</div>
                  <div className="text-2xl font-bold">7</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-600 font-semibold">Col 2</div>
                  <div className="text-2xl font-bold">8</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-semibold">Col 3</div>
                  <div className="text-2xl font-bold">9</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {analyzedNumbers.length > 0 && statistics && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Column Mapping Results ({analyzedNumbers.length} numbers)</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4 text-indigo-600">Column 1 (Hundreds)</h4>
              <div className="space-y-2">
                {getTopDigits(statistics.column1Counts).map(([digit, count]) => (
                  <div key={digit} className="flex justify-between items-center">
                    <span className="font-mono font-bold text-lg">{digit}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
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
              <h4 className="font-semibold mb-4 text-purple-600">Column 2 (Tens)</h4>
              <div className="space-y-2">
                {getTopDigits(statistics.column2Counts).map(([digit, count]) => (
                  <div key={digit} className="flex justify-between items-center">
                    <span className="font-mono font-bold text-lg">{digit}</span>
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
              <h4 className="font-semibold mb-4 text-green-600">Column 3 (Units)</h4>
              <div className="space-y-2">
                {getTopDigits(statistics.column3Counts).map(([digit, count]) => (
                  <div key={digit} className="flex justify-between items-center">
                    <span className="font-mono font-bold text-lg">{digit}</span>
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

          <div className="bg-white p-6 rounded-lg border mb-6">
            <h4 className="font-semibold mb-4">Digit Distribution Heatmap</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Digit</th>
                    <th className="text-center p-2 bg-indigo-50">Column 1</th>
                    <th className="text-center p-2 bg-purple-50">Column 2</th>
                    <th className="text-center p-2 bg-green-50">Column 3</th>
                    <th className="text-center p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[0,1,2,3,4,5,6,7,8,9].map(digit => (
                    <tr key={digit} className="border-b">
                      <td className="p-2 font-mono font-bold text-lg">{digit}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded ${
                          getDigitFrequency(digit, statistics.column1Counts) > statistics.total * 0.15
                            ? 'bg-indigo-200 text-indigo-800'
                            : 'bg-gray-100'
                        }`}>
                          {getDigitFrequency(digit, statistics.column1Counts)}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded ${
                          getDigitFrequency(digit, statistics.column2Counts) > statistics.total * 0.15
                            ? 'bg-purple-200 text-purple-800'
                            : 'bg-gray-100'
                        }`}>
                          {getDigitFrequency(digit, statistics.column2Counts)}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded ${
                          getDigitFrequency(digit, statistics.column3Counts) > statistics.total * 0.15
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-100'
                        }`}>
                          {getDigitFrequency(digit, statistics.column3Counts)}
                        </span>
                      </td>
                      <td className="p-2 text-center font-bold">
                        {getDigitFrequency(digit, statistics.column1Counts) +
                         getDigitFrequency(digit, statistics.column2Counts) +
                         getDigitFrequency(digit, statistics.column3Counts)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-semibold mb-4">Detailed Column Mapping</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Number</th>
                    <th className="text-center p-2 bg-indigo-50">Col 1</th>
                    <th className="text-center p-2 bg-purple-50">Col 2</th>
                    <th className="text-center p-2 bg-green-50">Col 3</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedNumbers.slice(0, 20).map((num, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono font-bold">
                        {num.digits.join('')}
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                          {num.columns.c1}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-800 rounded-full font-bold">
                          {num.columns.c2}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-bold">
                          {num.columns.c3}
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
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {Object.keys(statistics.column1Counts).length}
              </div>
              <div className="text-sm text-gray-600">Digits in Column 1</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(statistics.column2Counts).length}
              </div>
              <div className="text-sm text-gray-600">Digits in Column 2</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(statistics.column3Counts).length}
              </div>
              <div className="text-sm text-gray-600">Digits in Column 3</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnMapping;
