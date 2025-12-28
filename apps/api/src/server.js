/**
 * Express Server
 * Main entry point for the API
 */

import express from 'express';
import cors from 'cors';
import articleRoutes from './routes/articles.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (error) {
  // dotenv is optional
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/articles', articleRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/articles`);
});

export default app;

