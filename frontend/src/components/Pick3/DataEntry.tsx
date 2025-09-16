import React, { useState } from 'react';
import { pick3DataManager } from '../../services/Pick3DataManager';
import { Pick3DataScraper } from '../../services/Pick3DataScraper';
import { AnalyticsService } from '../../services/api';
import { CacheManager } from '../../caching/CacheManager';
import './DataEntry.css';

interface DataEntryProps {
  className?: string;
}

const DataEntry: React.FC<DataEntryProps> = ({ className = '' }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [midday, setMidday] = useState('');
  const [evening, setEvening] = useState('');
  const [bulkData, setBulkData] = useState('');
  const [message, setMessage] = useState('');

  const handleSingleEntry = () => {
    if (!date) {
      setMessage('Please select a date');
      return;
    }

    if (!midday && !evening) {
      setMessage('Please enter at least one draw (midday or evening)');
      return;
    }

    // Validate numbers
    if (midday && !/^[0-9]{3}$/.test(midday)) {
      setMessage('Midday must be a 3-digit number');
      return;
    }

    if (evening && !/^[0-9]{3}$/.test(evening)) {
      setMessage('Evening must be a 3-digit number');
      return;
    }

    try {
      const draw = {
        date,
        midday: midday || undefined,
        evening: evening || undefined,
        timestamp: Date.now()
      };

      pick3DataManager.addDraws([draw]);
      setMessage(`Successfully added draw for ${date}`);
      setMidday('');
      setEvening('');
    } catch (error) {
      setMessage('Error adding draw: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleBulkEntry = () => {
    if (!bulkData.trim()) {
      setMessage('Please enter bulk data');
      return;
    }

    try {
      const lines = bulkData.split('\n').filter(line => line.trim());
      const draws = [];

      for (const line of lines) {
        // Expected format: YYYY-MM-DD midday evening
        // or: YYYY-MM-DD midday (for midday only)
        // or: YYYY-MM-DD evening (for evening only)
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) continue;

        const drawDate = parts[0];
        const middayNum = parts[1] && parts[1] !== '-' ? parts[1] : undefined;
        const eveningNum = parts[2] && parts[2] !== '-' ? parts[2] : undefined;

        if (middayNum && !/^[0-9]{3}$/.test(middayNum)) continue;
        if (eveningNum && !/^[0-9]{3}$/.test(eveningNum)) continue;

        draws.push({
          date: drawDate,
          midday: middayNum,
          evening: eveningNum,
          timestamp: Date.now()
        });
      }

      if (draws.length > 0) {
        pick3DataManager.addDraws(draws);
        setMessage(`Successfully added ${draws.length} draws`);
        setBulkData('');
      } else {
        setMessage('No valid draws found in bulk data');
      }
    } catch (error) {
      setMessage('Error processing bulk data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const populateSampleData = async () => {
    try {
      const scraper = new Pick3DataScraper();
      const sampleDraws = await scraper.populateSampleIndianaData();
      pick3DataManager.addDraws(sampleDraws);
      setMessage(`Successfully added ${sampleDraws.length} sample Indiana Daily 3 draws`);
    } catch (error) {
      setMessage('Error populating sample data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const scrapeHistoricalData = async () => {
    if (!window.confirm('This will scrape 25 years of historical Indiana Daily 3 data. This may take several minutes. Continue?')) {
      return;
    }

    try {
      setMessage('🔄 Starting historical data scrape... This may take several minutes.');
      const scraper = new Pick3DataScraper();
      const historicalDraws = await scraper.scrapeHistoricalIndianaData();

      if (historicalDraws.length > 0) {
        pick3DataManager.addDraws(historicalDraws);
        setMessage(`✅ Successfully scraped and added ${historicalDraws.length} historical Indiana Daily 3 draws (last 25 years)`);
      } else {
        setMessage('⚠️ No historical data was found. This could be due to network issues or the data source being unavailable.');
      }
    } catch (error) {
      setMessage('❌ Error scraping historical data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      pick3DataManager.clearData();
      setMessage('All data cleared');
    }
  };

  const clearAllCaches = () => {
    const analyticsStats = AnalyticsService.getCacheStats();
    const pick3Stats = pick3DataManager.getDataStats();

    const confirmMessage = `Clear ALL Pick 3 caches and data?

This will clear:
• Analytics cache (${analyticsStats.size} entries)
• Pick 3 stored data (${pick3Stats.totalDraws} draws)

Cached predictions and results will also be cleared.
This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        // Clear AnalyticsService cache
        AnalyticsService.clearCache();
        console.log('✅ Analytics cache cleared');

        // Clear CacheManager caches if available
        try {
          const cacheManager = new CacheManager();
          cacheManager.clearAll();
          console.log('✅ Prediction and Result caches cleared');
        } catch (error) {
          console.warn('CacheManager clear failed:', error);
        }

        // Clear Pick3DataManager data
        pick3DataManager.clearData();
        console.log('✅ Pick 3 data cleared');

        setMessage('🎉 All Pick 3 caches and data cleared successfully!');
      } catch (error) {
        console.error('❌ Error clearing caches:', error);
        setMessage('❌ Error clearing some caches. Check console for details.');
      }
    }
  };

  return (
    <div className={`data-entry ${className}`}>
      <div className="data-entry-header">
        <h2>📝 Indiana Daily 3 Data Entry</h2>
        <p>Manually add lottery draw data when automatic scraping is unavailable</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="entry-section">
        <h3>Single Draw Entry</h3>
        <div className="single-entry-form">
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Midday (3 digits):</label>
            <input
              type="text"
              value={midday}
              onChange={(e) => setMidday(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="123"
              maxLength={3}
            />
          </div>

          <div className="form-group">
            <label>Evening (3 digits):</label>
            <input
              type="text"
              value={evening}
              onChange={(e) => setEvening(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="456"
              maxLength={3}
            />
          </div>

          <button onClick={handleSingleEntry} className="add-btn">
            Add Draw
          </button>
        </div>
      </div>

      <div className="entry-section">
        <h3>Bulk Data Entry</h3>
        <p>Format: YYYY-MM-DD midday evening (use - for missing draw)</p>
        <p>Example:</p>
        <pre>
{`2025-01-15 123 456
2025-01-14 789 -
2025-01-13 - 012`}
        </pre>

        <textarea
          value={bulkData}
          onChange={(e) => setBulkData(e.target.value)}
          placeholder="Enter multiple draws, one per line"
          rows={10}
        />

        <button onClick={handleBulkEntry} className="add-btn">
          Add Bulk Data
        </button>
      </div>

      <div className="data-management">
        <h3>Data Management</h3>
        <div className="stats">
          <span>Total Draws: {pick3DataManager.getDataStats().totalDraws}</span>
          <span>Complete Draws: {pick3DataManager.getDataStats().completeDraws}</span>
        </div>

        <button onClick={populateSampleData} className="sample-btn">
          Load Sample Indiana Data
        </button>
        <button onClick={scrapeHistoricalData} className="scrape-btn">
          🌐 Scrape Historical Data (25 Years)
        </button>
        <button onClick={clearAllCaches} className="cache-btn">
          🗑️ Clear ALL Caches & Data
        </button>
        <button onClick={clearAllData} className="clear-btn">
          Clear Data Only
        </button>
      </div>
    </div>
  );
};

export default DataEntry;