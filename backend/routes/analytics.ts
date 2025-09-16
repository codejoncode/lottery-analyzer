import express, { Request, Response } from 'express';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { analyticsLimiter } from '@/middleware/rateLimit';
import { AnalyticsService } from '@/services/analyticsService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();
const analyticsService = new AnalyticsService();

// Apply rate limiting to all analytics routes
router.use(analyticsLimiter);

// Get performance analytics
router.get('/performance', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { period = '30d', gameType, strategy } = req.query;

    const performance = await analyticsService.getPerformanceAnalytics(userId, {
      period: period as string,
      gameType: gameType as string,
      strategy: strategy as string
    });

    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      error: 'Analytics Retrieval Failed',
      message: 'Unable to retrieve performance analytics',
      timestamp: new Date().toISOString()
    });
  }
});

// Get trend analysis
router.get('/trends', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { period = '90d', metric = 'accuracy', gameType } = req.query;

    const trends = await analyticsService.getTrendAnalysis(userId, {
      period: period as string,
      metric: metric as string,
      gameType: gameType as string
    });

    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trend analysis error:', error);
    res.status(500).json({
      error: 'Trend Analysis Failed',
      message: 'Unable to analyze trends',
      timestamp: new Date().toISOString()
    });
  }
});

// Get pattern analysis
router.get('/patterns', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { gameType, minOccurrences = 3, period = '180d' } = req.query;

    if (!gameType || !['pick3', 'pick4'].includes(gameType as string)) {
      return res.status(400).json({
        error: 'Invalid Game Type',
        message: 'Game type must be either pick3 or pick4',
        timestamp: new Date().toISOString()
      });
    }

    const patterns = await analyticsService.getPatternAnalysis(userId, {
      gameType: gameType as string,
      minOccurrences: parseInt(minOccurrences as string, 10),
      period: period as string
    });

    res.json({
      success: true,
      data: patterns,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Pattern analysis error:', error);
    res.status(500).json({
      error: 'Pattern Analysis Failed',
      message: 'Unable to analyze patterns',
      timestamp: new Date().toISOString()
    });
  }
});

// Get prediction accuracy over time
router.get('/accuracy', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { period = '30d', granularity = 'daily' } = req.query;

    const accuracy = await analyticsService.getAccuracyOverTime(userId, {
      period: period as string,
      granularity: granularity as string
    });

    res.json({
      success: true,
      data: accuracy,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Accuracy analysis error:', error);
    res.status(500).json({
      error: 'Accuracy Analysis Failed',
      message: 'Unable to analyze prediction accuracy',
      timestamp: new Date().toISOString()
    });
  }
});

// Generate analytics report
router.post('/reports', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { reportType, period = '30d', format = 'json' } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User authentication required for report generation',
        timestamp: new Date().toISOString()
      });
    }

    if (!['performance', 'trends', 'patterns', 'comprehensive'].includes(reportType)) {
      return res.status(400).json({
        error: 'Invalid Report Type',
        message: 'Report type must be performance, trends, patterns, or comprehensive',
        timestamp: new Date().toISOString()
      });
    }

    const report = await analyticsService.generateReport(userId, {
      reportType,
      period,
      format
    });

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      error: 'Report Generation Failed',
      message: 'Unable to generate analytics report',
      timestamp: new Date().toISOString()
    });
  }
});

// Get dashboard summary
router.get('/dashboard', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    const dashboard = await analyticsService.getDashboardSummary(userId);

    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      error: 'Dashboard Summary Failed',
      message: 'Unable to retrieve dashboard summary',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;