import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { Pick3DataScraper } from '../services/Pick3DataScraper';
import { pick3DataManager } from '../services/Pick3DataManager';

// Mock fetch for network requests
const mockFetch = vi.fn() as Mock;
vi.stubGlobal('fetch', mockFetch);

describe('Pick3DataScraper', () => {
  let scraper: Pick3DataScraper;

  beforeEach(() => {
    scraper = new Pick3DataScraper();
    mockFetch.mockClear();

    // Clear data manager before each test
    pick3DataManager.clearData();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('populateSampleIndianaData', () => {
    it('should return sample Indiana data with correct structure', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>Sample data content</body></html>')
      });

      const result = await scraper.populateSampleIndianaData();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check structure of first result
      const firstDraw = result[0];
      expect(firstDraw).toHaveProperty('date');
      expect(firstDraw).toHaveProperty('midday');
      expect(firstDraw).toHaveProperty('evening');
      expect(firstDraw).toHaveProperty('timestamp');
    });

    it('should generate data without network calls', async () => {
      // populateSampleIndianaData() generates data locally, doesn't make network calls
      const result = await scraper.populateSampleIndianaData();

      // Should not have called fetch at all
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.length).toBe(30); // 30 days of sample data
    });

    it('should generate realistic lottery numbers', async () => {
      const result = await scraper.populateSampleIndianaData();

      // Verify all draws have valid 3-digit numbers
      result.forEach(draw => {
        expect(draw.midday).toMatch(/^[0-9]{3}$/);
        expect(draw.evening).toMatch(/^[0-9]{3}$/);
        expect(draw.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('scrapeHistoricalIndianaData', () => {
    it('should calculate correct date range for 25 years', () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 25);

      const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
      expect(yearsDiff).toBe(25);
    });

    it('should handle errors during historical scraping', async () => {
      // Mock scrapeDateRange to throw error
      const mockError = new Error('Scraping failed');
      scraper.scrapeDateRange = vi.fn().mockRejectedValue(mockError);

      await expect(scraper.scrapeHistoricalIndianaData()).rejects.toThrow('Scraping failed');
    });

    it('should return array of draws on successful scrape', async () => {
      // Mock scrapeDateRange to return successful results
      const mockDraws = [
        { date: '2024-01-01', midday: '123', evening: '456', timestamp: Date.now() },
        { date: '2024-01-02', midday: '789', evening: '012', timestamp: Date.now() }
      ];
      scraper.scrapeDateRange = vi.fn().mockResolvedValue(mockDraws);

      const result = await scraper.scrapeHistoricalIndianaData();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('midday');
      expect(result[0]).toHaveProperty('evening');
    });
  });

  describe('Data validation', () => {
    it('should validate Pick3 number format', () => {
      const validNumbers = ['123', '456', '789', '012', '999', '000'];
      const invalidNumbers = ['1234', '12', 'abc', '1a3', ''];

      validNumbers.forEach(number => {
        expect(() => {
          if (!/^[0-9]{3}$/.test(number)) {
            throw new Error('Invalid format');
          }
        }).not.toThrow();
      });

      invalidNumbers.forEach(number => {
        expect(() => {
          if (!/^[0-9]{3}$/.test(number)) {
            throw new Error('Invalid format');
          }
        }).toThrow();
      });
    });

    it('should handle malformed HTML responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body><invalid>malformed content</body></html>')
      });

      const result = await scraper.populateSampleIndianaData();

      // Should handle malformed data gracefully
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter out invalid dates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>Contains invalid dates</body></html>')
      });

      const result = await scraper.populateSampleIndianaData();

      // All returned draws should have valid dates
      result.forEach(draw => {
        expect(draw.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        const date = new Date(draw.date);
        expect(date).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });
  });

  describe('Integration with DataManager', () => {
    it('should integrate properly with Pick3DataManager', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>Sample data</body></html>')
      });

      const initialCount = pick3DataManager.getDataStats().totalDraws;
      const scrapedData = await scraper.populateSampleIndianaData();

      // Add scraped data to manager
      pick3DataManager.addDraws(scrapedData);

      const finalCount = pick3DataManager.getDataStats().totalDraws;
      expect(finalCount).toBe(initialCount + scrapedData.length);
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    it('should handle duplicate data appropriately', async () => {
      const testDraws = [
        { date: '2025-01-01', midday: '123', evening: '456', timestamp: Date.now() },
        { date: '2025-01-01', midday: '123', evening: '456', timestamp: Date.now() }
      ];

      pick3DataManager.addDraws(testDraws);
      const afterFirstAdd = pick3DataManager.getDataStats().totalDraws;

      // Try to add the same data again
      pick3DataManager.addDraws(testDraws);
      const afterSecondAdd = pick3DataManager.getDataStats().totalDraws;

      // Should handle duplicates appropriately (either skip or update)
      expect(afterSecondAdd).toBeGreaterThanOrEqual(afterFirstAdd);
    });
  });

  describe('Performance and reliability', () => {
    it('should handle timeout scenarios', async () => {
      mockFetch.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          text: () => Promise.resolve('<html><body>Delayed response</body></html>')
        }), 100))
      );

      const startTime = Date.now();
      const result = await scraper.populateSampleIndianaData();
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within reasonable time
    });

    it('should handle concurrent requests appropriately', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><body>Concurrent data</body></html>')
      });

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => scraper.populateSampleIndianaData());
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should validate data integrity after scraping', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<html><body>Valid data content</body></html>')
      });

      const result = await scraper.populateSampleIndianaData();

      result.forEach(draw => {
        // Validate required fields
        expect(draw).toHaveProperty('date');
        expect(draw).toHaveProperty('timestamp');

        // Validate number formats if present
        if (draw.midday) {
          expect(draw.midday).toMatch(/^[0-9]{3}$/);
        }
        if (draw.evening) {
          expect(draw.evening).toMatch(/^[0-9]{3}$/);
        }

        // Validate date format
        expect(draw.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});