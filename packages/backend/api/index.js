// Vercel serverless function handler
// Import the built Express app
const app = require('../dist/index.js').default;

// Export for Vercel serverless
module.exports = app;
