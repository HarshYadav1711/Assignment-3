/**
 * Custom error classes for better error handling
 */

/**
 * Base error class for scraper-related errors
 */
export class ScraperError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'ScraperError';
    this.cause = cause;
  }
}

/**
 * Error thrown when HTTP request fails
 */
export class HttpError extends ScraperError {
  constructor(message, statusCode, cause = null) {
    super(message, cause);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

/**
 * Error thrown when HTML parsing fails or expected elements are not found
 */
export class ParseError extends ScraperError {
  constructor(message, cause = null) {
    super(message, cause);
    this.name = 'ParseError';
  }
}

