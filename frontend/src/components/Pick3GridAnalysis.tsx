import React, { useState, useEffect } from 'react';
import { pick3DataManager, type Pick3Draw } from '../services/Pick3DataManager';

interface Pick3Grid {
  id: number;
  numbers: string[][];
  rowStats: { hits: number; drawsOut: number; lastHit: number }[];
  colStats: { hits: number; drawsOut: number; lastHit: number }[];
}

const Pick3GridAnalysis: React.FC = () => {
  const [draws, setDraws] = useState<Pick3Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grids, setGrids] = useState<Pick3Grid[]>([]);
  const [selectedDraws, setSelectedDraws] = useState(14);
  const [savedGrids, setSavedGrids] = useState<Pick3Grid[] | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const allDraws = pick3DataManager.getDraws();
      // Sort from newest to oldest for analysis
      const sortedDraws = allDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDraws(sortedDraws);

      // Load saved grids from localStorage
      const saved = localStorage.getItem('pick3SavedGrids');
      if (saved) {
        setSavedGrids(JSON.parse(saved));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading Pick 3 data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  // Generate the 10 grids with balanced number distribution for Pick 3 (000-999)
  const generateGrids = (): Pick3Grid[] => {
    const grids: Pick3Grid[] = [];
    const numbersPerGrid = 100; // 10x10 grid for Pick 3
    const totalNumbers = 1000; // 000-999

    // Create a more robust distribution algorithm for Pick 3
    const gridAssignments: string[][] = Array.from({ length: 10 }, () => []);

    // First, ensure each grid gets exactly 100 numbers (10x10)
    // We'll use a round-robin approach to distribute numbers evenly

    let numberIndex = 0;
    for (let gridId = 0; gridId < 10; gridId++) {
      for (let i = 0; i < numbersPerGrid && numberIndex < totalNumbers; i++) {
        const number = numberIndex.toString().padStart(3, '0');
        gridAssignments[gridId].push(number);
        numberIndex++;
      }
    }

    // Now we have each grid with 100 numbers, but each number only appears once
    // For Pick 3, we'll distribute each number across 2 grids (instead of 5 like Powerball)
    // This gives us better coverage for the 000-999 range

    for (let num = 0; num < totalNumbers; num++) {
      const number = num.toString().padStart(3, '0');

      // Find which grid this number is currently in
      let currentGrid = -1;
      for (let gridId = 0; gridId < 10; gridId++) {
        if (gridAssignments[gridId].includes(number)) {
          currentGrid = gridId;
          break;
        }
      }

      // Add this number to 1 more random grid (excluding the current one)
      const availableGrids = Array.from({ length: 10 }, (_, i) => i).filter(id => id !== currentGrid);

      if (availableGrids.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableGrids.length);
        const selectedGrid = availableGrids[randomIndex];
        gridAssignments[selectedGrid].push(number);
      }
    }

    // Convert to grid format and sort numbers
    gridAssignments.forEach((numbers, index) => {
      // Remove duplicates and sort
      const uniqueNumbers = [...new Set(numbers)].sort();

      // Create 10x10 grid
      const gridNumbers: string[][] = [];
      for (let row = 0; row < 10; row++) {
        const startIndex = row * 10;
        const endIndex = startIndex + 10;
        gridNumbers.push(uniqueNumbers.slice(startIndex, endIndex));
      }

      grids.push({
        id: index + 1,
        numbers: gridNumbers,
        rowStats: Array(10).fill(null).map(() => ({ hits: 0, drawsOut: 0, lastHit: 0 })),
        colStats: Array(10).fill(null).map(() => ({ hits: 0, drawsOut: 0, lastHit: 0 }))
      });
    });

    return grids;
  };

  // Update grid statistics based on recent draws
  const updateGridStats = (grids: Pick3Grid[], recentDraws: Pick3Draw[]): Pick3Grid[] => {
    return grids.map(grid => {
      const updatedGrid = { ...grid };

      // Reset stats
      updatedGrid.rowStats = Array(10).fill(null).map(() => ({ hits: 0, drawsOut: 0, lastHit: 0 }));
      updatedGrid.colStats = Array(10).fill(null).map(() => ({ hits: 0, drawsOut: 0, lastHit: 0 }));

      recentDraws.forEach((draw, drawIndex) => {
        const midday = draw.midday;
        const evening = draw.evening;

        [midday, evening].forEach(drawType => {
          if (!drawType) return;

          // Check if this draw number appears in the grid
          let foundRow = -1;
          let foundCol = -1;

          for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
              if (grid.numbers[row][col] === drawType) {
                foundRow = row;
                foundCol = col;
                break;
              }
            }
            if (foundRow !== -1) break;
          }

          if (foundRow !== -1 && foundCol !== -1) {
            // Update row stats
            updatedGrid.rowStats[foundRow].hits++;
            updatedGrid.rowStats[foundRow].lastHit = drawIndex;

            // Update column stats
            updatedGrid.colStats[foundCol].hits++;
            updatedGrid.colStats[foundCol].lastHit = drawIndex;
          }
        });
      });

      // Calculate draws out for each row and column
      updatedGrid.rowStats.forEach(stat => {
        stat.drawsOut = recentDraws.length - stat.lastHit;
      });

      updatedGrid.colStats.forEach(stat => {
        stat.drawsOut = recentDraws.length - stat.lastHit;
      });

      return updatedGrid;
    });
  };

  // Test function to verify grid distribution for Pick 3
  const testGridDistribution = (grids: Pick3Grid[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Test 1: Each grid should have exactly 100 numbers (10x10)
    grids.forEach((grid, index) => {
      const totalNumbers = grid.numbers.flat().length;
      if (totalNumbers !== 100) {
        errors.push(`Grid ${index + 1} has ${totalNumbers} numbers, should have 100`);
      }
    });

    // Test 2: Each number 000-999 should appear exactly 2 times across all grids
    const numberCounts = new Map<string, number>();
    for (let num = 0; num <= 999; num++) {
      const number = num.toString().padStart(3, '0');
      numberCounts.set(number, 0);
    }

    grids.forEach(grid => {
      grid.numbers.flat().forEach(num => {
        numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
      });
    });

    let totalAppearances = 0;
    for (let num = 0; num <= 999; num++) {
      const number = num.toString().padStart(3, '0');
      const count = numberCounts.get(number) || 0;
      totalAppearances += count;
      if (count !== 2) {
        errors.push(`Number ${number} appears ${count} times, should appear exactly 2 times`);
      }
    }

    // Test 3: No duplicates within each grid
    grids.forEach((grid, gridIndex) => {
      const numbers = grid.numbers.flat();
      const uniqueNumbers = new Set(numbers);
      if (uniqueNumbers.size !== numbers.length) {
        errors.push(`Grid ${gridIndex + 1} has duplicate numbers`);
      }
    });

    // Test 4: All numbers 000-999 are present
    const allNumbersUsed = new Set<string>();
    grids.forEach(grid => {
      grid.numbers.flat().forEach(num => allNumbersUsed.add(num));
    });

    for (let num = 0; num <= 999; num++) {
      const number = num.toString().padStart(3, '0');
      if (!allNumbersUsed.has(number)) {
        errors.push(`Number ${number} is not used in any grid`);
      }
    }

    // Test 5: Verify total coverage
    const expectedTotalAppearances = 1000 * 2; // 1000 numbers * 2 appearances each
    if (totalAppearances !== expectedTotalAppearances) {
      errors.push(`Total appearances: ${totalAppearances}, expected: ${expectedTotalAppearances}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  useEffect(() => {
    if (draws.length > 0 && grids.length === 0) {
      // Use saved grids if available, otherwise generate new ones
      if (savedGrids && savedGrids.length > 0) {
        setGrids([...savedGrids]);
      } else {
        const initialGrids = generateGrids();
        setGrids(initialGrids);
      }
    }
  }, [draws, savedGrids]);

  useEffect(() => {
    if (grids.length > 0 && draws.length > 0) {
      const recentDraws = draws.slice(0, selectedDraws);
      const updatedGrids = updateGridStats(grids, recentDraws);
      setGrids(updatedGrids);
    }
  }, [grids, draws, selectedDraws]);

  const handleSaveGrids = () => {
    localStorage.setItem('pick3SavedGrids', JSON.stringify(grids));
    setSavedGrids([...grids]);
    alert('Pick 3 grid distribution saved successfully! This will be used as the default.');
  };

  const handleGenerateNew = () => {
    const newGrids = generateGrids();
    setGrids(newGrids);
    setSavedGrids(null);
    localStorage.removeItem('pick3SavedGrids');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pick 3 Grid Analysis</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Run the grid distribution test
  const testResults = grids.length > 0 ? testGridDistribution(grids) : { isValid: false, errors: ['No grids generated yet'] };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <nav className="bg-gray-800 text-white p-4 mb-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="/" className="hover:text-gray-300">Home</a>
            <a href="/analysis" className="hover:text-gray-300">Analysis</a>
            <a href="/column-analysis" className="hover:text-gray-300">Column Analysis</a>
            <a href="/draw-summary" className="hover:text-gray-300">Draw Summary</a>
            <a href="/pick3-pairs" className="hover:text-gray-300">Pairs Analysis</a>
          </div>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pick 3 Grid Analysis</h1>
          <p className="text-gray-600">Analyze number distribution patterns across 10x10 grids for Pick 3 numbers (000-999)</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Draws to Analyze</label>
              <select
                value={selectedDraws}
                onChange={(e) => setSelectedDraws(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={7}>Last 7 draws</option>
                <option value={14}>Last 14 draws</option>
                <option value={30}>Last 30 draws</option>
                <option value={60}>Last 60 draws</option>
                <option value={90}>Last 90 draws</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerateNew}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Generate New Grids
              </button>
              <button
                onClick={handleSaveGrids}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={grids.length === 0}
              >
                Save Distribution
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Total draws analyzed: {draws.length}
            </div>
          </div>
        </div>

        {/* Grid Distribution Test Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Grid Distribution Test Results
            {savedGrids && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Saved Distribution Active</span>}
          </h2>

          {testResults.isValid ? (
            <div className="text-green-600">
              ✅ All tests passed! Grid distribution is correct:
              <ul className="mt-2 ml-4 list-disc">
                <li>Each of the 10 grids contains exactly 100 numbers (10×10)</li>
                <li>Each Pick 3 number (000-999) appears exactly 2 times across all grids</li>
                <li>No duplicate numbers within any single grid</li>
                <li>All 1000 Pick 3 numbers are represented</li>
              </ul>
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Test failures found:
              <ul className="mt-2 ml-4 list-disc">
                {testResults.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Grids Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grids.map(grid => (
            <div key={grid.id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">Grid {grid.id}</h3>

              {/* Grid Numbers */}
              <div className="grid grid-cols-10 gap-1 mb-4">
                {grid.numbers.map((row, rowIndex) =>
                  row.map((number, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="w-8 h-8 bg-blue-100 text-blue-800 rounded text-xs flex items-center justify-center font-mono"
                      title={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                    >
                      {number}
                    </div>
                  ))
                )}
              </div>

              {/* Row Statistics */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Row Statistics</h4>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {grid.rowStats.map((stat, index) => (
                    <div key={index} className="bg-gray-50 p-1 rounded text-center">
                      <div>R{index + 1}</div>
                      <div className="text-green-600">H:{stat.hits}</div>
                      <div className="text-red-600">O:{stat.drawsOut}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column Statistics */}
              <div>
                <h4 className="font-medium mb-2">Column Statistics</h4>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {grid.colStats.map((stat, index) => (
                    <div key={index} className="bg-gray-50 p-1 rounded text-center">
                      <div>C{index + 1}</div>
                      <div className="text-green-600">H:{stat.hits}</div>
                      <div className="text-red-600">O:{stat.drawsOut}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        {grids.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{grids.length}</div>
                <div className="text-sm text-gray-600">Total Grids</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {grids.reduce((sum, grid) => sum + grid.rowStats.reduce((rowSum, stat) => rowSum + stat.hits, 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Hits</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(grids.reduce((sum, grid) => sum + grid.rowStats.reduce((rowSum, stat) => rowSum + stat.drawsOut, 0), 0) / grids.length)}
                </div>
                <div className="text-sm text-gray-600">Avg Draws Out</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {grids.filter(grid => grid.rowStats.some(stat => stat.lastHit === 0)).length}
                </div>
                <div className="text-sm text-gray-600">Hot Grids</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pick3GridAnalysis;