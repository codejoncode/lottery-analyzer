import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import DataEntry from '../components/Pick3/DataEntry';

// Mock the services
vi.mock('../services/Pick3DataManager', () => ({
  pick3DataManager: {
    addDraws: vi.fn(),
    clearData: vi.fn(),
    getDataStats: vi.fn(() => ({ totalDraws: 0, completeDraws: 0 }))
  }
}));

vi.mock('../services/Pick3DataScraper', () => ({
  Pick3DataScraper: vi.fn().mockImplementation(() => ({
    populateSampleIndianaData: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('../services/api', () => ({
  AnalyticsService: {
    getCacheStats: vi.fn(() => new Map()),
    clearCache: vi.fn()
  }
}));

vi.mock('../caching/CacheManager', () => ({
  CacheManager: vi.fn().mockImplementation(() => ({
    clearAll: vi.fn()
  }))
}));

describe('Navigation Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('DataEntry Component Functionality', () => {
    it('should render the data entry form', () => {
      render(
        <BrowserRouter>
          <DataEntry />
        </BrowserRouter>
      );

      // Check for form elements
      expect(screen.getByText(/Indiana Daily 3 Data Entry/i)).toBeInTheDocument();
      expect(screen.getByText(/Single Draw Entry/i)).toBeInTheDocument();
      expect(screen.getByText(/Bulk Data Entry/i)).toBeInTheDocument();
    });

    it('should have date input field', () => {
      render(
        <BrowserRouter>
          <DataEntry />
        </BrowserRouter>
      );

      // Query by type attribute since label doesn't have htmlFor
      const dateInput = document.querySelector('input[type="date"]');
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('should have midday and evening input fields', () => {
      render(
        <BrowserRouter>
          <DataEntry />
        </BrowserRouter>
      );

      const middayInput = screen.getByPlaceholderText('123');
      const eveningInput = screen.getByPlaceholderText('456');
      
      expect(middayInput).toBeInTheDocument();
      expect(eveningInput).toBeInTheDocument();
      expect(middayInput).toHaveAttribute('maxlength', '3');
      expect(eveningInput).toHaveAttribute('maxlength', '3');
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