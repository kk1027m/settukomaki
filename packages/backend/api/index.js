// Vercel serverless function handler
const express = require('express');

// Try to load the real app
let app;
try {
  app = require('../dist/index.js').default;
  console.log('App loaded successfully');
} catch (error) {
  console.error('Failed to load app:', error);
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      success: false,
      error: 'Failed to load app',
      message: error.message,
      stack: error.stack
    });
  });
}

// Add direct test endpoint for Cloudinary
app.get('/api-test', (req, res) => {
  res.json({
    test: 'direct from api/index.js',
    cloudinary: {
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'not set',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'set' : 'not set',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not set',
    }
  });
});

// Export for Vercel serverless
module.exports = app;
