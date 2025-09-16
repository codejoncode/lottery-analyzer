import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiting configurations
export const createRateLimit = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100,
  message?: string
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too Many Requests',
      message: message || `Too many requests from this IP, please try again after ${Math.ceil(windowMs / 60000)} minutes`,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: message || `Too many requests from this IP, please try again after ${Math.ceil(windowMs / 60000)} minutes`,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// General API rate limiting
export const apiLimiter = createRateLimit(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  'API rate limit exceeded. Please try again later.'
);

// Stricter rate limiting for authentication endpoints
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// Rate limiting for prediction generation (expensive operations)
export const predictionLimiter = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 predictions per minute
  'Prediction rate limit exceeded. Please wait before generating more predictions.'
);

// Rate limiting for data export (resource intensive)
export const exportLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  3, // 3 exports per 5 minutes
  'Export rate limit exceeded. Please wait before requesting another export.'
);

// Rate limiting for analytics (database intensive)
export const analyticsLimiter = createRateLimit(
  60 * 1000, // 1 minute
  20, // 20 analytics requests per minute
  'Analytics rate limit exceeded. Please try again in a minute.'
);

// Rate limiting for data operations (import/export)
export const dataLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  5, // 5 data operations per 5 minutes
  'Data operation rate limit exceeded. Please wait before performing another data operation.'
);

// Custom rate limiter with IP-based tracking
export const createCustomLimiter = (
  windowMs: number,
  maxRequests: number,
  keyGenerator?: (req: Request) => string
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: keyGenerator || ((req) => req.ip || 'unknown'),
    message: {
      error: 'Rate Limit Exceeded',
      message: `Too many requests. Maximum ${maxRequests} requests per ${Math.ceil(windowMs / 60000)} minutes.`,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// User-based rate limiting (requires authentication)
export const userLimiter = (maxRequests: number, windowMs: number = 60 * 1000) => {
  return (req: Request, res: Response, next: any) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return next();
    }

    return createCustomLimiter(
      windowMs,
      maxRequests,
      () => userId
    )(req, res, next);
  };
};