// Browser-compatible Pick3DataManager using localStorage instead of fs
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
  private data: Pick3Data;
  private readonly STORAGE_KEY = 'pick3-data';

  constructor() {
    this.data = {
      draws: [],
      lastUpdated: 0,
      source: 'scraped'
    };
    this.loadData();
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
        console.log(`Loaded ${this.data.draws.length} Pick 3 draws from localStorage`);
      } else {
        console.log('No local Pick 3 data found, starting with empty dataset');
      }
    } catch (error) {
      console.error('Error loading Pick 3 data from localStorage:', error);
      this.data = {
        draws: [],
        lastUpdated: 0,
        source: 'scraped'
      };
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      console.log(`Saved ${this.data.draws.length} Pick 3 draws to localStorage`);
    } catch (error) {
      console.error('Error saving Pick 3 data to localStorage:', error);
    }
  }

  public addDraws(newDraws: Pick3Draw[]): void {
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
