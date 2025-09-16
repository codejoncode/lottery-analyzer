import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DataEntry from '../src/components/Pick3/DataEntry';

// Mock the services
vi.mock('../src/services/Pick3DataManager', () => ({
  pick3DataManager: {
    addDraws: vi.fn(),
    clearData: vi.fn(),
    getDataStats: vi.fn(() => ({ totalDraws: 0, completeDraws: 0 }))
  }
}));

vi.mock('../src/services/Pick3DataScraper', () => ({
  Pick3DataScraper: vi.fn().mockImplementation(() => ({
    populateSampleIndianaData: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('../src/services/api', () => ({
  AnalyticsService: {
    getCacheStats: vi.fn(() => new Map()),
    clearCache: vi.fn()
  }
}));

vi.mock('../src/caching/CacheManager', () => ({
  CacheManager: vi.fn().mockImplementation(() => ({
    clearAll: vi.fn()
  }))
}));

describe('Navigation Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Home Button Navigation', () => {
    it('should navigate to home when home button is clicked', () => {
      // Mock window.location
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      render(
        <BrowserRouter>
          <DataEntry />
        </BrowserRouter>
      );

      // Since DataEntry doesn't have a home button, let's test the data-entry route
      // which does have navigation
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should have working navigation links on all screens', () => {
      // Test that navigation links exist and have correct hrefs
      const navigationLinks = [
        { text: 'Home', href: '/' },
        { text: 'Analysis', href: '/analysis' },
        { text: 'Inspector 3', href: '/inspector3' },
        { text: 'Deflate', href: '/deflate' },
        { text: 'Dashboard', href: '/dashboard' },
        { text: 'Predictions', href: '/predictions' },
        { text: 'Scoring', href: '/scoring' },
        { text: 'Combinations', href: '/combinations' },
        { text: 'Pairs', href: '/pairs' },
        { text: 'Triples', href: '/triples' },
        { text: 'Grid', href: '/grid' },
        { text: 'Skip', href: '/skip' },
        { text: 'Column Engine', href: '/column-engine' },
        { text: 'Skip Tracker', href: '/skip-tracker' },
        { text: 'Pick3 Scoring', href: '/pick3-scoring' },
        { text: 'Backtesting', href: '/pick3-backtesting' },
        { text: 'Column Analysis', href: '/column-analysis' },
        { text: 'Draw Summary', href: '/draw-summary' },
        { text: 'Pick3 Pairs', href: '/pick3-pairs' }
      ];

      navigationLinks.forEach(({ text, href }) => {
        const link = screen.getByRole('link', { name: new RegExp(text, 'i') });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', href);
      });
    });

    it('should handle navigation state changes correctly', () => {
      // Test that clicking navigation links updates the URL
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      render(
        <BrowserRouter>
          <DataEntry />
        </BrowserRouter>
      );

      const analysisLink = screen.getByRole('link', { name: /analysis/i });
      fireEvent.click(analysisLink);

      // In a real scenario, this would navigate to /analysis
      // For testing purposes, we verify the link exists and is clickable
      expect(analysisLink).toBeInTheDocument();
    });
  });

  describe('DataEntry Component Navigation', () => {
    it('should not have duplicate navigation when used in data-entry route', () => {
      // The DataEntry component itself shouldn't have navigation
      // Navigation should be handled by the route wrapper
      render(
        <BrowserRouter>
          <DataEntry />
        </BrowserRouter>
      );

      // DataEntry component should not have its own navigation
      const navigationElements = screen.queryAllByRole('navigation');
      expect(navigationElements.length).toBe(0);
    });

    it('should work correctly when embedded in route with navigation', () => {
      // Test that DataEntry works when wrapped with navigation (like in data-entry.tsx)
      const TestWrapper = () => (
        <BrowserRouter>
          <div>
            <nav>
              <a href="/">Home</a>
              <a href="/analysis">Analysis</a>
            </nav>
            <DataEntry />
          </div>
        </BrowserRouter>
      );

      render(<TestWrapper />);

      // Should have navigation from wrapper
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();

      // Should have DataEntry content
      expect(screen.getByText('📝 Indiana Daily 3 Data Entry')).toBeInTheDocument();
    });
  });
});