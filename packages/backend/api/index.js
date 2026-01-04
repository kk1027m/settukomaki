// Vercel serverless function handler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
const authRoutes = require('../dist/routes/auth').default;
const userRoutes = require('../dist/routes/users').default;
const lubricationRoutes = require('../dist/routes/lubrication').default;
const partRoutes = require('../dist/routes/parts').default;
const replacementRoutes = require('../dist/routes/replacements').default;
const notificationRoutes = require('../dist/routes/notifications').default;
const uploadRoutes = require('../dist/routes/uploads').default;
const settingsRoutes = require('../dist/routes/settings').default;
const topicsRoutes = require('../dist/routes/topics').default;
const maintenanceProceduresRoutes = require('../dist/routes/maintenanceProcedures').default;
const inquiriesRoutes = require('../dist/routes/inquiries').default;

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
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Export for Vercel
module.exports = app;
