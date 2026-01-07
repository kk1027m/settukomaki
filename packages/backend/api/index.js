// Vercel serverless function handler
const express = require('express');

// Create wrapper app
const wrapper = express();

// Add test endpoint FIRST (before loading main app)
wrapper.get('/api-test', (req, res) => {
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

// Try to load the real app
try {
  const app = require('../dist/index.js').default;
  console.log('App loaded successfully');
  // Forward all other requests to the main app
  wrapper.use(app);
} catch (error) {
  console.error('Failed to load app:', error);
  wrapper.use((req, res) => {
    res.status(500).json({
      success: false,
      error: 'Failed to load app',
      message: error.message,
      stack: error.stack
    });
  });
}

// Export for Vercel serverless
module.exports = wrapper;
