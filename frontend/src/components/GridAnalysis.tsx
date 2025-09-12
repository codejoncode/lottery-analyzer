import React, { useState, useEffect } from 'react';
import { Link } from "react-router";

interface Draw {
  date: string;
  white_balls: number[];
  red_ball: number;
  power_play: string;
}

interface Grid {
  id: number;
  numbers: number[][];
  rowStats: { hits: number; drawsOut: number; lastHit: number }[];
  colStats: { hits: number; drawsOut: number; lastHit: number }[];
}

const GridAnalysis: React.FC = () => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [selectedDraws, setSelectedDraws] = useState(14);
  const [showPreviousStates, setShowPreviousStates] = useState(false);
  const [savedGrids, setSavedGrids] = useState<Grid[] | null>(null);

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

        // Sort from latest to oldest (same as other components)
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

  // Generate the 10 grids with balanced number distribution
  const generateGrids = (): Grid[] => {
    const grids: Grid[] = [];
    const numbersPerGrid = 35; // 5x7 grid
    const totalNumbers = 70;
    const appearancesPerNumber = 5;

    // Create a more robust distribution algorithm
    const gridAssignments: number[][] = Array.from({ length: 10 }, () => []);

    // First, ensure each grid gets exactly 35 numbers
    // We'll use a round-robin approach to distribute numbers evenly

    let numberIndex = 1;
    for (let gridId = 0; gridId < 10; gridId++) {
      for (let i = 0; i < numbersPerGrid && numberIndex <= totalNumbers; i++) {
        gridAssignments[gridId].push(numberIndex);
        numberIndex++;
      }
    }

    // Now we have each grid with 35 numbers, but each number only appears once
    // We need to add more appearances for each number to reach 5 total appearances

    // For each number, add it to 4 more random grids (it already appears in 1)
    for (let num = 1; num <= totalNumbers; num++) {
      // Find which grid this number is currently in
      let currentGrid = -1;
      for (let gridId = 0; gridId < 10; gridId++) {
        if (gridAssignments[gridId].includes(num)) {
          currentGrid = gridId;
          break;
        }
      }

      // Add this number to 4 more random grids (excluding the current one)
      const availableGrids = Array.from({ length: 10 }, (_, i) => i).filter(id => id !== currentGrid);
      const gridsToAdd = [];

      // Randomly select 4 more grids
      for (let i = 0; i < 4; i++) {
        if (availableGrids.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableGrids.length);
        const selectedGrid = availableGrids.splice(randomIndex, 1)[0];
        gridsToAdd.push(selectedGrid);
      }

      // Add the number to the selected grids
      gridsToAdd.forEach(gridId => {
        if (!gridAssignments[gridId].includes(num)) {
          gridAssignments[gridId].push(num);
        }
      });
    }

    // Now create the actual grid objects
    for (let gridId = 0; gridId < 10; gridId++) {
      let gridNumbers = [...gridAssignments[gridId]];

      // Ensure each grid has exactly 35 numbers
      while (gridNumbers.length < numbersPerGrid) {
        // Add a random number that doesn't already exist in this grid
        let randomNum;
        do {
          randomNum = Math.floor(Math.random() * totalNumbers) + 1;
        } while (gridNumbers.includes(randomNum));
        gridNumbers.push(randomNum);
      }

      // If we have more than 35, remove extras
      if (gridNumbers.length > numbersPerGrid) {
        gridNumbers = gridNumbers.slice(0, numbersPerGrid);
      }

      // Shuffle the numbers to randomize their positions
      for (let i = gridNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gridNumbers[i], gridNumbers[j]] = [gridNumbers[j], gridNumbers[i]];
      }

      // Create 5x7 grid layout
      const gridLayout: number[][] = [];
      for (let row = 0; row < 5; row++) {
        gridLayout[row] = gridNumbers.slice(row * 7, (row + 1) * 7);
      }

      // Initialize row and column statistics
      const rowStats = Array.from({ length: 5 }, () => ({
        hits: 0,
        drawsOut: 0,
        lastHit: -1
      }));

      const colStats = Array.from({ length: 7 }, () => ({
        hits: 0,
        drawsOut: 0,
        lastHit: -1
      }));

      grids.push({
        id: gridId,
        numbers: gridLayout,
        rowStats,
        colStats
      });
    }

    return grids;
  };

  // Update grid statistics based on recent draws
  const updateGridStats = (grids: Grid[], recentDraws: Draw[]): Grid[] => {
    const hitNumbers = new Set<number>();

    // Collect all numbers that hit in the selected number of recent draws
    recentDraws.forEach(draw => {
      draw.white_balls.forEach(num => hitNumbers.add(num));
    });

    return grids.map(grid => {
      const updatedGrid = { ...grid };

      // Reset statistics
      updatedGrid.rowStats = updatedGrid.rowStats.map(() => ({
        hits: 0,
        drawsOut: 0,
        lastHit: -1
      }));

      updatedGrid.colStats = updatedGrid.colStats.map(() => ({
        hits: 0,
        drawsOut: 0,
        lastHit: -1
      }));

      // Count hits in each row and column
      updatedGrid.numbers.forEach((row, rowIndex) => {
        row.forEach((num, colIndex) => {
          if (hitNumbers.has(num)) {
            updatedGrid.rowStats[rowIndex].hits++;
            updatedGrid.colStats[colIndex].hits++;
          }
        });
      });

      return updatedGrid;
    });
  };

  // Calculate draws out for each number
  const getDrawsOut = (allDraws: Draw[]): Map<number, number> => {
    const drawsOut = new Map<number, number>();

    // Initialize all numbers 1-70 with draws out = total draws (never appeared)
    for (let num = 1; num <= 70; num++) {
      drawsOut.set(num, allDraws.length);
    }

    // Find the most recent appearance for each number
    for (let drawIndex = 0; drawIndex < allDraws.length; drawIndex++) {
      const draw = allDraws[drawIndex];
      draw.white_balls.forEach(num => {
        if (!drawsOut.has(num) || drawsOut.get(num)! > drawIndex) {
          drawsOut.set(num, drawIndex);
        }
      });
    }

    return drawsOut;
  };

  // Test function for getDrawsOut
  const testGetDrawsOut = () => {
    console.log('=== GET DRAWS OUT TEST ===');

    // Test with sample data
    const sampleDraws: Draw[] = [
      { date: '2025-09-06', white_balls: [11, 23, 44, 61, 62], red_ball: 17, power_play: '3X' },
      { date: '2025-09-03', white_balls: [3, 16, 29, 61, 69], red_ball: 22, power_play: '2X' },
      { date: '2025-09-01', white_balls: [8, 23, 25, 40, 53], red_ball: 5, power_play: '2X' },
      { date: '2025-08-30', white_balls: [1, 15, 27, 44, 67], red_ball: 12, power_play: '4X' },
      { date: '2025-08-28', white_balls: [11, 18, 33, 45, 69], red_ball: 8, power_play: '3X' }
    ];

    const drawsOutMap = getDrawsOut(sampleDraws);

    console.log('\n=== SAMPLE DATA DRAWS OUT RESULTS ===');
    for (let num = 1; num <= 10; num++) { // Test first 10 numbers
      const drawsOut = drawsOutMap.get(num) || 0;
      console.log(`Number ${num}: draws out = ${drawsOut}`);
    }

    // Test specific cases
    console.log('\n=== SPECIFIC TEST CASES ===');
    const testCases = [
      { num: 11, expected: 0, reason: 'Appears in draw 0 (most recent)' },
      { num: 69, expected: 1, reason: 'Appears in draw 1' },
      { num: 16, expected: 1, reason: 'Appears in draw 1' },
      { num: 61, expected: 0, reason: 'Appears in draw 0 and draw 1, should be 0 (most recent)' },
      { num: 23, expected: 0, reason: 'Appears in draw 0 and draw 2, should be 0 (most recent)' },
      { num: 44, expected: 0, reason: 'Appears in draw 0 and draw 3, should be 0 (most recent)' },
      { num: 99, expected: 5, reason: 'Never appears in sample data' }
    ];

    testCases.forEach((test, index) => {
      const actual = drawsOutMap.get(test.num) || 0;
      const passed = actual === test.expected;
      console.log(`Test ${index + 1} - Number ${test.num}: Expected=${test.expected}, Got=${actual}, ${passed ? '✓' : '✗'} (${test.reason})`);
    });

    console.log('\n=== REAL DATA DRAWS OUT (FIRST 20 NUMBERS) ===');
    const realDrawsOutMap = getDrawsOut(draws);
    for (let num = 1; num <= 20; num++) {
      const drawsOut = realDrawsOutMap.get(num) || 0;
      console.log(`Number ${num}: draws out = ${drawsOut}`);
    }
  };

  // Test function to verify grid distribution
  const testGridDistribution = (grids: Grid[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Test 1: Each grid should have exactly 35 numbers
    grids.forEach((grid, index) => {
      const totalNumbers = grid.numbers.flat().length;
      if (totalNumbers !== 35) {
        errors.push(`Grid ${index + 1} has ${totalNumbers} numbers, should have 35`);
      }
    });

    // Test 2: Each number 1-70 should appear exactly 5 times across all grids
    const numberCounts = new Map<number, number>();
    for (let num = 1; num <= 70; num++) {
      numberCounts.set(num, 0);
    }

    grids.forEach(grid => {
      grid.numbers.flat().forEach(num => {
        numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
      });
    });

    for (let num = 1; num <= 70; num++) {
      const count = numberCounts.get(num) || 0;
      if (count !== 5) {
        errors.push(`Number ${num} appears ${count} times, should appear exactly 5 times`);
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

    // Test 4: All numbers 1-70 are present
    const allNumbersUsed = new Set<number>();
    grids.forEach(grid => {
      grid.numbers.flat().forEach(num => allNumbersUsed.add(num));
    });

    for (let num = 1; num <= 70; num++) {
      if (!allNumbersUsed.has(num)) {
        errors.push(`Number ${num} is not used in any grid`);
      }
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
  }, [grids, selectedDraws, draws]);

  const getHitNumbers = (numDraws: number): Set<number> => {
    const hitNumbers = new Set<number>();
    const recentDraws = draws.slice(0, numDraws);
    recentDraws.forEach(draw => {
      draw.white_balls.forEach(num => hitNumbers.add(num));
    });
    return hitNumbers;
  };

  // Load saved distribution if available
  useEffect(() => {
    if (savedGrids && savedGrids.length > 0) {
      setGrids([...savedGrids]);
    }
  }, [savedGrids]);

  const recentDraws = draws.slice(0, selectedDraws);
  const hitNumbers = getHitNumbers(selectedDraws);
  const drawsOutMap = getDrawsOut(draws);

  // Run the grid distribution test
  const testResults = grids.length > 0 ? testGridDistribution(grids) : { isValid: false, errors: ['No grids generated yet'] };

  // Save valid distribution
  const saveValidDistribution = () => {
    if (testResults.isValid) {
      setSavedGrids([...grids]);
      alert('Grid distribution saved successfully! This will be used as the default.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

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
        <h1 className="text-3xl font-bold mb-4">
          Grid Analysis - {showPreviousStates ? 'Previous States' : 'Hit Tracking'}
        </h1>

        <button
          onClick={testGetDrawsOut}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Draws Out Calculations (Check Console)
        </button>

        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">How to Read the Grid:</h2>
          <div className="text-sm text-gray-700">
            <div><strong>Top number:</strong> The Powerball number (1-70)</div>
            <div><strong>Bottom number:</strong> Draws out (how many draws since it last appeared)</div>
            <div><strong>"Just":</strong> Number appeared in the most recent draw</div>
            <div><strong>Red background:</strong> Number hit in the last {selectedDraws} draws</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">All Numbers (1-70) - Draws Out:</h2>
          <div className="grid grid-cols-10 gap-2 text-sm">
            {Array.from({ length: 70 }, (_, i) => i + 1).map(num => {
              const drawsOut = drawsOutMap.get(num) || 0;
              const isHit = hitNumbers.has(num);
              return (
                <div key={num} className={`p-2 rounded text-center ${isHit ? 'bg-red-200' : 'bg-white'} border`}>
                  <div className="font-bold">{num}</div>
                  <div className="text-xs text-gray-600">{drawsOut}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <label className="font-semibold">Analyze last</label>
            <input
              type="number"
              min="1"
              max="100"
              value={selectedDraws}
              onChange={(e) => setSelectedDraws(parseInt(e.target.value) || 14)}
              className="border border-gray-300 rounded px-3 py-1 w-20"
            />
            <label className="font-semibold">draws</label>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showPreviousStates}
                onChange={(e) => setShowPreviousStates(e.target.checked)}
                className="rounded"
              />
              <span className="font-semibold">Show previous states for verification</span>
            </label>
            <button
              onClick={() => {
                if (savedGrids && savedGrids.length > 0) {
                  const useSaved = confirm('You have a saved valid distribution. Use saved distribution instead of generating new one?');
                  if (useSaved) {
                    setGrids([...savedGrids]);
                    return;
                  }
                }
                if (draws.length > 0) {
                  const newGrids = generateGrids();
                  setGrids(newGrids);
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold"
            >
              {savedGrids ? 'Load Saved / Regenerate' : 'Regenerate Grids'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Distribution Test Results */}
      <div className="mb-6">
        <div className={`rounded-lg p-4 shadow-sm ${testResults.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${testResults.isValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
              Grid Distribution Test Results
              {savedGrids && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Saved Distribution Active</span>}
            </h2>
            {testResults.isValid && (
              <div className="flex gap-2">
                <button
                  onClick={saveValidDistribution}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold"
                >
                  💾 Save Valid Distribution
                </button>
                {savedGrids && (
                  <button
                    onClick={() => {
                      setSavedGrids(null);
                      alert('Saved distribution cleared. You can now generate new distributions.');
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold"
                  >
                    🗑️ Clear Saved
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="text-sm">
            {testResults.isValid ? (
              <div className="text-green-700">
                ✅ All tests passed! Grid distribution is correct:
                <ul className="mt-2 ml-4 list-disc">
                  <li>Each of the 10 grids has exactly 35 numbers (5×7 layout)</li>
                  <li>Each number 1-70 appears exactly 5 times across all grids</li>
                  <li>No duplicates within any single grid</li>
                  <li>All 70 numbers are properly distributed</li>
                  <li>Total: 70 numbers × 5 appearances = 350 placements</li>
                  <li>10 grids × 35 numbers each = 350 total placements</li>
                </ul>
                <div className="mt-3 p-2 bg-green-100 rounded">
                  <strong>Ready to save:</strong> Click "Save Valid Distribution" to preserve this working configuration.
                </div>
              </div>
            ) : (
              <div className="text-red-700">
                ❌ Test failures found:
                <ul className="mt-2 ml-4 list-disc">
                  {testResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Display */}
      <div className="space-y-8">
        {grids.map((grid, gridIndex) => (
          <div key={grid.id} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Grid {grid.id + 1}</h2>
              <div className="text-sm text-gray-600">
                {grid.numbers.flat().length} numbers •
                {showPreviousStates ? 'Previous state' : `${hitNumbers.size} hits in last ${selectedDraws} draws`}
              </div>
            </div>

            {/* Grid Layout */}
            <div className="mb-6">
              <div className="grid grid-cols-7 gap-2 max-w-3xl mx-auto">
                {grid.numbers.map((row, rowIndex) =>
                  row.map((num, colIndex) => {
                    const isHit = hitNumbers.has(num);
                    const drawsOut = drawsOutMap.get(num) || 0;
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          w-16 h-16 border-2 flex flex-col items-center justify-center font-bold text-sm rounded
                          ${showPreviousStates
                            ? 'bg-gray-100 text-gray-800 border-gray-300'
                            : isHit
                              ? 'bg-red-500 text-white border-red-600'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          }
                        `}
                      >
                        <div className="text-lg font-bold">{num}</div>
                        <div className={`text-xs ${showPreviousStates ? 'text-gray-600' : isHit ? 'text-red-100' : 'text-gray-500'}`}>
                          {drawsOut === 0 ? 'Just' : drawsOut}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {showPreviousStates && (
                <div className="text-center mt-2 text-sm text-gray-600">
                  Showing grid state before hits are applied
                </div>
              )}
            </div>

            {/* Row and Column Statistics */}
            <div className="grid grid-cols-2 gap-6">
              {/* Row Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Row Statistics</h3>
                <div className="space-y-2">
                  {grid.rowStats.map((row, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Row {index + 1}:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          row.hits === 0 ? 'bg-red-100 text-red-800' :
                          row.hits <= 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {row.hits} hits
                        </span>
                        <span className="text-sm text-gray-600">
                          ({((row.hits / 7) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Column Statistics</h3>
                <div className="space-y-2">
                  {grid.colStats.map((col, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">Col {index + 1}:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          col.hits === 0 ? 'bg-red-100 text-red-800' :
                          col.hits <= 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {col.hits} hits
                        </span>
                        <span className="text-sm text-gray-600">
                          ({((col.hits / 5) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Empty Rows/Columns Analysis */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Empty Rows & Columns Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Empty Rows:</h4>
                  <div className="text-sm">
                    {grid.rowStats.filter(row => row.hits === 0).length > 0 ? (
                      <span className="text-red-600 font-semibold">
                        Rows {grid.rowStats
                          .map((row, index) => row.hits === 0 ? index + 1 : null)
                          .filter(Boolean)
                          .join(', ')} have no hits
                      </span>
                    ) : (
                      <span className="text-green-600">All rows have hits</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Empty Columns:</h4>
                  <div className="text-sm">
                    {grid.colStats.filter(col => col.hits === 0).length > 0 ? (
                      <span className="text-red-600 font-semibold">
                        Columns {grid.colStats
                          .map((col, index) => col.hits === 0 ? index + 1 : null)
                          .filter(Boolean)
                          .join(', ')} have no hits
                      </span>
                    ) : (
                      <span className="text-green-600">All columns have hits</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Overall Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{grids.length}</div>
            <div className="text-sm text-blue-800">Total Grids</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{hitNumbers.size}</div>
            <div className="text-sm text-green-800">Numbers Hit</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {grids.reduce((sum, grid) => sum + grid.rowStats.filter(row => row.hits === 0).length, 0)}
            </div>
            <div className="text-sm text-yellow-800">Empty Rows Total</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {grids.reduce((sum, grid) => sum + grid.colStats.filter(col => col.hits === 0).length, 0)}
            </div>
            <div className="text-sm text-red-800">Empty Columns Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridAnalysis;
