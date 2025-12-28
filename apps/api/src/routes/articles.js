/**
 * Article Routes
 * Defines all article-related API endpoints
 */

import express from 'express';
import {
  listArticles,
  getArticle,
  createArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
  createUpdateHandler,
  getArticleUpdates
} from '../controllers/articleController.js';
import {
  validateCreateArticle,
  validateUpdateArticle,
  validateArticleId,
  validateListQuery,
  validateCreateUpdate
} from '../middleware/validator.js';

const router = express.Router();

/**
 * @route   GET /api/articles
 * @desc    List all articles (with optional filtering)
 * @query   type, originalArticleId, sortBy, sortOrder
 * @access  Public
 */
router.get('/', validateListQuery, listArticles);

/**
 * @route   GET /api/articles/:id
 * @desc    Get a single article by ID
 * @access  Public
 */
router.get('/:id', validateArticleId, getArticle);

/**
 * @route   POST /api/articles
 * @desc    Create a new article
 * @access  Public
 */
router.post('/', validateCreateArticle, createArticleHandler);

/**
 * @route   PUT /api/articles/:id
 * @desc    Update an existing article (preserves original content)
 * @access  Public
 */
router.put('/:id', validateArticleId, validateUpdateArticle, updateArticleHandler);

/**
 * @route   DELETE /api/articles/:id
 * @desc    Delete an article
 * @access  Public
 */
router.delete('/:id', validateArticleId, deleteArticleHandler);

/**
 * @route   POST /api/articles/:id/updates
 * @desc    Create an updated version of an article
 * @access  Public
 */
router.post('/:id/updates', validateArticleId, validateCreateUpdate, createUpdateHandler);

/**
 * @route   GET /api/articles/:id/updates
 * @desc    Get all updates for a specific article
 * @access  Public
 */
router.get('/:id/updates', validateArticleId, getArticleUpdates);

export default router;

