/**
 * Request validation middleware
 * Validates request bodies and query parameters
 */

import { ApiError } from './errorHandler.js';
import { validateArticle } from '../models/article.js';

/**
 * Validates article creation request
 */
export function validateCreateArticle(req, res, next) {
  const validation = validateArticle(req.body, false);
  
  if (!validation.isValid) {
    throw new ApiError(400, 'Validation failed', validation.errors);
  }
  
  next();
}

/**
 * Validates article update request
 */
export function validateUpdateArticle(req, res, next) {
  const validation = validateArticle(req.body, true);
  
  if (!validation.isValid) {
    throw new ApiError(400, 'Validation failed', validation.errors);
  }
  
  // Ensure originalContent is not being updated
  if (req.body.originalContent !== undefined) {
    throw new ApiError(400, 'originalContent cannot be modified. Original content is immutable.');
  }
  
  next();
}

/**
 * Validates article ID parameter
 */
export function validateArticleId(req, res, next) {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id) || id <= 0) {
    throw new ApiError(400, 'Invalid article ID. Must be a positive number.');
  }
  
  req.params.id = id; // Normalize to number
  next();
}

/**
 * Validates query parameters for list endpoint
 */
export function validateListQuery(req, res, next) {
  const { type, originalArticleId, sortBy, sortOrder } = req.query;
  
  // Validate type
  if (type && !['original', 'updated'].includes(type)) {
    throw new ApiError(400, "Query parameter 'type' must be 'original' or 'updated'");
  }
  
  // Validate originalArticleId
  if (originalArticleId !== undefined) {
    const id = parseInt(originalArticleId, 10);
    if (isNaN(id) || id <= 0) {
      throw new ApiError(400, "Query parameter 'originalArticleId' must be a positive number");
    }
    req.query.originalArticleId = id;
  }
  
  // Validate sortBy
  if (sortBy && !['createdAt', 'updatedAt', 'title'].includes(sortBy)) {
    throw new ApiError(400, "Query parameter 'sortBy' must be 'createdAt', 'updatedAt', or 'title'");
  }
  
  // Validate sortOrder
  if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
    throw new ApiError(400, "Query parameter 'sortOrder' must be 'asc' or 'desc'");
  }
  
  next();
}

/**
 * Validates create update request (for creating updated versions)
 */
export function validateCreateUpdate(req, res, next) {
  const { updatedContent, citationUrls } = req.body;
  
  if (!updatedContent || typeof updatedContent !== 'string' || updatedContent.trim().length === 0) {
    throw new ApiError(400, 'updatedContent is required and must be a non-empty string');
  }
  
  if (citationUrls !== undefined) {
    if (!Array.isArray(citationUrls)) {
      throw new ApiError(400, 'citationUrls must be an array');
    }
    
    const invalidUrls = citationUrls.filter(url => {
      if (typeof url !== 'string') return true;
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });
    
    if (invalidUrls.length > 0) {
      throw new ApiError(400, 'citationUrls must contain valid URLs');
    }
  }
  
  next();
}

