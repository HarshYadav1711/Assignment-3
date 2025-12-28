/**
 * API Service
 * 
 * Handles all API communication with the backend.
 * Provides clean, reusable functions for fetching article data.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api/articles`;

/**
 * Creates axios instance with default config
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Fetches all articles with optional filters
 * @param {Object} filters - Filter options (type, originalArticleId, sortBy, sortOrder)
 * @returns {Promise<Array>} Array of articles
 */
export async function fetchArticles(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.originalArticleId) params.append('originalArticleId', filters.originalArticleId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const queryString = params.toString();
    const url = queryString ? `${API_URL}?${queryString}` : API_URL;
    
    const response = await apiClient.get(url);
    
    if (response.data.success) {
      return response.data.data || [];
    }
    
    throw new Error(response.data.error?.message || 'Failed to fetch articles');
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.error?.message || 
        `HTTP ${error.response.status}: Failed to fetch articles`
      );
    }
    throw error;
  }
}

/**
 * Fetches a single article by ID
 * @param {number} articleId - Article ID
 * @returns {Promise<Object>} Article data
 */
export async function fetchArticle(articleId) {
  try {
    const response = await apiClient.get(`${API_URL}/${articleId}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to fetch article');
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Article not found');
      }
      throw new Error(
        error.response.data?.error?.message || 
        `HTTP ${error.response.status}: Failed to fetch article`
      );
    }
    throw error;
  }
}

/**
 * Fetches all updates for a specific article
 * @param {number} articleId - Original article ID
 * @returns {Promise<Array>} Array of updated articles
 */
export async function fetchArticleUpdates(articleId) {
  try {
    const response = await apiClient.get(`${API_URL}/${articleId}/updates`);
    
    if (response.data.success) {
      return response.data.data || [];
    }
    
    throw new Error(response.data.error?.message || 'Failed to fetch article updates');
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.error?.message || 
        `HTTP ${error.response.status}: Failed to fetch article updates`
      );
    }
    throw error;
  }
}

