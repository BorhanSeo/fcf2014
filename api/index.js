// Entry point for Vercel Serverless Functions
// This re-exports the Express app from server/index.js
const app = require('../server/index.js');
module.exports = app;
