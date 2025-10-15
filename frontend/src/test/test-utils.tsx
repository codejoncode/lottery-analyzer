import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Enhanced render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  return performance.now() - start;
};

// Mock data generators
export const generateMockDrawData = (count: number = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    numbers: [
      Math.floor(Math.random() * 69) + 1,
      Math.floor(Math.random() * 69) + 1,
      Math.floor(Math.random() * 69) + 1,
      Math.floor(Math.random() * 69) + 1,
      Math.floor(Math.random() * 69) + 1,
    ],
    powerball: Math.floor(Math.random() * 26) + 1,
  }));
};

export const generateMockPick3Data = (count: number = 50) => {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    numbers: [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ],
  }));
};

// Testing utilities
export const waitForElementToBeRemoved = async (element: HTMLElement) => {
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.body.contains(element)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
};

// Mock implementations
export const createMockAPIService = () => ({
  fetchRecentDraws: vi.fn(),
  fetchHistoricalData: vi.fn(),
  clearCache: vi.fn(),
  getCacheStats: vi.fn(),
});

export * from '@testing-library/react';
export { customRender as render };
