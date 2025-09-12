import { ColumnAnalyzer, type Draw } from './scoringSystem';

export interface LiveUpdateConfig {
  updateInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number;
}

export interface LiveStatsUpdate {
  timestamp: Date;
  column: number;
  hotNumbers: number[];
  coldNumbers: number[];
  trendingUp: number[];
  trendingDown: number[];
  recentActivity: {
    number: number;
    drawsSinceLast: number;
    isNewHot: boolean;
  }[];
}

export class LiveColumnStatsManager {
  private columnAnalyzer: ColumnAnalyzer;
  private updateInterval: number;
  private maxRetries: number;
  private retryDelay: number;
  private isRunning: boolean = false;
  private updateCallbacks: ((update: LiveStatsUpdate) => void)[] = [];
  private lastStats: Map<number, LiveStatsUpdate> = new Map();

  constructor(
    draws: Draw[],
    config: LiveUpdateConfig = {
      updateInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 5000 // 5 seconds
    }
  ) {
    this.columnAnalyzer = new ColumnAnalyzer(draws);
    this.updateInterval = config.updateInterval;
    this.maxRetries = config.maxRetries;
    this.retryDelay = config.retryDelay;
  }

  /**
   * Start live updates
   */
  startLiveUpdates(): void {
    if (this.isRunning) {
      console.warn('Live updates are already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting live column statistics updates...');

    this.scheduleNextUpdate();
  }

  /**
   * Stop live updates
   */
  stopLiveUpdates(): void {
    this.isRunning = false;
    console.log('⏹️ Stopped live column statistics updates');
  }

  /**
   * Subscribe to live updates
   */
  onUpdate(callback: (update: LiveStatsUpdate) => void): () => void {
    this.updateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Force immediate update
   */
  async forceUpdate(): Promise<void> {
    await this.performUpdate();
  }

  /**
   * Get current live stats for a column
   */
  getCurrentStats(column: number): LiveStatsUpdate | null {
    return this.lastStats.get(column) || null;
  }

  /**
   * Check if live updates are running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  private scheduleNextUpdate(): void {
    if (!this.isRunning) return;

    setTimeout(async () => {
      if (this.isRunning) {
        await this.performUpdate();
        this.scheduleNextUpdate();
      }
    }, this.updateInterval);
  }

  private async performUpdate(): Promise<void> {
    try {
      // Update all columns
      for (let column = 1; column <= 6; column++) {
        const update = await this.generateColumnUpdate(column);

        // Check if there are significant changes
        const lastUpdate = this.lastStats.get(column);
        if (this.hasSignificantChanges(lastUpdate || null, update)) {
          this.lastStats.set(column, update);
          this.notifyCallbacks(update);
        }
      }
    } catch (error) {
      console.error('Error during live update:', error);
      // Could implement retry logic here
    }
  }

  private async generateColumnUpdate(column: number): Promise<LiveStatsUpdate> {
    const analysis = this.columnAnalyzer.analyzeColumn(column);
    const trend = this.columnAnalyzer.detectColumnTrend(column);

    // Get hot numbers (recent appearances)
    const hotNumbers: number[] = [];
    const coldNumbers: number[] = [];
    const trendingUp: number[] = [];
    const trendingDown: number[] = [];

    analysis.numberStats.forEach((stats, key) => {
      if (stats.isHot) hotNumbers.push(stats.number);
      if (stats.isCold) coldNumbers.push(stats.number);

      if (stats.trend === 'increasing') trendingUp.push(stats.number);
      if (stats.trend === 'decreasing') trendingDown.push(stats.number);
    });

    // Sort by recency for hot/cold numbers
    hotNumbers.sort((a, b) => {
      const statsA = analysis.numberStats.get(`${column}-${a}`);
      const statsB = analysis.numberStats.get(`${column}-${b}`);
      return (statsB?.drawsSinceLastAppearance || 0) - (statsA?.drawsSinceLastAppearance || 0);
    });

    coldNumbers.sort((a, b) => {
      const statsA = analysis.numberStats.get(`${column}-${a}`);
      const statsB = analysis.numberStats.get(`${column}-${b}`);
      return (statsB?.drawsSinceLastAppearance || 0) - (statsA?.drawsSinceLastAppearance || 0);
    });

    // Get recent activity (numbers that appeared in last few draws)
    const recentActivity = Array.from(analysis.numberStats.values())
      .filter(stats => stats.drawsSinceLastAppearance <= 3)
      .map(stats => ({
        number: stats.number,
        drawsSinceLast: stats.drawsSinceLastAppearance,
        isNewHot: stats.isHot && stats.drawsSinceLastAppearance === 0
      }))
      .sort((a, b) => a.drawsSinceLast - b.drawsSinceLast);

    return {
      timestamp: new Date(),
      column,
      hotNumbers: hotNumbers.slice(0, 5), // Top 5
      coldNumbers: coldNumbers.slice(0, 5), // Top 5
      trendingUp,
      trendingDown,
      recentActivity
    };
  }

  private hasSignificantChanges(lastUpdate: LiveStatsUpdate | null, newUpdate: LiveStatsUpdate): boolean {
    if (!lastUpdate) return true;

    // Check if hot/cold numbers changed significantly
    const hotChanged = !this.arraysEqual(lastUpdate.hotNumbers, newUpdate.hotNumbers);
    const coldChanged = !this.arraysEqual(lastUpdate.coldNumbers, newUpdate.coldNumbers);

    // Check if there are new hot numbers
    const newHotNumbers = newUpdate.recentActivity.filter(activity => activity.isNewHot);
    const hasNewHot = newHotNumbers.length > 0;

    return hotChanged || coldChanged || hasNewHot;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  private notifyCallbacks(update: LiveStatsUpdate): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }

  /**
   * Get update statistics
   */
  getStats(): {
    isRunning: boolean;
    updateInterval: number;
    subscriberCount: number;
    lastUpdateTimes: { [column: number]: Date };
  } {
    const lastUpdateTimes: { [column: number]: Date } = {};
    this.lastStats.forEach((update, column) => {
      lastUpdateTimes[column] = update.timestamp;
    });

    return {
      isRunning: this.isRunning,
      updateInterval: this.updateInterval,
      subscriberCount: this.updateCallbacks.length,
      lastUpdateTimes
    };
  }
}

/**
 * React hook for using live column stats (if using React)
 */
export function useLiveColumnStats(draws: Draw[], config?: LiveUpdateConfig) {
  const manager = new LiveColumnStatsManager(draws, config);

  return {
    start: () => manager.startLiveUpdates(),
    stop: () => manager.stopLiveUpdates(),
    onUpdate: manager.onUpdate.bind(manager),
    getCurrentStats: manager.getCurrentStats.bind(manager),
    forceUpdate: manager.forceUpdate.bind(manager),
    getStats: manager.getStats.bind(manager)
  };
}
