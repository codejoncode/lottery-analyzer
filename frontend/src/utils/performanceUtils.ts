import { useCallback, useRef, useEffect } from 'react';

// Performance optimization utilities for chart components

/**
 * Debounce hook for performance optimization
 */
export const useDebounce = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
  const timeoutRef = useRef<number | null>(null);

  const debouncedCallback = useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Throttle hook for performance optimization
 */
export const useThrottle = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
  const lastCallRef = useRef<number>(0);

  const throttledCallback = useCallback((...args: T) => {
    const now = Date.now();

    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);

  return throttledCallback;
};

/**
 * Memory-efficient data downsampling for large datasets
 */
export const downsampleData = <T>(
  data: T[],
  maxPoints: number,
  selector?: (item: T) => number
): T[] => {
  if (data.length <= maxPoints) {
    return data;
  }

  const step = Math.floor(data.length / maxPoints);
  const result: T[] = [];

  // Use selector for smart sampling if provided
  if (selector) {
    // Sample based on importance (higher values get priority)
    const indexedData = data.map((item, index) => ({
      item,
      value: selector(item),
      index
    }));

    indexedData.sort((a, b) => b.value - a.value);

    // Take top items and sort back by original index
    const topItems = indexedData.slice(0, maxPoints);
    topItems.sort((a, b) => a.index - b.index);

    return topItems.map(({ item }) => item);
  }

  // Simple uniform sampling
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }

  return result;
};

/**
 * Virtual scrolling data slicer for very large datasets
 */
export const useVirtualSlice = <T>(
  data: T[],
  visibleRange: { start: number; end: number },
  bufferSize: number = 100
) => {
  const start = Math.max(0, visibleRange.start - bufferSize);
  const end = Math.min(data.length, visibleRange.end + bufferSize);

  return {
    slicedData: data.slice(start, end),
    offset: start,
    totalLength: data.length
  };
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;

    if (import.meta.env.DEV) {
      console.log(`🔧 ${componentName} render #${renderCountRef.current}, ${timeSinceLastRender}ms since last render`);
    }

    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current
  };
};

/**
 * Memory cleanup utility
 */
export const useMemoryCleanup = () => {
  useEffect(() => {
    return () => {
      // Force garbage collection hint (if available)
      if (window.gc && import.meta.env.DEV) {
        window.gc();
      }
    };
  }, []);
};

/**
 * Chart.js performance options
 */
export const getOptimizedChartOptions = (baseOptions: unknown) => ({
  ...(baseOptions as Record<string, unknown>),
  animation: {
    duration: 300, // Faster animations
    easing: 'easeOutQuart' as const
  },
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(baseOptions as any).plugins,
    legend: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(baseOptions as any).plugins?.legend,
      display: true,
      labels: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(baseOptions as any).plugins?.legend?.labels,
        usePointStyle: true,
        padding: 15
      }
    }
  },
  elements: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(baseOptions as any).elements,
    point: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(baseOptions as any).elements?.point,
      hoverRadius: 6,
      radius: 3
    },
    line: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(baseOptions as any).elements?.line,
      borderWidth: 2,
      tension: 0.1
    }
  },
  interaction: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(baseOptions as any).interaction,
    mode: 'nearest',
    intersect: false,
    axis: 'x'
  }
});