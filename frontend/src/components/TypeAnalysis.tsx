import React, { useState, useMemo } from 'react';

interface TypeAnalysisProps {
  className?: string;
}

interface NumberAnalysis {
  digits: number[];
  sum: number;
  parityPattern: string;
  highLowPattern: string;
}

const TypeAnalysis: React.FC<TypeAnalysisProps> = ({ className = '' }) => {
  const [inputNumbers, setInputNumbers] = useState<string>('');

  const analyzedNumbers = useMemo(() => {
    if (!inputNumbers.trim()) return [];

    const lines = inputNumbers.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const digits = line.replace(/\D/g, '').slice(0, 3).split('').map(d => parseInt(d));
      if (digits.length !== 3 || digits.some(isNaN)) return null;

      const sum = digits.reduce((a, b) => a + b, 0);
      const parityPattern = digits.map(d => d % 2 === 0 ? 'E' : 'O').join('');
      const highLowPattern = digits.map(d => d >= 5 ? 'H' : 'L').join('');

      return {
        digits,
        sum,
        parityPattern,
        highLowPattern
      } as NumberAnalysis;
    }).filter(Boolean) as NumberAnalysis[];
  }, [inputNumbers]);

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

    return {
      total: analyzedNumbers.length,
      parityCounts,
      highLowCounts
    };
  }, [analyzedNumbers]);

  const parityPatterns = [
    { pattern: 'EEE', description: 'All Even', example: '246' },
    { pattern: 'EEO', description: 'Two Even, One Odd', example: '248' },
    { pattern: 'EOE', description: 'Even-Odd-Even', example: '257' },
    { pattern: 'EOO', description: 'One Even, Two Odd', example: '257' },
    { pattern: 'OEE', description: 'Odd-Even-Even', example: '157' },
    { pattern: 'OEO', description: 'Odd-Even-Odd', example: '157' },
    { pattern: 'OOE', description: 'Two Odd, One Even', example: '157' },
    { pattern: 'OOO', description: 'All Odd', example: '135' }
  ];

  const highLowPatterns = [
    { pattern: 'HHH', description: 'All High (5-9)', example: '678' },
    { pattern: 'HHL', description: 'Two High, One Low', example: '569' },
    { pattern: 'HLH', description: 'High-Low-High', example: '569' },
    { pattern: 'HLL', description: 'One High, Two Low', example: '149' },
    { pattern: 'LHH', description: 'Low-High-High', example: '149' },
    { pattern: 'LHL', description: 'Low-High-Low', example: '149' },
    { pattern: 'LLH', description: 'Two Low, One High', example: '149' },
    { pattern: 'LLL', description: 'All Low (0-4)', example: '123' }
  ];

  return (
    <div className={`type-analysis ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">🔍 Inspector 3 - Type Analysis</h2>
        <p className="text-gray-600 mb-4">
          Analyze Pick 3 numbers by their type patterns: Even/Odd (parity) and High/Low (5-9 vs 0-4).
          Enter one number per line in the text area below.
        </p>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">How Type Analysis Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Parity Patterns:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>E = Even (0,2,4,6,8)</li>
                <li>O = Odd (1,3,5,7,9)</li>
              </ul>
            </div>
            <div>
              <strong>High/Low Patterns:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>H = High (5,6,7,8,9)</li>
                <li>L = Low (0,1,2,3,4)</li>
              </ul>
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
          <h3 className="text-lg font-semibold mb-4">Pattern Reference</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Parity Patterns (8 total)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {parityPatterns.map(({ pattern, description, example }) => (
                  <div key={pattern} className="bg-gray-100 p-2 rounded">
                    <div className="font-mono font-bold">{pattern}</div>
                    <div className="text-xs text-gray-600">{description}</div>
                    <div className="text-xs">Ex: {example}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">High/Low Patterns (8 total)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {highLowPatterns.map(({ pattern, description, example }) => (
                  <div key={pattern} className="bg-gray-100 p-2 rounded">
                    <div className="font-mono font-bold">{pattern}</div>
                    <div className="text-xs text-gray-600">{description}</div>
                    <div className="text-xs">Ex: {example}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {analyzedNumbers.length > 0 && statistics && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Analysis Results ({analyzedNumbers.length} numbers)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4">Parity Pattern Distribution</h4>
              <div className="space-y-2">
                {Object.entries(statistics.parityCounts)
                  .sort(([,a], [,b]) => b - a)
                  .map(([pattern, count]) => (
                  <div key={pattern} className="flex justify-between items-center">
                    <span className="font-mono font-bold">{pattern}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / statistics.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm w-12 text-right">
                        {count} ({((count / statistics.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold mb-4">High/Low Pattern Distribution</h4>
              <div className="space-y-2">
                {Object.entries(statistics.highLowCounts)
                  .sort(([,a], [,b]) => b - a)
                  .map(([pattern, count]) => (
                  <div key={pattern} className="flex justify-between items-center">
                    <span className="font-mono font-bold">{pattern}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(count / statistics.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm w-12 text-right">
                        {count} ({((count / statistics.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white p-6 rounded-lg border">
            <h4 className="font-semibold mb-4">Detailed Analysis</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Number</th>
                    <th className="text-left p-2">Parity</th>
                    <th className="text-left p-2">High/Low</th>
                    <th className="text-left p-2">Sum</th>
                  </tr>
                </thead>
                <tbody>
                  {analyzedNumbers.slice(0, 20).map((num, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-mono font-bold">
                        {num.digits.join('')}
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {num.parityPattern}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {num.highLowPattern}
                        </span>
                      </td>
                      <td className="p-2">{num.sum}</td>
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
        </div>
      )}
    </div>
  );
};

export default TypeAnalysis;
