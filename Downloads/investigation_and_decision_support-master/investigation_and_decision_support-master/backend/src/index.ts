import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { logger } from './utils/logger';
import { seedDatabase } from './utils/seedData';
import { db } from './utils/db';
import { initWebSocket } from './utils/websocket';
import { apiLimiter } from './middleware/rateLimiter';

// Load environment variables FIRST
dotenv.config();

// Validate critical secrets
if (!process.env.JWT_SECRET) {
  logger.warn('⚠️  JWT_SECRET not set in environment — using insecure default. Set JWT_SECRET in .env for production.');
}

if (!process.env.DATABASE_URL) {
  logger.warn('⚠️  DATABASE_URL not set — Prisma will use default or fail to connect.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Global API rate limiter
app.use('/api', apiLimiter);

// Request logger middleware
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Import routes
import authRoutes from './routes/authRoutes';
import firRoutes from './routes/firRoutes';
import criminalRoutes from './routes/criminalRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import auditRoutes from './routes/auditRoutes';
import aiRoutes from './routes/aiRoutes';
import swaggerRoutes from './routes/swagger';

app.use('/api/auth', authRoutes);
app.use('/api/fir', firRoutes);
app.use('/api/criminals', criminalRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', swaggerRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    service: 'KSP Intel Core API',
    version: '2.0.0',
    websocket: 'ws://localhost:5000/ws',
    documentation: '/api/docs',
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled server error', { error: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize database connection, WebSocket, and start server
const startServer = async () => {
  try {
    await db.$connect();
    logger.info('✅ Connected to PostgreSQL database successfully.');

    await seedDatabase();

    // Create HTTP server (needed for WebSocket co-hosting)
    const server = http.createServer(app);

    // Attach WebSocket server to the same HTTP server
    initWebSocket(server);

    server.listen(PORT, () => {
      logger.info(`🚀 KSP Intel Core Server running on http://localhost:${PORT}`);
      logger.info(`📡 WebSocket channel active at ws://localhost:${PORT}/ws`);
      logger.info(`📚 API Documentation at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('❌ Failed to connect to database or start server', { error });
    process.exit(1);
  }
};

startServer();
