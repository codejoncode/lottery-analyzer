// Test file to verify Pick3DataManager works in browser
import { pick3DataManager } from './Pick3DataManager';
import { pick3DataSyncService } from './Pick3DataSyncService';

// Clear existing data first
console.log('Clearing existing data...');
pick3DataManager.clearData();

// Test Indiana Daily 3 data sync
console.log('Testing Indiana Daily 3 data sync...');

async function testIndianaDataSync() {
  try {
    console.log('Starting data sync for Indiana Daily 3...');

    // Sync recent data (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await pick3DataSyncService.syncData({
      startDate,
      endDate,
      forceRefresh: true
    });

    console.log('Sync result:', result);

    if (result.success) {
      console.log(`Successfully synced ${result.newDraws} new draws`);

      // Check data stats
      const stats = pick3DataManager.getDataStats();
      console.log('Data stats:', stats);

      // Get recent draws
      const recentDraws = pick3DataManager.getDraws(startDate, endDate);
      console.log('Recent draws:', recentDraws.slice(0, 5)); // Show first 5

      // Check for midday/evening draws
      const drawsWithBoth = recentDraws.filter(d => d.midday && d.evening);
      const drawsWithMiddayOnly = recentDraws.filter(d => d.midday && !d.evening);
      const drawsWithEveningOnly = recentDraws.filter(d => !d.midday && d.evening);

      console.log(`Draws with both midday and evening: ${drawsWithBoth.length}`);
      console.log(`Draws with midday only: ${drawsWithMiddayOnly.length}`);
      console.log(`Draws with evening only: ${drawsWithEveningOnly.length}`);

    } else {
      console.error('Sync failed:', result.errors);
    }

  } catch (error) {
    console.error('Error during data sync test:', error);
  }
}

testIndianaDataSync();