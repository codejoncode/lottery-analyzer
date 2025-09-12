import type { Draw } from './scoringSystem';

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalDraws: number;
    validDraws: number;
    invalidDraws: number;
    dateRange: { start: string; end: string } | null;
    numberRange: { min: number; max: number };
  };
}

export interface DataExportOptions {
  format: 'csv' | 'json';
  includeMetadata: boolean;
  dateRange?: { start: string; end: string };
  compress: boolean;
}

export const parseCSV = async (): Promise<Draw[]> => {
  try {
    const response = await fetch('/powerball.txt');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    return parseCSVFromText(csvText);
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
};

export const parseCSVFromText = (csvText: string): Draw[] => {
  const lines = csvText.trim().split('\n');
  const draws: Draw[] = [];

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length >= 3) {
      try {
        const date = parts[0];
        const whiteBallsStr = parts[1];
        const redBall = parseInt(parts[2]);
        const powerPlay = parts[3] || '1X';

        // Parse white balls (format: "18|30|40|48|52")
        const whiteBalls = whiteBallsStr.split('|').map(num => parseInt(num.trim()));

        if (whiteBalls.length === 5 && !isNaN(redBall)) {
          draws.push({
            date,
            white_balls: whiteBalls,
            red_ball: redBall,
            power_play: powerPlay
          });
        }
      } catch (error) {
        console.warn(`⚠️ Skipping invalid line: ${line}`);
      }
    }
  }

  return draws;
};

// Enhanced data validation with comprehensive checks
export const validateDrawData = (draws: Draw[]): DataValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validDraws = 0;

  // Basic validation rules
  const WHITE_BALL_RANGE = { min: 1, max: 69 };
  const RED_BALL_RANGE = { min: 1, max: 26 };
  const REQUIRED_WHITE_BALLS = 5;

  // Track seen dates and numbers for duplicate detection
  const seenDates = new Set<string>();
  const seenCombinations = new Set<string>();

  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;
  let minNumber = Infinity;
  let maxNumber = -Infinity;

  draws.forEach((draw, index) => {
    let isValidDraw = true;

    // Validate date format
    if (!draw.date || !isValidDate(draw.date)) {
      errors.push(`Draw ${index + 1}: Invalid date format "${draw.date}"`);
      isValidDraw = false;
    } else {
      // Check for duplicate dates
      if (seenDates.has(draw.date)) {
        warnings.push(`Draw ${index + 1}: Duplicate date "${draw.date}"`);
      }
      seenDates.add(draw.date);

      // Track date range
      const drawDate = new Date(draw.date);
      if (!earliestDate || drawDate < earliestDate) earliestDate = drawDate;
      if (!latestDate || drawDate > latestDate) latestDate = drawDate;
    }

    // Validate white balls
    if (!draw.white_balls || draw.white_balls.length !== REQUIRED_WHITE_BALLS) {
      errors.push(`Draw ${index + 1}: Must have exactly ${REQUIRED_WHITE_BALLS} white balls`);
      isValidDraw = false;
    } else {
      // Check for duplicates within white balls
      const uniqueWhiteBalls = new Set(draw.white_balls);
      if (uniqueWhiteBalls.size !== draw.white_balls.length) {
        errors.push(`Draw ${index + 1}: Duplicate white ball numbers`);
        isValidDraw = false;
      }

      // Validate number ranges
      draw.white_balls.forEach(num => {
        if (num < WHITE_BALL_RANGE.min || num > WHITE_BALL_RANGE.max) {
          errors.push(`Draw ${index + 1}: White ball ${num} out of range (${WHITE_BALL_RANGE.min}-${WHITE_BALL_RANGE.max})`);
          isValidDraw = false;
        }
        minNumber = Math.min(minNumber, num);
        maxNumber = Math.max(maxNumber, num);
      });
    }

    // Validate red ball
    if (!draw.red_ball || draw.red_ball < RED_BALL_RANGE.min || draw.red_ball > RED_BALL_RANGE.max) {
      errors.push(`Draw ${index + 1}: Red ball ${draw.red_ball} out of range (${RED_BALL_RANGE.min}-${RED_BALL_RANGE.max})`);
      isValidDraw = false;
    } else {
      minNumber = Math.min(minNumber, draw.red_ball);
      maxNumber = Math.max(maxNumber, draw.red_ball);
    }

    // Check for duplicate combinations
    if (isValidDraw) {
      const combinationKey = [...draw.white_balls.sort(), draw.red_ball].join('-');
      if (seenCombinations.has(combinationKey)) {
        warnings.push(`Draw ${index + 1}: Duplicate combination detected`);
      }
      seenCombinations.add(combinationKey);
    }

    if (isValidDraw) validDraws++;
  });

  // Additional integrity checks
  if (draws.length > 0) {
    // Check for gaps in dates (more than 3 days between draws)
    const sortedDraws = draws
      .filter(d => isValidDate(d.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (let i = 1; i < sortedDraws.length; i++) {
      const prevDate = new Date(sortedDraws[i - 1].date);
      const currDate = new Date(sortedDraws[i].date);
      const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 4) { // Allow for weekends
        warnings.push(`Gap detected: ${daysDiff.toFixed(0)} days between ${sortedDraws[i - 1].date} and ${sortedDraws[i].date}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalDraws: draws.length,
      validDraws,
      invalidDraws: draws.length - validDraws,
      dateRange: (earliestDate && latestDate) ? {
        start: (earliestDate as Date).toISOString().split('T')[0],
        end: (latestDate as Date).toISOString().split('T')[0]
      } : null,
      numberRange: { min: minNumber === Infinity ? 0 : minNumber, max: maxNumber === -Infinity ? 0 : maxNumber }
    }
  };
};

// Helper function to validate date format
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString.slice(0, 10));
};

// Export data in various formats
export const exportDrawData = (draws: Draw[], options: DataExportOptions): string => {
  const filteredDraws = options.dateRange
    ? draws.filter(draw => {
        const drawDate = new Date(draw.date);
        const startDate = new Date(options.dateRange!.start);
        const endDate = new Date(options.dateRange!.end);
        return drawDate >= startDate && drawDate <= endDate;
      })
    : draws;

  switch (options.format) {
    case 'csv':
      return exportToCSV(filteredDraws, options.includeMetadata);
    case 'json':
      return exportToJSON(filteredDraws, options.includeMetadata);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

const exportToCSV = (draws: Draw[], includeMetadata: boolean): string => {
  let csv = 'Date,White Balls,Red Ball,Power Play';

  if (includeMetadata) {
    csv += ',Sum,Parity,High/Low Ratio';
  }
  csv += '\n';

  draws.forEach(draw => {
    const whiteBallsStr = draw.white_balls.join('|');
    let row = `${draw.date},${whiteBallsStr},${draw.red_ball},${draw.power_play}`;

    if (includeMetadata) {
      const sum = draw.white_balls.reduce((a, b) => a + b, 0);
      const odds = draw.white_balls.filter(n => n % 2 === 1).length;
      const highCount = draw.white_balls.filter(n => n > 34).length; // Assuming 35 is midpoint
      row += `,${sum},${odds}/5,${highCount}/5`;
    }

    csv += row + '\n';
  });

  return csv;
};

const exportToJSON = (draws: Draw[], includeMetadata: boolean): string => {
  const data = includeMetadata ? draws.map(draw => ({
    ...draw,
    metadata: {
      sum: draw.white_balls.reduce((a, b) => a + b, 0),
      parity: `${draw.white_balls.filter(n => n % 2 === 1).length}/5`,
      highLowRatio: `${draw.white_balls.filter(n => n > 34).length}/5`
    }
  })) : draws;

  return JSON.stringify({
    exportDate: new Date().toISOString(),
    totalDraws: draws.length,
    data
  }, null, 2);
};

// Import data from file
export const importDrawData = async (file: File): Promise<Draw[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
          const draws = parseCSVFromText(content);
          resolve(draws);
        } else if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content);
          // Handle different JSON formats
          const draws = Array.isArray(jsonData) ? jsonData :
                       jsonData.data ? jsonData.data : [];
          resolve(draws);
        } else {
          reject(new Error('Unsupported file format. Please use CSV, TXT, or JSON files.'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Data integrity repair suggestions
export const suggestDataRepairs = (validationResult: DataValidationResult): string[] => {
  const suggestions: string[] = [];

  if (validationResult.errors.length > 0) {
    suggestions.push('🔧 Fix validation errors first before proceeding with repairs');
  }

  if (validationResult.warnings.some(w => w.includes('Duplicate date'))) {
    suggestions.push('📅 Remove or merge duplicate date entries');
  }

  if (validationResult.warnings.some(w => w.includes('Duplicate combination'))) {
    suggestions.push('🎯 Review duplicate combinations for data integrity');
  }

  if (validationResult.warnings.some(w => w.includes('Gap detected'))) {
    suggestions.push('📊 Fill missing draw data or verify date continuity');
  }

  if (validationResult.stats.invalidDraws > 0) {
    suggestions.push(`🧹 Clean ${validationResult.stats.invalidDraws} invalid records`);
  }

  return suggestions;
};
