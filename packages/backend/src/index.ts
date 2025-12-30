import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { initScheduler } from './services/schedulerService';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import lubricationRoutes from './routes/lubrication';
import partRoutes from './routes/parts';
import replacementRoutes from './routes/replacements';
import notificationRoutes from './routes/notifications';
import uploadRoutes from './routes/uploads';
import settingsRoutes from './routes/settings';
import topicsRoutes from './routes/topics';
import maintenanceProceduresRoutes from './routes/maintenanceProcedures';
import inquiriesRoutes from './routes/inquiries';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lubrication', lubricationRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/replacements', replacementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/maintenance-procedures', maintenanceProceduresRoutes);
app.use('/api/inquiries', inquiriesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize scheduler
  if (process.env.NODE_ENV !== 'test') {
    initScheduler();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
