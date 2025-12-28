/**
 * Article Controller
 * Handles HTTP requests and responses for article operations
 */

import {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  createArticleUpdate,
  serializeArticle
} from '../models/article.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * GET /api/articles
 * List all articles with optional filtering
 */
export function listArticles(req, res, next) {
  try {
    const filters = {
      type: req.query.type,
      originalArticleId: req.query.originalArticleId,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const articles = getAllArticles(filters);
    const serialized = articles.map(serializeArticle);
    
    res.json({
      success: true,
      data: serialized,
      count: serialized.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/articles/:id
 * Get a single article by ID
 */
export function getArticle(req, res, next) {
  try {
    const article = getArticleById(req.params.id);
    
    if (!article) {
      throw new ApiError(404, `Article with ID ${req.params.id} not found`);
    }
    
    res.json({
      success: true,
      data: serializeArticle(article)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/articles
 * Create a new article
 */
export function createArticleHandler(req, res, next) {
  try {
    const article = createArticle(req.body);
    
    res.status(201).json({
      success: true,
      data: serializeArticle(article),
      message: 'Article created successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/articles/:id
 * Update an existing article (preserves original content)
 */
export function updateArticleHandler(req, res, next) {
  try {
    const article = updateArticle(req.params.id, req.body);
    
    if (!article) {
      throw new ApiError(404, `Article with ID ${req.params.id} not found`);
    }
    
    res.json({
      success: true,
      data: serializeArticle(article),
      message: 'Article updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/articles/:id
 * Delete an article
 */
export function deleteArticleHandler(req, res, next) {
  try {
    const deleted = deleteArticle(req.params.id);
    
    if (!deleted) {
      throw new ApiError(404, `Article with ID ${req.params.id} not found`);
    }
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/articles/:id/updates
 * Create an updated version of an article (preserves original)
 */
export function createUpdateHandler(req, res, next) {
  try {
    const originalArticleId = req.params.id;
    const updateData = {
      updatedContent: req.body.updatedContent,
      citationUrls: req.body.citationUrls || [],
      title: req.body.title // Optional: can override title
    };
    
    const updatedArticle = createArticleUpdate(originalArticleId, updateData);
    
    if (!updatedArticle) {
      throw new ApiError(404, `Original article with ID ${originalArticleId} not found`);
    }
    
    res.status(201).json({
      success: true,
      data: serializeArticle(updatedArticle),
      message: 'Article update created successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/articles/:id/updates
 * Get all updates for a specific article
 */
export function getArticleUpdates(req, res, next) {
  try {
    const originalArticle = getArticleById(req.params.id);
    
    if (!originalArticle) {
      throw new ApiError(404, `Article with ID ${req.params.id} not found`);
    }
    
    const updates = getAllArticles({
      originalArticleId: req.params.id
    });
    
    const serialized = updates.map(serializeArticle);
    
    res.json({
      success: true,
      data: serialized,
      count: serialized.length
    });
  } catch (error) {
    next(error);
  }
}

