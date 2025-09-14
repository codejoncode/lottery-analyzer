import { pick3DataManager, type Pick3Draw } from './Pick3DataManager';
import { Pick3DataScraper } from './Pick3DataScraper';
import { Pick3DataProcessor } from './Pick3DataProcessor';

export interface SyncOptions {
  startDate?: string;
  endDate?: string;
  forceRefresh?: boolean;
  maxRetries?: number;
  chunkSize?: number; // New: process data in chunks
  enableCompression?: boolean; // New: compress data storage
}

export interface SyncResult {
  success: boolean;
  newDraws: number;
  updatedDraws: number;
  errors: string[];
  duration: number;
  stats: {
    totalDraws: number;
    completeDraws: number;
    incompleteDraws: number;
  };
  chunksProcessed?: number; // New: track chunked processing
}

export class Pick3DataSyncService {
  private scraper: Pick3DataScraper;
  private processor: Pick3DataProcessor;

  constructor() {
    this.scraper = new Pick3DataScraper();
    this.processor = new Pick3DataProcessor();
  }

  public async syncData(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const chunkSize = options.chunkSize || 365; // Default: 1 year chunks

    try {
      console.log('Starting Pick 3 data synchronization...');

      // Determine date range
      const { startDate, endDate } = this.calculateDateRange(options);

      console.log(`Syncing data from ${startDate} to ${endDate}`);

      // Check if this is a large date range that should be chunked
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDifference > chunkSize) {
        console.log(`Large date range detected (${daysDifference} days). Processing in chunks of ${chunkSize} days.`);
        return this.syncDataInChunks(startDate, endDate, options, startTime);
      }

      // Scrape new data
      const scrapedDraws = await this.scraper.scrapeDateRange(startDate, endDate);

      if (scrapedDraws.length === 0) {
        console.log('No new data scraped');
        return this.createResult(true, 0, 0, errors, startTime);
      }

      // Filter out draws we already have (unless force refresh)
      const existingDraws = pick3DataManager.getDraws();
      const existingDates = new Set(existingDraws.map(d => d.date));

      let newDraws: Pick3Draw[] = [];
      let updatedDraws = 0;

      for (const scrapedDraw of scrapedDraws) {
        if (!existingDates.has(scrapedDraw.date) || options.forceRefresh) {
          if (existingDates.has(scrapedDraw.date)) {
            updatedDraws++;
          } else {
            newDraws.push(scrapedDraw);
          }
        }
      }

      // Add new draws to storage
      if (newDraws.length > 0 || updatedDraws > 0) {
        pick3DataManager.addDraws(scrapedDraws);
        console.log(`Added ${newDraws.length} new draws, updated ${updatedDraws} existing draws`);
      }

      // Update processor with latest data
      const allDraws = pick3DataManager.getDraws();
      this.processor.updateDraws(allDraws);

      return this.createResult(true, newDraws.length, updatedDraws, errors, startTime);

    } catch (error) {
      console.error('Error during data synchronization:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return this.createResult(false, 0, 0, errors, startTime);
    }
  }

  private calculateDateRange(options: SyncOptions): { startDate: string; endDate: string } {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let startDate: string;
    let endDate: string;

    if (options.startDate && options.endDate) {
      startDate = options.startDate;
      endDate = options.endDate;
    } else {
      // Default: last 30 days
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      startDate = thirtyDaysAgo.toISOString().split('T')[0];
      endDate = yesterday.toISOString().split('T')[0];
    }

    return { startDate, endDate };
  }

  private async syncDataInChunks(
    startDate: string,
    endDate: string,
    options: SyncOptions,
    startTime: number
  ): Promise<SyncResult> {
    const errors: string[] = [];
    const chunkSize = options.chunkSize || 365;
    let totalNewDraws = 0;
    let totalUpdatedDraws = 0;
    let chunksProcessed = 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalChunks = Math.ceil(totalDays / chunkSize);

    console.log(`Processing ${totalChunks} chunks of ${chunkSize} days each...`);

    for (let i = 0; i < totalChunks; i++) {
      const chunkStart = new Date(start);
      chunkStart.setDate(start.getDate() + (i * chunkSize));

      const chunkEnd = new Date(chunkStart);
      chunkEnd.setDate(chunkStart.getDate() + chunkSize - 1);

      // Don't go beyond the requested end date
      if (chunkEnd > end) {
        chunkEnd.setTime(end.getTime());
      }

      const chunkStartStr = chunkStart.toISOString().split('T')[0];
      const chunkEndStr = chunkEnd.toISOString().split('T')[0];

      console.log(`Processing chunk ${i + 1}/${totalChunks}: ${chunkStartStr} to ${chunkEndStr}`);

      try {
        const chunkResult = await this.syncData({
          ...options,
          startDate: chunkStartStr,
          endDate: chunkEndStr,
          chunkSize: undefined // Prevent infinite recursion
        });

        totalNewDraws += chunkResult.newDraws;
        totalUpdatedDraws += chunkResult.updatedDraws;
        errors.push(...chunkResult.errors);
        chunksProcessed++;

        // Progress indicator
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        console.log(`Progress: ${progress}% (${i + 1}/${totalChunks} chunks processed)`);

        // Small delay between chunks to be respectful
        await this.delay(500);

      } catch (error) {
        const errorMsg = `Error processing chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`Chunked processing complete: ${totalNewDraws} new draws, ${totalUpdatedDraws} updated draws`);

    const result = this.createResult(
      errors.length === 0,
      totalNewDraws,
      totalUpdatedDraws,
      errors,
      startTime
    );

    // Add chunks processed info
    result.chunksProcessed = chunksProcessed;

    return result;
  }

  private createResult(
    success: boolean,
    newDraws: number,
    updatedDraws: number,
    errors: string[],
    startTime: number
  ): SyncResult {
    const stats = pick3DataManager.getDataStats();

    return {
      success,
      newDraws,
      updatedDraws,
      errors,
      duration: Date.now() - startTime,
      stats: {
        totalDraws: stats.totalDraws,
        completeDraws: stats.completeDraws,
        incompleteDraws: stats.incompleteDraws
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async syncLatestData(): Promise<SyncResult> {
    // Sync last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.syncData({
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      forceRefresh: false
    });
  }

  public async syncExtendedHistoricalData(): Promise<SyncResult> {
    console.log('Starting extended historical data collection (2000-present)...');

    // Create scraper optimized for extended historical data
    const extendedScraper = new Pick3DataScraper({
      extendedHistoricalMode: true,
      maxHistoricalYears: 25,
      delayBetweenRequests: 300, // Faster for historical data
      retryAttempts: 2 // Fewer retries for older data
    });

    // Temporarily replace the scraper
    const originalScraper = this.scraper;
    this.scraper = extendedScraper;

    try {
      const startDate = '2000-01-01';
      const endDate = new Date().toISOString().split('T')[0];

      const result = await this.syncData({
        startDate,
        endDate,
        chunkSize: 365, // Process 1 year at a time
        enableCompression: true,
        forceRefresh: false
      });

      return result;
    } finally {
      // Restore original scraper
      this.scraper = originalScraper;
    }
  }

  public async syncMissingData(): Promise<SyncResult> {
    const allDraws = pick3DataManager.getDraws();
    const processor = new Pick3DataProcessor(allDraws);
    const incompleteDraws = processor.getDrawsWithMissingData();

    if (incompleteDraws.length === 0) {
      console.log('No incomplete draws found');
      return this.createResult(true, 0, 0, [], Date.now());
    }

    console.log(`Found ${incompleteDraws.length} incomplete draws, attempting to fill missing data`);

    const dates = incompleteDraws.map(d => d.date);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    return this.syncData({
      startDate,
      endDate,
      forceRefresh: true // Force refresh to get missing data
    });
  }

  public getProcessor(): Pick3DataProcessor {
    const allDraws = pick3DataManager.getDraws();
    this.processor.updateDraws(allDraws);
    return this.processor;
  }

  public getDataManager() {
    return pick3DataManager;
  }

  public getScraper(): Pick3DataScraper {
    return this.scraper;
  }
}

// Singleton instance
export const pick3DataSyncService = new Pick3DataSyncService();
