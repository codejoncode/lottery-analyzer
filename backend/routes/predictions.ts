import express, { Request, Response } from 'express';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { predictionLimiter } from '@/middleware/rateLimit';
import { PredictionService } from '@/services/predictionService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();
const predictionService = new PredictionService();

// Apply rate limiting to all prediction routes
router.use(predictionLimiter);

// Generate new prediction
router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { numbers, gameType, strategy } = req.body;
    const userId = req.user?.id;

    if (!gameType || !['pick3', 'pick4'].includes(gameType.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid Game Type',
        message: 'Game type must be either pick3 or pick4',
        timestamp: new Date().toISOString()
      });
    }

    // Use enhanced prediction generation
    const prediction = await predictionService.generateEnhancedPrediction({
      numbers: numbers || [], // Numbers are optional for enhanced predictions
      gameType: gameType.toLowerCase(),
      strategy: strategy || 'statistical',
      userId
    });

    res.status(201).json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Prediction generation error:', error);
    res.status(500).json({
      error: 'Prediction Generation Failed',
      message: 'Unable to generate prediction at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// Generate enhanced prediction with 20 boxes, top 3 per column, and top 5 overall
router.post('/enhanced', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { gameType, strategy } = req.body;
    const userId = req.user?.id;

    if (!gameType || !['pick3', 'pick4'].includes(gameType.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid Game Type',
        message: 'Game type must be either pick3 or pick4',
        timestamp: new Date().toISOString()
      });
    }

    // Generate enhanced prediction with all requested features
    const enhancedPrediction = await predictionService.generateEnhancedPrediction({
      numbers: [], // No specific numbers needed for enhanced predictions
      gameType: gameType.toLowerCase(),
      strategy: strategy || 'statistical',
      userId
    });

    res.status(201).json({
      success: true,
      data: enhancedPrediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced prediction generation error:', error);
    res.status(500).json({
      error: 'Enhanced Prediction Generation Failed',
      message: 'Unable to generate enhanced prediction at this time',
      timestamp: new Date().toISOString()
    });
  }
});

// Batch prediction generation
router.post('/batch', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { predictions } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        error: 'Invalid Input',
        message: 'Please provide an array of predictions to generate',
        timestamp: new Date().toISOString()
      });
    }

    if (predictions.length > 10) {
      return res.status(400).json({
        error: 'Batch Size Too Large',
        message: 'Maximum 10 predictions allowed per batch',
        timestamp: new Date().toISOString()
      });
    }

    const results = await predictionService.generateBatchPredictions(predictions, userId);

    res.json({
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({
      error: 'Batch Prediction Failed',
      message: 'Unable to generate batch predictions',
      timestamp: new Date().toISOString()
    });
  }
});

// Get prediction by ID
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const prediction = await predictionService.getPredictionById(id, userId);

    if (!prediction) {
      return res.status(404).json({
        error: 'Prediction Not Found',
        message: 'The requested prediction could not be found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json({
      error: 'Prediction Retrieval Failed',
      message: 'Unable to retrieve prediction',
      timestamp: new Date().toISOString()
    });
  }
});

// Get prediction history
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, gameType, status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 per page

    const result = await predictionService.getPredictionHistory(userId, {
      page: pageNum,
      limit: limitNum,
      gameType: gameType as string,
      status: status as string
    });

    res.json({
      success: true,
      data: result.predictions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: Math.ceil(result.total / limitNum)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get prediction history error:', error);
    res.status(500).json({
      error: 'History Retrieval Failed',
      message: 'Unable to retrieve prediction history',
      timestamp: new Date().toISOString()
    });
  }
});

// Delete prediction
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const deleted = await predictionService.deletePrediction(id, userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Prediction Not Found',
        message: 'The prediction could not be found or you do not have permission to delete it',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Prediction deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete prediction error:', error);
    res.status(500).json({
      error: 'Deletion Failed',
      message: 'Unable to delete prediction',
      timestamp: new Date().toISOString()
    });
  }
});

// Get prediction statistics
router.get('/stats/overview', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { period = '30d' } = req.query;

    const stats = await predictionService.getPredictionStats(userId, { period: period as string });

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get prediction stats error:', error);
    res.status(500).json({
      error: 'Statistics Retrieval Failed',
      message: 'Unable to retrieve prediction statistics',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;