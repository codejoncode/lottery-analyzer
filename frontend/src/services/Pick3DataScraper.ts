import type { Pick3Draw } from './Pick3DataManager';

export interface ScraperConfig {
  baseUrl: string;
  state: string;
  timeout: number;
  retryAttempts: number;
  delayBetweenRequests: number;
  extendedHistoricalMode: boolean;
  maxHistoricalYears: number;
}

export class Pick3DataScraper {
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://www.lotteryusa.com',
      state: config.state || 'new-york',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      delayBetweenRequests: config.delayBetweenRequests || 500,
      extendedHistoricalMode: config.extendedHistoricalMode || false,
      maxHistoricalYears: config.maxHistoricalYears || 25,
      ...config
    };
  }

  public async scrapeDateRange(startDate: string, endDate: string): Promise<Pick3Draw[]> {
    const draws: Pick3Draw[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log(`Starting to scrape Pick 3 data from ${startDate} to ${endDate}`);

    // Calculate total days for progress tracking
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    let processedDays = 0;
    let successfulScrapes = 0;
    let failedScrapes = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0];

      try {
        const draw = await this.scrapeSingleDate(dateString);
        if (draw) {
          draws.push(draw);
          successfulScrapes++;
        } else {
          // Log missing data but don't treat as error for older dates
          if (date > new Date('2010-01-01')) {
            console.warn(`No data available for ${dateString}`);
          }
        }

        processedDays++;

        // Progress indicator every 100 days or 10%
        if (processedDays % 100 === 0 || processedDays === totalDays) {
          const progress = Math.round((processedDays / totalDays) * 100);
          console.log(`Progress: ${progress}% (${processedDays}/${totalDays} days, ${successfulScrapes} successful, ${failedScrapes} failed)`);
        }

        // Add delay to be respectful to the server
        await this.delay(this.config.delayBetweenRequests);

      } catch (error) {
        failedScrapes++;
        console.error(`Error scraping date ${dateString}:`, error);

        // For older dates, don't fail the entire process
        if (date < new Date('2010-01-01')) {
          console.log(`Continuing despite error for older date ${dateString}`);
        } else {
          // For recent dates, this might be a real issue
          console.warn(`Recent date ${dateString} failed to scrape`);
        }
      }
    }

    console.log(`Scraping complete: ${successfulScrapes} successful, ${failedScrapes} failed, ${draws.length} total draws`);
    return draws;
  }

  public async scrapeSingleDate(date: string): Promise<Pick3Draw | null> {
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const draw = await this.fetchDrawData(date);
        if (draw) {
          return draw;
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed for date ${date}:`, error);
        if (attempt < this.config.retryAttempts) {
          await this.delay(2000 * attempt); // Exponential backoff
        }
      }
    }
    return null;
  }

  private async fetchDrawData(date: string): Promise<Pick3Draw | null> {
    // This is a mock implementation - replace with actual scraping logic
    // For demonstration, we'll simulate fetching data

    const mockData = await this.getMockData(date);
    if (mockData) {
      return {
        date,
        midday: mockData.midday,
        evening: mockData.evening,
        timestamp: Date.now()
      };
    }

    return null;
  }

  private async getMockData(date: string): Promise<{ midday?: string; evening?: string } | null> {
    // Mock data generator for testing
    // In a real implementation, this would make HTTP requests to lottery websites

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Simulate some days having both draws, some having only one
    const hasMidday = Math.random() > 0.1; // 90% chance of midday draw
    const hasEvening = Math.random() > 0.05; // 95% chance of evening draw

    if (!hasMidday && !hasEvening) {
      return null; // No draws for this date
    }

    const midday = hasMidday ? this.generateRandomPick3() : undefined;
    const evening = hasEvening ? this.generateRandomPick3() : undefined;

    return { midday, evening };
  }

  private generateRandomPick3(): string {
    const digits = [];
    for (let i = 0; i < 3; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    return digits.join('');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to configure for different lottery sources
  public setConfig(config: Partial<ScraperConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Method to add custom scraping logic for specific sources
  public async scrapeFromSource(sourceUrl: string, date: string): Promise<Pick3Draw | null> {
    try {
      // This would be implemented for specific lottery websites
      // For now, return mock data
      console.log(`Scraping from ${sourceUrl} for date ${date}`);
      return await this.scrapeSingleDate(date);
    } catch (error) {
      console.error(`Error scraping from ${sourceUrl}:`, error);
      return null;
    }
  }
}

// Pre-configured scrapers for different states
export const scrapers = {
  'new-york': new Pick3DataScraper({
    baseUrl: 'https://www.lotteryusa.com/new-york',
    state: 'new-york'
  }),
  'california': new Pick3DataScraper({
    baseUrl: 'https://www.lotteryusa.com/california',
    state: 'california'
  }),
  'florida': new Pick3DataScraper({
    baseUrl: 'https://www.flalottery.com',
    state: 'florida'
  })
};
