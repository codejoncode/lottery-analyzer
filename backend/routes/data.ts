import express, { Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { dataLimiter } from '@/middleware/rateLimit';
import { DataService } from '@/services/dataService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();
const dataService = new DataService();

// Apply rate limiting to all data routes
router.use(dataLimiter);

// Import prediction data
router.post('/import', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { data, format, gameType } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User authentication required for data import',
        timestamp: new Date().toISOString()
      });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: 'Invalid Data',
        message: 'Please provide an array of prediction data to import',
        timestamp: new Date().toISOString()
      });
    }

    if (!['csv', 'json', 'xlsx'].includes(format)) {
      return res.status(400).json({
        error: 'Invalid Format',
        message: 'Supported formats: csv, json, xlsx',
        timestamp: new Date().toISOString()
      });
    }

    // Use DataService for actual import
    const result = await dataService.importData(userId, data, format, gameType);

    res.json({
      success: true,
      message: `Successfully imported ${result.imported} predictions${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
      data: {
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
        format,
        gameType: gameType || 'mixed'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data import error:', error);
    res.status(500).json({
      error: 'Import Failed',
      message: 'Unable to import prediction data',
      timestamp: new Date().toISOString()
    });
  }
});

// Export prediction data
router.get('/export', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { format = 'json', gameType, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User authentication required for data export',
        timestamp: new Date().toISOString()
      });
    }

    if (!['csv', 'json', 'xlsx'].includes(format as string)) {
      return res.status(400).json({
        error: 'Invalid Format',
        message: 'Supported formats: csv, json, xlsx',
        timestamp: new Date().toISOString()
      });
    }

    // Use DataService for actual export
    const exportData = await dataService.exportData(userId, {
      format: format as 'json' | 'csv' | 'xlsx',
      gameType: gameType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: exportData,
      format,
      count: exportData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      error: 'Export Failed',
      message: 'Unable to export prediction data',
      timestamp: new Date().toISOString()
    });
  }
});

// Validate data format
router.post('/validate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { data, format } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User authentication required for data validation',
        timestamp: new Date().toISOString()
      });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({
        error: 'Invalid Data Format',
        message: 'Data must be an array of prediction objects',
        timestamp: new Date().toISOString()
      });
    }

    // Use DataService for validation
    const validationResult = dataService.validateData(data);

    res.json({
      success: true,
      data: validationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data validation error:', error);
    res.status(500).json({
      error: 'Validation Failed',
      message: 'Unable to validate prediction data',
      timestamp: new Date().toISOString()
    });
  }
});

// Get data statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'User authentication required for data statistics',
        timestamp: new Date().toISOString()
      });
    }

    // Use DataService for statistics
    const stats = await dataService.getDataStats(userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Data statistics error:', error);
    res.status(500).json({
      error: 'Statistics Retrieval Failed',
      message: 'Unable to retrieve data statistics',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;