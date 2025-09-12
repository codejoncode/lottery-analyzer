import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Pick3Draw {
  date: string;
  midday?: string;
  evening?: string;
  timestamp: number;
}

export interface Pick3Data {
  draws: Pick3Draw[];
  lastUpdated: number;
  source: string;
}

export class Pick3DataManager {
  private dataPath: string;
  private data: Pick3Data;

  constructor() {
    this.dataPath = path.join(__dirname, '../../data/pick3-data.json');
    this.data = {
      draws: [],
      lastUpdated: 0,
      source: 'scraped'
    };
    this.ensureDataDirectory();
    this.loadData();
  }

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.dataPath)) {
        const rawData = fs.readFileSync(this.dataPath, 'utf-8');
        this.data = JSON.parse(rawData);
        console.log(`Loaded ${this.data.draws.length} Pick 3 draws from local storage`);
      } else {
        console.log('No local Pick 3 data found, starting with empty dataset');
      }
    } catch (error) {
      console.error('Error loading Pick 3 data:', error);
      this.data = {
        draws: [],
        lastUpdated: 0,
        source: 'scraped'
      };
    }
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
      console.log(`Saved ${this.data.draws.length} Pick 3 draws to local storage`);
    } catch (error) {
      console.error('Error saving Pick 3 data:', error);
    }
  }

  public addDraws(newDraws: Pick3Draw[]): void {
    const existingDates = new Set(this.data.draws.map(d => d.date));

    for (const newDraw of newDraws) {
      const existingIndex = this.data.draws.findIndex(d => d.date === newDraw.date);

      if (existingIndex >= 0) {
        // Update existing draw
        const existing = this.data.draws[existingIndex];
        this.data.draws[existingIndex] = {
          ...existing,
          midday: newDraw.midday || existing.midday,
          evening: newDraw.evening || existing.evening,
          timestamp: Math.max(existing.timestamp, newDraw.timestamp)
        };
      } else {
        // Add new draw
        this.data.draws.push(newDraw);
      }
    }

    // Sort by date
    this.data.draws.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    this.data.lastUpdated = Date.now();
    this.saveData();
  }

  public getDraws(startDate?: string, endDate?: string): Pick3Draw[] {
    let draws = [...this.data.draws];

    if (startDate) {
      draws = draws.filter(d => d.date >= startDate);
    }

    if (endDate) {
      draws = draws.filter(d => d.date <= endDate);
    }

    return draws;
  }

  public getDrawByDate(date: string): Pick3Draw | undefined {
    return this.data.draws.find(d => d.date === date);
  }

  public getLatestDraw(): Pick3Draw | undefined {
    return this.data.draws[this.data.draws.length - 1];
  }

  public getDataStats(): {
    totalDraws: number;
    completeDraws: number;
    incompleteDraws: number;
    dateRange: { start: string; end: string } | null;
    lastUpdated: number;
  } {
    const completeDraws = this.data.draws.filter(d => d.midday && d.evening).length;
    const incompleteDraws = this.data.draws.filter(d => !d.midday || !d.evening).length;

    let dateRange = null;
    if (this.data.draws.length > 0) {
      dateRange = {
        start: this.data.draws[0].date,
        end: this.data.draws[this.data.draws.length - 1].date
      };
    }

    return {
      totalDraws: this.data.draws.length,
      completeDraws,
      incompleteDraws,
      dateRange,
      lastUpdated: this.data.lastUpdated
    };
  }

  public clearData(): void {
    this.data = {
      draws: [],
      lastUpdated: Date.now(),
      source: 'scraped'
    };
    this.saveData();
  }
}

// Singleton instance
export const pick3DataManager = new Pick3DataManager();
