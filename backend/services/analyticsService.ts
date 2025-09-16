//import { PredictionService } from './predictionService';
import { PredictionService } from '@/services/predictionService';
//will this work whis is there no error here but an error with the way it is above?


export interface PerformanceMetrics {
  totalPredictions: number;
  successfulPredictions: number;
  accuracy: number;
  averageConfidence: number;
  bestGameType: string;
  bestStrategy: string;
  period: string;
}

export interface TrendData {
  metric: string;
  data: Array<{
    date: string;
    value: number;
    count: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
}

export interface PatternAnalysis {
  gameType: string;
  patterns: Array<{
    pattern: string;
    occurrences: number;
    successRate: number;
    lastSeen: string;
    confidence: number;
  }>;
  totalPatterns: number;
  avgSuccessRate: number;
}

export interface AccuracyData {
  period: string;
  granularity: string;
  data: Array<{
    timestamp: string;
    accuracy: number;
    totalPredictions: number;
    successfulPredictions: number;
  }>;
}

export interface DashboardSummary {
  todayStats: {
    predictions: number;
    accuracy: number;
    bestGameType: string;
  };
  weekStats: {
    predictions: number;
    accuracy: number;
    trend: string;
  };
  monthStats: {
    predictions: number;
    accuracy: number;
    improvement: number;
  };
  recentActivity: Array<{
    id: string;
    gameType: string;
    numbers: number[];
    success: boolean;
    timestamp: string;
  }>;
}

export class AnalyticsService {
  private predictionService: PredictionService;

  constructor() {
    this.predictionService = new PredictionService();
  }

  async getPerformanceAnalytics(
    userId: string | undefined,
    options: { period: string; gameType?: string; strategy?: string }
  ): Promise<PerformanceMetrics> {
    try {
      // Get prediction history for the specified period
      const history = await this.predictionService.getPredictionHistory(userId, {
        page: 1,
        limit: 1000, // Get more data for analytics
        gameType: options.gameType,
        status: 'all'
      });

      const predictions = history.predictions;

      // Calculate metrics
      const totalPredictions = predictions.length;
      const successfulPredictions = predictions.filter(p => p.result === 'win').length;
      const accuracy = totalPredictions > 0 ? (successfulPredictions / totalPredictions) * 100 : 0;

      const averageConfidence = predictions.length > 0
        ? predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length
        : 0;

      // Find best performing game type and strategy
      const gameTypeStats = this.calculateGameTypeStats(predictions);
      const strategyStats = this.calculateStrategyStats(predictions);

      const bestGameType = Object.entries(gameTypeStats)
        .sort(([,a], [,b]) => b.accuracy - a.accuracy)[0]?.[0] || 'none';

      const bestStrategy = Object.entries(strategyStats)
        .sort(([,a], [,b]) => b.accuracy - a.accuracy)[0]?.[0] || 'none';

      return {
        totalPredictions,
        successfulPredictions,
        accuracy: Math.round(accuracy * 100) / 100,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        bestGameType,
        bestStrategy,
        period: options.period
      };

    } catch (error) {
      console.error('Error calculating performance analytics:', error);
      throw new Error('Failed to calculate performance analytics');
    }
  }

  async getTrendAnalysis(
    userId: string | undefined,
    options: { period: string; metric: string; gameType?: string }
  ): Promise<TrendData> {
    try {
      const history = await this.predictionService.getPredictionHistory(userId, {
        page: 1,
        limit: 1000,
        gameType: options.gameType,
        status: 'all'
      });

      const predictions = history.predictions;

      // Group predictions by date
      const dailyData = this.groupByDate(predictions, options.metric);

      // Calculate trend
      const trend = this.calculateTrend(dailyData);
      const changePercent = this.calculateChangePercent(dailyData);

      return {
        metric: options.metric,
        data: dailyData,
        trend,
        changePercent: Math.round(changePercent * 100) / 100
      };

    } catch (error) {
      console.error('Error calculating trend analysis:', error);
      throw new Error('Failed to calculate trend analysis');
    }
  }

  async getPatternAnalysis(
    userId: string | undefined,
    options: { gameType: string; minOccurrences: number; period: string }
  ): Promise<PatternAnalysis> {
    try {
      const history = await this.predictionService.getPredictionHistory(userId, {
        page: 1,
        limit: 1000,
        gameType: options.gameType,
        status: 'all'
      });

      const predictions = history.predictions;

      // Analyze patterns in successful predictions
      const successfulPredictions = predictions.filter(p => p.result === 'win');
      const patterns = this.analyzePatterns(successfulPredictions, options.minOccurrences);

      const totalPatterns = patterns.length;
      const avgSuccessRate = totalPatterns > 0
        ? patterns.reduce((sum, p) => sum + p.successRate, 0) / totalPatterns
        : 0;

      return {
        gameType: options.gameType,
        patterns,
        totalPatterns,
        avgSuccessRate: Math.round(avgSuccessRate * 100) / 100
      };

    } catch (error) {
      console.error('Error analyzing patterns:', error);
      throw new Error('Failed to analyze patterns');
    }
  }

  async getAccuracyOverTime(
    userId: string | undefined,
    options: { period: string; granularity: string }
  ): Promise<AccuracyData> {
    try {
      const history = await this.predictionService.getPredictionHistory(userId, {
        page: 1,
        limit: 1000,
        status: 'all'
      });

      const predictions = history.predictions;

      // Group by time period and calculate accuracy
      const accuracyData = this.calculateAccuracyOverTime(predictions, options.granularity);

      return {
        period: options.period,
        granularity: options.granularity,
        data: accuracyData
      };

    } catch (error) {
      console.error('Error calculating accuracy over time:', error);
      throw new Error('Failed to calculate accuracy over time');
    }
  }

  async generateReport(
    userId: string,
    options: { reportType: string; period: string; format: string }
  ): Promise<any> {
    try {
      const reportData: any = {
        reportType: options.reportType,
        period: options.period,
        generatedAt: new Date().toISOString(),
        userId
      };

      switch (options.reportType) {
        case 'performance':
          reportData.performance = await this.getPerformanceAnalytics(userId, { period: options.period });
          break;

        case 'trends':
          reportData.trends = await this.getTrendAnalysis(userId, {
            period: options.period,
            metric: 'accuracy'
          });
          break;

        case 'patterns':
          reportData.patterns = await this.getPatternAnalysis(userId, {
            gameType: 'pick3',
            minOccurrences: 3,
            period: options.period
          });
          break;

        case 'comprehensive':
          reportData.performance = await this.getPerformanceAnalytics(userId, { period: options.period });
          reportData.trends = await this.getTrendAnalysis(userId, {
            period: options.period,
            metric: 'accuracy'
          });
          reportData.accuracy = await this.getAccuracyOverTime(userId, {
            period: options.period,
            granularity: 'daily'
          });
          break;

        default:
          throw new Error('Invalid report type');
      }

      return reportData;

    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }

  async getDashboardSummary(userId: string | undefined): Promise<DashboardSummary> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get recent predictions
      const history = await this.predictionService.getPredictionHistory(userId, {
        page: 1,
        limit: 50,
        status: 'all'
      });

      const predictions = history.predictions;

      // Calculate today's stats
      const todayPredictions = predictions.filter(p => p.createdAt >= today);
      const todaySuccessful = todayPredictions.filter(p => p.result === 'win').length;
      const todayAccuracy = todayPredictions.length > 0 ? (todaySuccessful / todayPredictions.length) * 100 : 0;

      // Calculate week's stats
      const weekPredictions = predictions.filter(p => p.createdAt >= weekAgo);
      const weekSuccessful = weekPredictions.filter(p => p.result === 'win').length;
      const weekAccuracy = weekPredictions.length > 0 ? (weekSuccessful / weekPredictions.length) * 100 : 0;

      // Calculate month's stats
      const monthPredictions = predictions.filter(p => p.createdAt >= monthAgo);
      const monthSuccessful = monthPredictions.filter(p => p.result === 'win').length;
      const monthAccuracy = monthPredictions.length > 0 ? (monthSuccessful / monthPredictions.length) * 100 : 0;

      // Calculate improvement (comparing last 15 days to previous 15 days)
      const last15Days = predictions.filter(p => {
        const date = p.createdAt;
        return date >= new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
      });
      const previous15Days = predictions.filter(p => {
        const date = p.createdAt;
        return date >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) &&
               date < new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
      });

      const last15Accuracy = last15Days.length > 0 ?
        (last15Days.filter(p => p.result === 'win').length / last15Days.length) * 100 : 0;
      const previous15Accuracy = previous15Days.length > 0 ?
        (previous15Days.filter(p => p.result === 'win').length / previous15Days.length) * 100 : 0;
      const improvement = last15Accuracy - previous15Accuracy;

      // Get recent activity
      const recentActivity = predictions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          gameType: p.gameType,
          numbers: p.numbers,
          success: p.result === 'win',
          timestamp: p.createdAt.toISOString()
        }));

      // Find best game type today
      const todayGameTypes = todayPredictions.reduce((acc, p) => {
        if (!acc[p.gameType]) acc[p.gameType] = { total: 0, successful: 0 };
        acc[p.gameType].total++;
        if (p.result === 'win') acc[p.gameType].successful++;
        return acc;
      }, {} as Record<string, { total: number; successful: number }>);

      const bestGameType = (Object.entries(todayGameTypes) as [string, { total: number; successful: number }][])
        .sort(([, a], [, b]) => (b.successful / b.total) - (a.successful / a.total))[0]?.[0] || 'none';

      return {
        todayStats: {
          predictions: todayPredictions.length,
          accuracy: Math.round(todayAccuracy * 100) / 100,
          bestGameType
        },
        weekStats: {
          predictions: weekPredictions.length,
          accuracy: Math.round(weekAccuracy * 100) / 100,
          trend: weekAccuracy > monthAccuracy ? 'improving' : weekAccuracy < monthAccuracy ? 'declining' : 'stable'
        },
        monthStats: {
          predictions: monthPredictions.length,
          accuracy: Math.round(monthAccuracy * 100) / 100,
          improvement: Math.round(improvement * 100) / 100
        },
        recentActivity
      };

    } catch (error) {
      console.error('Error generating dashboard summary:', error);
      throw new Error('Failed to generate dashboard summary');
    }
  }

  private calculateGameTypeStats(predictions: any[]): Record<string, { total: number; successful: number; accuracy: number }> {
    const stats = predictions.reduce((acc, p) => {
      if (!acc[p.gameType]) acc[p.gameType] = { total: 0, successful: 0 };
      acc[p.gameType].total++;
      if (p.result === 'win') acc[p.gameType].successful++;
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

    // Calculate accuracy for each game type
    Object.keys(stats).forEach(gameType => {
      stats[gameType].accuracy = stats[gameType].total > 0
        ? (stats[gameType].successful / stats[gameType].total) * 100
        : 0;
    });

    return stats;
  }

  private calculateStrategyStats(predictions: any[]): Record<string, { total: number; successful: number; accuracy: number }> {
    const stats = predictions.reduce((acc, p) => {
      if (!acc[p.strategy]) acc[p.strategy] = { total: 0, successful: 0 };
      acc[p.strategy].total++;
      if (p.result === 'win') acc[p.strategy].successful++;
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

    // Calculate accuracy for each strategy
    Object.keys(stats).forEach(strategy => {
      stats[strategy].accuracy = stats[strategy].total > 0
        ? (stats[strategy].successful / stats[strategy].total) * 100
        : 0;
    });

    return stats;
  }

  private groupByDate(predictions: any[], metric: string): Array<{ date: string; value: number; count: number }> {
    const grouped: Record<string, { total: number; successful: number }> = predictions.reduce((acc, p) => {
      const date = p.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { total: 0, successful: 0 };

      acc[date].total++;
      if (p.result === 'win') acc[date].successful++;
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        value: metric === 'accuracy' ? (stats.total > 0 ? (stats.successful / stats.total) * 100 : 0) : stats.total,
        count: stats.total
      }));
  }

  private calculateTrend(data: Array<{ date: string; value: number; count: number }>): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (Math.abs(diff) < 1) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  private calculateChangePercent(data: Array<{ date: string; value: number; count: number }>): number {
    if (data.length < 2) return 0;

    const first = data[0].value;
    const last = data[data.length - 1].value;

    if (first === 0) return last > 0 ? 100 : 0;
    return ((last - first) / first) * 100;
  }

  private analyzePatterns(predictions: any[], minOccurrences: number): Array<{
    pattern: string;
    occurrences: number;
    successRate: number;
    lastSeen: string;
    confidence: number;
  }> {
    const patternMap = new Map<string, {
      occurrences: number;
      successes: number;
      lastSeen: string;
      timestamps: string[];
    }>();

    // Analyze patterns in prediction numbers
    predictions.forEach(p => {
      const numbers = p.numbers.sort((a: number, b: number) => a - b);
      const pattern = numbers.join('-');

      const existing = patternMap.get(pattern) || {
        occurrences: 0,
        successes: 0,
        lastSeen: p.createdAt.toISOString(),
        timestamps: [] as string[]
      };

      existing.occurrences++;
      existing.successes++;
      existing.timestamps.push(p.createdAt.toISOString());

      if (p.createdAt > new Date(existing.lastSeen)) {
        existing.lastSeen = p.createdAt.toISOString();
      }

      patternMap.set(pattern, existing);
    });

    // Convert to array and filter by minimum occurrences
    return Array.from(patternMap.entries())
      .filter(([, stats]) => stats.occurrences >= minOccurrences)
      .map(([pattern, stats]) => ({
        pattern,
        occurrences: stats.occurrences,
        successRate: (stats.successes / stats.occurrences) * 100,
        lastSeen: stats.lastSeen,
        confidence: Math.min(stats.occurrences / 10, 1) * 100 // Confidence based on occurrences
      }))
      .sort((a, b) => b.successRate - a.successRate);
  }

  private calculateAccuracyOverTime(predictions: any[], granularity: string): Array<{
    timestamp: string;
    accuracy: number;
    totalPredictions: number;
    successfulPredictions: number;
  }> {
    const grouped: Record<string, { total: number; successful: number }> = predictions.reduce((acc, p) => {
      let key: string;

      if (granularity === 'daily') {
        key = p.createdAt.toISOString().split('T')[0];
      } else if (granularity === 'weekly') {
        const date = p.createdAt;
        const weekStart = new Date(date.getTime() - date.getDay() * 24 * 60 * 60 * 1000);
        key = weekStart.toISOString().split('T')[0];
      } else if (granularity === 'monthly') {
        const date = p.createdAt;
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = p.createdAt.toISOString().split('T')[0]; // Default to daily
      }

      if (!acc[key]) acc[key] = { total: 0, successful: 0 };
      acc[key].total++;
      if (p.result === 'win') acc[key].successful++;
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, stats]) => ({
        timestamp,
        accuracy: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
        totalPredictions: stats.total,
        successfulPredictions: stats.successful
      }));
  }
}