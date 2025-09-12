import { pick3DataSyncService } from '../services/Pick3DataSyncService';

export class DataInitializationService {
  private static initialized = false;

  public static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Pick 3 data already initialized');
      return;
    }

    try {
      console.log('Initializing Pick 3 data service...');

      // Check if we have any data
      const dataManager = pick3DataSyncService.getDataManager();
      const stats = dataManager.getDataStats();

      if (stats.totalDraws === 0) {
        console.log('No local data found, performing extended historical data collection...');

        // Perform extended historical data collection (2000-present)
        const result = await pick3DataSyncService.syncExtendedHistoricalData();

        if (result.success) {
          console.log(`Extended historical data collection completed: ${result.newDraws} draws loaded`);
          if (result.chunksProcessed) {
            console.log(`Processed ${result.chunksProcessed} data chunks`);
          }
        } else {
          console.error('Extended historical data collection failed:', result.errors);
          // Fallback to recent data if extended collection fails
          console.log('Falling back to recent data collection...');
          const fallbackResult = await pick3DataSyncService.syncLatestData();
          if (fallbackResult.success) {
            console.log(`Fallback data sync completed: ${fallbackResult.newDraws} draws loaded`);
          }
        }
      } else {
        console.log(`Found ${stats.totalDraws} existing draws, checking for updates...`);

        // Check for missing data and updates
        const missingResult = await pick3DataSyncService.syncMissingData();

        if (missingResult.success && (missingResult.newDraws > 0 || missingResult.updatedDraws > 0)) {
          console.log(`Updated data: ${missingResult.newDraws} new, ${missingResult.updatedDraws} updated`);
        }

        // Also check for latest data
        const latestResult = await pick3DataSyncService.syncLatestData();

        if (latestResult.success && (latestResult.newDraws > 0 || latestResult.updatedDraws > 0)) {
          console.log(`Latest data sync: ${latestResult.newDraws} new, ${latestResult.updatedDraws} updated`);
        }
      }

      // Update processor with latest data
      const processor = pick3DataSyncService.getProcessor();
      const analysis = processor.getColumnStraightData();

      console.log(`Data initialization complete. ${analysis.length} analysis points available.`);

      this.initialized = true;

    } catch (error) {
      console.error('Error during data initialization:', error);
      // Don't mark as initialized if there was an error
    }
  }

  public static isInitialized(): boolean {
    return this.initialized;
  }

  public static async forceRefresh(): Promise<void> {
    console.log('Forcing data refresh...');
    this.initialized = false;
    await this.initialize();
  }
}
