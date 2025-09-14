import { useState, useEffect, useCallback, useRef } from 'react';
import * as React from 'react';

// Type declaration for Node.js Timer
type NodeJSTimer = ReturnType<typeof setTimeout>;
import { createLazyLoader } from '../utils/performanceOptimizer';
import type { LazyLoader } from '../utils/performanceOptimizer';

export interface LazyLoadState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isLoaded: boolean;
  progress: number; // 0-100
  lastLoaded: Date | null;
}

export interface LazyLoadOptions {
  ttl?: number; // Time to live in milliseconds
  retryCount?: number;
  retryDelay?: number;
  enableCache?: boolean;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for lazy loading data with performance optimization
 */
export function useLazyLoad<T>(
  key: string,
  loader: () => Promise<T>,
  options: LazyLoadOptions = {}
): LazyLoadState<T> & {
  load: () => Promise<void>;
  reload: () => Promise<void>;
  clear: () => void;
} {
  const {
    ttl = 300000, // 5 minutes
    retryCount = 3,
    retryDelay = 1000,
    enableCache = true,
    onProgress,
    onError
  } = options;

  const [state, setState] = useState<LazyLoadState<T>>({
    data: null,
    loading: false,
    error: null,
    isLoaded: false,
    progress: 0,
    lastLoaded: null
  });

  const lazyLoaderRef = useRef<LazyLoader<T> | null>(null);
  const retryTimeoutRef = useRef<NodeJSTimer | null>(null);

  // Initialize lazy loader
  useEffect(() => {
    if (enableCache) {
      lazyLoaderRef.current = createLazyLoader(key, loader, ttl);
    }
  }, [key, loader, ttl, enableCache]);

  const loadWithRetry = useCallback(async (attempt: number = 1): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      let data: T;
      if (enableCache && lazyLoaderRef.current) {
        data = await lazyLoaderRef.current.load();
      } else {
        data = await loader();
      }

      setState({
        data,
        loading: false,
        error: null,
        isLoaded: true,
        progress: 100,
        lastLoaded: new Date()
      });

      onProgress?.(100);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < retryCount) {
        console.warn(`Lazy load attempt ${attempt} failed, retrying in ${retryDelay}ms:`, err.message);

        retryTimeoutRef.current = setTimeout(() => {
          loadWithRetry(attempt + 1);
        }, retryDelay);

        setState(prev => ({
          ...prev,
          progress: (attempt / retryCount) * 100
        }));

        onProgress?.((attempt / retryCount) * 100);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err,
          progress: 0
        }));

        onError?.(err);
      }
    }
  }, [loader, retryCount, retryDelay, enableCache, onProgress, onError]);

  const load = useCallback(async () => {
    if (state.loading) return;
    await loadWithRetry();
  }, [state.loading, loadWithRetry]);

  const reload = useCallback(async () => {
    // Clear cache if using lazy loader
    if (lazyLoaderRef.current) {
      lazyLoaderRef.current.isLoaded = false;
      lazyLoaderRef.current.data = undefined;
    }

    setState(prev => ({
      ...prev,
      isLoaded: false,
      data: null,
      error: null,
      progress: 0
    }));

    await loadWithRetry();
  }, [loadWithRetry]);

  const clear = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (lazyLoaderRef.current) {
      lazyLoaderRef.current.isLoaded = false;
      lazyLoaderRef.current.data = undefined;
    }

    setState({
      data: null,
      loading: false,
      error: null,
      isLoaded: false,
      progress: 0,
      lastLoaded: null
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    load,
    reload,
    clear
  };
}

/**
 * Hook for lazy loading large datasets with pagination
 */
export function useLazyLoadPaginated<T>(
  key: string,
  loader: (page: number, pageSize: number) => Promise<{ data: T[]; total: number; hasMore: boolean }>,
  options: LazyLoadOptions & {
    pageSize?: number;
    initialPage?: number;
    autoLoad?: boolean;
  } = {}
): LazyLoadState<T[]> & {
  loadPage: (page: number) => Promise<void>;
  loadNext: () => Promise<void>;
  loadPrevious: () => Promise<void>;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  totalItems: number;
} {
  const {
    pageSize = 50,
    initialPage = 1,
    autoLoad = false,
    ...lazyOptions
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [allData, setAllData] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pageCache] = useState(new Map<number, T[]>());

  const lazyState = useLazyLoad(
    `${key}-page-${currentPage}`,
    async () => {
      const result = await loader(currentPage, pageSize);
      return result;
    },
    lazyOptions
  );

  // Update state when page data loads
  useEffect(() => {
    if (lazyState.data) {
      const pageData = lazyState.data.data;
      setTotalItems(lazyState.data.total);
      setHasMore(lazyState.data.hasMore);

      // Cache page data
      pageCache.set(currentPage, pageData);

      // Update all data (accumulate pages)
      setAllData(prev => {
        const newData = [...prev];
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageData.length;

        // Ensure array has enough space
        while (newData.length < endIndex) {
          newData.push(undefined as T);
        }

        // Fill in the page data
        for (let i = 0; i < pageData.length; i++) {
          newData[startIndex + i] = pageData[i];
        }

        return newData;
      });
    }
  }, [lazyState.data, currentPage, pageSize, pageCache]);

  // Auto load first page
  useEffect(() => {
    if (autoLoad && !lazyState.isLoaded && !lazyState.loading) {
      lazyState.load();
    }
  }, [autoLoad, lazyState]);

  const loadPage = useCallback(async (page: number) => {
    setCurrentPage(page);
    // The lazy loader will automatically handle the new page
  }, []);

  const loadNext = useCallback(async () => {
    if (hasMore) {
      await loadPage(currentPage + 1);
    }
  }, [hasMore, currentPage, loadPage]);

  const loadPrevious = useCallback(async () => {
    if (currentPage > 1) {
      await loadPage(currentPage - 1);
    }
  }, [currentPage, loadPage]);

  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    ...lazyState,
    data: allData,
    loadPage,
    loadNext,
    loadPrevious,
    currentPage,
    totalPages,
    hasMore,
    totalItems
  };
}

/**
 * Hook for lazy loading with intersection observer (loads when element enters viewport)
 */
export function useLazyLoadOnVisible<T>(
  key: string,
  loader: () => Promise<T>,
  options: LazyLoadOptions & {
    rootMargin?: string;
    threshold?: number;
  } = {}
): LazyLoadState<T> & {
  ref: React.RefObject<Element | null>;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  clear: () => void;
} {
  const { rootMargin = '50px', threshold = 0.1, ...lazyOptions } = options;
  const elementRef = useRef<Element>(null);
  const [isVisible, setIsVisible] = useState(false);

  const lazyState = useLazyLoad(key, loader, lazyOptions);

  // Intersection Observer
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold]);

  // Load when element becomes visible
  useEffect(() => {
    if (isVisible && !lazyState.isLoaded && !lazyState.loading && !lazyState.error) {
      lazyState.load();
    }
  }, [isVisible, lazyState]);

  return {
    ...lazyState,
    ref: elementRef
  };
}

/**
 * Hook for lazy loading multiple items in parallel
 */
export function useLazyLoadMultiple<T>(
  items: Array<{ key: string; loader: () => Promise<T> }>,
  options: LazyLoadOptions & {
    concurrency?: number;
    autoLoad?: boolean;
  } = {}
): {
  states: Map<string, LazyLoadState<T>>;
  loadAll: () => Promise<void>;
  loadItem: (key: string) => Promise<void>;
  clearAll: () => void;
  loadingCount: number;
  loadedCount: number;
  errorCount: number;
} {
  const { concurrency = 3, autoLoad = false } = options;
  const [states, setStates] = useState(new Map<string, LazyLoadState<T>>());

  // Initialize states for all items
  useEffect(() => {
    const newStates = new Map<string, LazyLoadState<T>>();
    items.forEach(({ key }) => {
      newStates.set(key, {
        data: null,
        loading: false,
        error: null,
        isLoaded: false,
        progress: 0,
        lastLoaded: null
      });
    });
    setStates(newStates);
  }, [items]);

  const updateState = useCallback((key: string, updates: Partial<LazyLoadState<T>>) => {
    setStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(key);
      if (currentState) {
        newStates.set(key, { ...currentState, ...updates });
      }
      return newStates;
    });
  }, []);

  const loadItem = useCallback(async (key: string) => {
    const item = items.find(i => i.key === key);
    if (!item) return;

    updateState(key, { loading: true, error: null });

    try {
      const data = await item.loader();
      updateState(key, {
        data,
        loading: false,
        isLoaded: true,
        progress: 100,
        lastLoaded: new Date()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      updateState(key, {
        loading: false,
        error: err,
        progress: 0
      });
    }
  }, [items, updateState]);

  const loadAll = useCallback(async () => {
    const batches: string[][] = [];
    const itemKeys = items.map(item => item.key);

    // Create batches for concurrent loading
    for (let i = 0; i < itemKeys.length; i += concurrency) {
      batches.push(itemKeys.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(key => loadItem(key)));
    }
  }, [items, concurrency, loadItem]);

  const clearAll = useCallback(() => {
    setStates(prev => {
      const newStates = new Map<string, LazyLoadState<T>>();
      prev.forEach((state, key) => {
        newStates.set(key, {
          data: null,
          loading: false,
          error: null,
          isLoaded: false,
          progress: 0,
          lastLoaded: null
        });
      });
      return newStates;
    });
  }, []);

  // Auto load all items
  useEffect(() => {
    if (autoLoad && items.length > 0) {
      loadAll();
    }
  }, [autoLoad, items.length, loadAll]);

  const loadingCount = Array.from(states.values()).filter(s => s.loading).length;
  const loadedCount = Array.from(states.values()).filter(s => s.isLoaded).length;
  const errorCount = Array.from(states.values()).filter(s => s.error).length;

  return {
    states,
    loadAll,
    loadItem,
    clearAll,
    loadingCount,
    loadedCount,
    errorCount
  };
}
