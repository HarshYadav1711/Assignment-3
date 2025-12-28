/**
 * API Client for Article CRUD Operations
 * 
 * Provides a clean interface to interact with the article API.
 * Handles HTTP requests, error handling, and response parsing.
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { HttpError, ScraperError } from '../utils/errors.js';

/**
 * Creates an API client instance
 * @param {string} baseUrl - Base URL of the API (e.g., 'http://localhost:3001')
 * @returns {Object} API client with CRUD methods
 */
export function createApiClient(baseUrl = 'http://localhost:3001') {
  const apiBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const articlesEndpoint = `${apiBaseUrl}/api/articles`;
  
  /**
   * Makes an HTTP request with error handling
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request body (optional)
   * @returns {Promise<Object>} Response data
   */
  async function makeRequest(method, url, data = null) {
    try {
      const config = {
        method,
        url,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };
      
      if (data) {
        config.data = data;
      }
      
      logger.debug(`${method} ${url}`);
      const response = await axios(config);
      
      if (!response.data.success) {
        throw new ScraperError(
          response.data.error?.message || 'API request failed',
          response.data.error
        );
      }
      
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        const errorMessage = errorData?.error?.message || error.message;
        const statusCode = error.response.status;
        
        throw new HttpError(
          `API ${method} ${url} failed: ${errorMessage}`,
          statusCode,
          error
        );
      }
      
      if (error instanceof HttpError || error instanceof ScraperError) {
        throw error;
      }
      
      throw new HttpError(`Request to ${url} failed: ${error.message}`, null, error);
    }
  }
  
  return {
    /**
     * Creates a new article
     * @param {Object} articleData - Article data
     * @returns {Promise<Object>} Created article
     */
    async createArticle(articleData) {
      const response = await makeRequest('POST', articlesEndpoint, articleData);
      return response.data;
    },
    
    /**
     * Gets an article by ID
     * @param {number} articleId - Article ID
     * @returns {Promise<Object>} Article data
     */
    async getArticle(articleId) {
      const response = await makeRequest('GET', `${articlesEndpoint}/${articleId}`);
      return response.data;
    },
    
    /**
     * Gets all articles with optional filters
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Array of articles
     */
    async listArticles(filters = {}) {
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.originalArticleId) queryParams.append('originalArticleId', filters.originalArticleId);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      
      const queryString = queryParams.toString();
      const url = queryString ? `${articlesEndpoint}?${queryString}` : articlesEndpoint;
      
      const response = await makeRequest('GET', url);
      return response;
    },
    
    /**
     * Creates an updated version of an article
     * @param {number} originalArticleId - ID of original article
     * @param {Object} updateData - Update data with updatedContent and citationUrls
     * @returns {Promise<Object>} Created updated article
     */
    async createArticleUpdate(originalArticleId, updateData) {
      const response = await makeRequest(
        'POST',
        `${articlesEndpoint}/${originalArticleId}/updates`,
        updateData
      );
      return response.data;
    },
    
    /**
     * Gets all updates for a specific article
     * @param {number} articleId - Original article ID
     * @returns {Promise<Array>} Array of updated articles
     */
    async getArticleUpdates(articleId) {
      const response = await makeRequest('GET', `${articlesEndpoint}/${articleId}/updates`);
      return response.data || [];
    },
    
    /**
     * Updates an existing article (preserves original content)
     * @param {number} articleId - Article ID
     * @param {Object} updateData - Fields to update
     * @returns {Promise<Object>} Updated article
     */
    async updateArticle(articleId, updateData) {
      const response = await makeRequest('PUT', `${articlesEndpoint}/${articleId}`, updateData);
      return response.data;
    },
    
    /**
     * Deletes an article
     * @param {number} articleId - Article ID
     * @returns {Promise<void>}
     */
    async deleteArticle(articleId) {
      await makeRequest('DELETE', `${articlesEndpoint}/${articleId}`);
    }
  };
}

