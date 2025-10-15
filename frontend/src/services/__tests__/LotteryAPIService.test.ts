import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LotteryAPIService } from '../LotteryAPIService';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('LotteryAPIService', () => {
  let service: LotteryAPIService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LotteryAPIService({
      baseURL: 'https://api.lottery.test',
      apiKey: 'test-key',
      timeout: 10000,
      retryAttempts: 3,
    });
  });

  describe('fetchRecentDraws', () => {
    it('should fetch recent draws successfully', async () => {
      const mockData = [
        {
          drawDate: '2025-10-14',
          numbers: [1, 2, 3, 4, 5],
          powerball: 10,
        },
        {
          drawDate: '2025-10-13',
          numbers: [6, 7, 8, 9, 10],
          powerball: 15,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await service.fetchRecentDraws('powerball', 2);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/draws/powerball'),
        expect.objectContaining({
          headers: { 'X-API-Key': 'test-key' },
        })
      );
    });

    it('should return cached data on subsequent calls', async () => {
      const mockData = [
        {
          drawDate: '2025-10-14',
          numbers: [1, 2, 3, 4, 5],
          powerball: 10,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // First call
      await service.fetchRecentDraws('powerball', 1);
      
      // Second call should use cache
      const result = await service.fetchRecentDraws('powerball', 1);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.fetchRecentDraws('powerball', 10)).rejects.toThrow(
        'API request failed: 500 Internal Server Error'
      );
    });

    it('should retry on failure', async () => {
      // Fail first two times, succeed on third
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' })
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{
            drawDate: '2025-10-14',
            numbers: [1, 2, 3],
          }],
        });

      const result = await service.fetchRecentDraws('pick3', 1);
      
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('fetchHistoricalData', () => {
    it('should fetch historical data successfully', async () => {
      const mockData = [
        {
          drawDate: '2025-01-01',
          numbers: [1, 2, 3, 4, 5],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await service.fetchHistoricalData('powerball', '2025-01-01', '2025-01-31');

      expect(result).toEqual(mockData);
    });

    it('should validate date format', async () => {
      await expect(
        service.fetchHistoricalData('powerball', 'invalid-date', '2025-01-31')
      ).rejects.toThrow('Invalid date format');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      const mockData = [{
        drawDate: '2025-10-14',
        numbers: [1, 2, 3],
      }];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // Fetch to populate cache
      await service.fetchRecentDraws('pick3', 1);
      
      // Clear cache
      service.clearCache();
      
      // Fetch again should make new request
      await service.fetchRecentDraws('pick3', 1);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = service.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('entries');
    });
  });
});
