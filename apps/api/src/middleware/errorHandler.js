/**
 * Error handling middleware
 * Provides consistent error responses across the API
 */

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Error handling middleware
 * Must be used after all routes
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error('[API Error]', {
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    details: err.details
  });
  
  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode,
        ...(err.details && { details: err.details })
      }
    });
  }
  
  // Handle validation errors (from express-validator or custom)
  if (err.name === 'ValidationError' || Array.isArray(err.errors)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        code: 400,
        details: err.errors || [err.message]
      }
    });
  }
  
  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: statusCode
    }
  });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 404
    }
  });
}

