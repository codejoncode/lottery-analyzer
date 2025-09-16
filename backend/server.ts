import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import route modules
import predictionsRouter from './routes/predictions';
import analyticsRouter from './routes/analytics';
import dataRouter from './routes/data';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/super_predictor';

    console.log('📊 Attempting to connect to MongoDB...');
    await mongoose.connect(mongoURI, {
      // Modern MongoDB connection options
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('📊 MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Continuing without database connection for development...');
    // Don't exit in development mode
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// API Routes
app.use('/api/v1/predictions', predictionsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/data', dataRouter);
app.use('/api/v1/auth', authRouter);

// Socket.IO setup for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join analytics room for chart updates
  socket.on('join-analytics', () => {
    socket.join('analytics');
    console.log(`📊 Client ${socket.id} joined analytics room`);
  });

  // Handle prediction updates
  socket.on('prediction-update', (data) => {
    console.log('📈 Prediction update received:', data);
    // Broadcast to all clients in analytics room
    io.to('analytics').emit('prediction-data', data);
  });

  // Handle analytics data updates
  socket.on('analytics-update', (data) => {
    console.log('📊 Analytics update received:', data);
    // Broadcast to all clients in analytics room
    io.to('analytics').emit('analytics-data', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// Start server with database connection
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Super Predictor API Server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket server ready for real-time updates`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Received shutdown signal, closing server gracefully...');

  try {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Only handle shutdown signals in production
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// Start the server
startServer();

export default app;