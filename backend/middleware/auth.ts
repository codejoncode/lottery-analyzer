import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Access Token Required',
        message: 'Please provide a valid authentication token',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Authentication service is not properly configured',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token Expired',
        message: 'Your authentication token has expired. Please login again.',
        timestamp: new Date().toISOString()
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid Token',
        message: 'The provided authentication token is invalid',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Authentication error:', error);
      res.status(500).json({
        error: 'Authentication Error',
        message: 'An error occurred during authentication',
        timestamp: new Date().toISOString()
      });
    }
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'You must be authenticated to access this resource',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      res.status(403).json({
        error: 'Insufficient Permissions',
        message: `This resource requires ${requiredRole} role`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }

  next();
};