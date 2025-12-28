/**
 * Article Update Processor
 * 
 * Orchestrates the complete pipeline for updating articles:
 * 1. Fetches original article from API
 * 2. Searches Google for reference articles
 * 3. Extracts content from reference articles
 * 4. Improves article using LLM with references
 * 5. Saves improved article to API
 * 
 * Features:
 * - Idempotent: Can be run multiple times safely
 * - Preserves original articles (never modifies them)
 * - Links updated versions to originals
 * - Saves reference URLs for traceability
 * - Comprehensive error handling
 */

import { scrapeOldestArticles } from '../scrapers/blogScraper.js';
import { extractArticleContent } from '../scrapers/articleContentExtractor.js';
import { searchForArticle, structureResultsForScraping } from '../services/googleSearch.js';
import { improveArticleWithLLM } from '../services/llmService.js';
import { createApiClient } from '../services/apiClient.js';
import { logger } from '../utils/logger.js';
import { HttpError, ScraperError } from '../utils/errors.js';

/**
 * Checks if an article update already exists for the given original article
 * This enables idempotent operations
 * @param {Object} apiClient - API client instance
 * @param {number} originalArticleId - ID of original article
 * @param {string} improvedContent - Improved content to check
 * @returns {Promise<Object|null>} Existing update or null
 */
async function findExistingUpdate(apiClient, originalArticleId, improvedContent) {
  try {
    const existingUpdates = await apiClient.getArticleUpdates(originalArticleId);
    
    // Check if any existing update has similar content (within 5% length difference)
    for (const update of existingUpdates) {
      const lengthDiff = Math.abs(update.updatedContent.length - improvedContent.length);
      const avgLength = (update.updatedContent.length + improvedContent.length) / 2;
      const percentDiff = (lengthDiff / avgLength) * 100;
      
      // If content length is very similar, consider it a duplicate
      if (percentDiff < 5) {
        logger.info(`Found existing update (ID: ${update.id}) with similar content`);
        return update;
      }
    }
    
    return null;
  } catch (error) {
    // If we can't check, proceed anyway (non-blocking)
    logger.warn('Could not check for existing updates', { error: error.message });
    return null;
  }
}

/**
 * Fetches reference articles by searching and extracting content
 * @param {string} articleTitle - Title to search for
 * @param {number} requiredCount - Number of references needed (default: 2)
 * @returns {Promise<Array>} Array of reference articles with content
 */
async function fetchReferenceArticles(articleTitle, requiredCount = 2) {
  logger.info(`Searching for ${requiredCount} reference articles for: "${articleTitle}"`);
  
  // Search Google for relevant articles
  const searchResults = await searchForArticle(articleTitle, {
    minResults: requiredCount,
    maxAttempts: 3
  });
  
  if (searchResults.length === 0) {
    throw new ScraperError(`No reference articles found for "${articleTitle}"`);
  }
  
  logger.info(`Found ${searchResults.length} reference article(s), extracting content...`);
  
  // Extract content from each reference article
  const referenceArticles = [];
  const referenceUrls = [];
  
  for (const result of searchResults.slice(0, requiredCount)) {
    try {
      logger.debug(`Extracting content from: ${result.url}`);
      const extracted = await extractArticleContent(result.url);
      
      referenceArticles.push({
        title: extracted.title,
        content: extracted.content,
        url: result.url
      });
      
      referenceUrls.push(result.url);
      
      logger.info(`Successfully extracted ${extracted.contentLength} characters from ${result.url}`);
    } catch (error) {
      logger.warn(`Failed to extract content from ${result.url}: ${error.message}`);
      // Continue with other references if one fails
    }
  }
  
  if (referenceArticles.length === 0) {
    throw new ScraperError(
      `Failed to extract content from any reference articles for "${articleTitle}"`
    );
  }
  
  logger.info(`Successfully prepared ${referenceArticles.length} reference article(s)`);
  
  return {
    articles: referenceArticles,
    urls: referenceUrls
  };
}

/**
 * Processes a single article update
 * @param {Object} params - Processing parameters
 * @param {Object} params.originalArticle - Original article from API
 * @param {Object} params.apiClient - API client instance
 * @param {Object} params.options - Processing options
 * @returns {Promise<Object>} Processing result
 */
async function processArticleUpdate(params) {
  const { originalArticle, apiClient, options = {} } = params;
  const { skipIfExists = true, llmOptions = {} } = options;
  
  const articleId = originalArticle.id;
  const articleTitle = originalArticle.title;
  const originalContent = originalArticle.originalContent;
  
  logger.info(`\n=== Processing Article Update ===`);
  logger.info(`Article ID: ${articleId}`);
  logger.info(`Title: "${articleTitle}"`);
  
  try {
    // Step 1: Fetch reference articles
    const { articles: referenceArticles, urls: referenceUrls } = 
      await fetchReferenceArticles(articleTitle, 2);
    
    // Step 2: Improve article using LLM
    logger.info('Improving article with LLM...');
    const improvementResult = await improveArticleWithLLM({
      originalContent,
      originalTitle: articleTitle,
      referenceArticles,
      options: llmOptions
    });
    
    const improvedContent = improvementResult.improvedContent;
    
    // Step 3: Check for existing update (idempotency)
    if (skipIfExists) {
      const existingUpdate = await findExistingUpdate(
        apiClient,
        articleId,
        improvedContent
      );
      
      if (existingUpdate) {
        logger.info(`Update already exists (ID: ${existingUpdate.id}), skipping creation`);
        return {
          success: true,
          skipped: true,
          originalArticleId: articleId,
          updateArticleId: existingUpdate.id,
          message: 'Update already exists'
        };
      }
    }
    
    // Step 4: Save improved article to API
    logger.info('Saving improved article to API...');
    const updateData = {
      updatedContent: improvedContent,
      citationUrls: referenceUrls
    };
    
    const createdUpdate = await apiClient.createArticleUpdate(articleId, updateData);
    const updateArticle = createdUpdate;
    
    logger.info(`Successfully created article update (ID: ${updateArticle.id})`);
    
    return {
      success: true,
      skipped: false,
      originalArticleId: articleId,
      originalTitle: articleTitle,
      updateArticleId: updateArticle.id,
      improvedContentLength: improvedContent.length,
      referenceUrls,
      referenceCount: referenceUrls.length,
      provider: improvementResult.provider,
      message: 'Article update created successfully'
    };
    
  } catch (error) {
    logger.error(`Failed to process article update for "${articleTitle}"`, {
      articleId,
      error: error.message
    });
    
    throw new ScraperError(
      `Failed to process article update for "${articleTitle}": ${error.message}`,
      error
    );
  }
}

/**
 * Processes updates for the oldest articles from BeyondChats blog
 * @param {Object} options - Processing options
 * @param {string} options.apiUrl - API base URL (default: 'http://localhost:3001')
 * @param {number} options.articleCount - Number of articles to process (default: 5)
 * @param {boolean} options.skipIfExists - Skip if update already exists (default: true)
 * @param {Object} options.llmOptions - LLM configuration options
 * @returns {Promise<Object>} Processing summary
 */
export async function processOldestArticles(options = {}) {
  const {
    apiUrl = process.env.API_URL || 'http://localhost:3001',
    articleCount = 5,
    skipIfExists = true,
    llmOptions = {}
  } = options;
  
  logger.info('=== Starting Article Update Pipeline ===');
  logger.info(`API URL: ${apiUrl}`);
  logger.info(`Processing ${articleCount} oldest articles`);
  
  const apiClient = createApiClient(apiUrl);
  const results = {
    total: 0,
    successful: 0,
    skipped: 0,
    failed: 0,
    articles: []
  };
  
  try {
    // Step 1: Scrape oldest articles from BeyondChats
    logger.info('Step 1: Scraping oldest articles from BeyondChats...');
    const scrapedArticles = await scrapeOldestArticles();
    
    if (scrapedArticles.length === 0) {
      throw new ScraperError('No articles found to process');
    }
    
    const articlesToProcess = scrapedArticles.slice(0, articleCount);
    logger.info(`Found ${articlesToProcess.length} article(s) to process`);
    
    // Step 2: For each article, check if it exists in API, create if not
    logger.info('Step 2: Ensuring articles exist in API...');
    for (const scrapedArticle of articlesToProcess) {
      results.total++;
      
      try {
        // Check if article already exists (by URL)
        const existingArticlesResponse = await apiClient.listArticles();
        const existingArticles = existingArticlesResponse.data || existingArticlesResponse;
        let existingArticle = existingArticles.find(
          a => a.url === scrapedArticle.url && a.type === 'original'
        );
        
        // Create original article if it doesn't exist
        if (!existingArticle) {
          logger.info(`Creating original article: "${scrapedArticle.title}"`);
          const created = await apiClient.createArticle({
            title: scrapedArticle.title,
            url: scrapedArticle.url,
            originalContent: scrapedArticle.content,
            type: 'original',
            originalPublishDate: scrapedArticle.publishDate
          });
          existingArticle = created;
          logger.info(`Created article with ID: ${existingArticle.id}`);
        } else {
          logger.info(`Article already exists (ID: ${existingArticle.id})`);
        }
        
        // Step 3: Process update for this article
        logger.info(`Step 3: Processing update for article ID ${existingArticle.id}...`);
        const updateResult = await processArticleUpdate({
          originalArticle: existingArticle,
          apiClient,
          options: {
            skipIfExists,
            llmOptions
          }
        });
        
        if (updateResult.skipped) {
          results.skipped++;
        } else {
          results.successful++;
        }
        
        results.articles.push({
          originalArticleId: existingArticle.id,
          originalTitle: existingArticle.title,
          ...updateResult
        });
        
      } catch (error) {
        results.failed++;
        logger.error(`Failed to process article: ${error.message}`);
        
        results.articles.push({
          originalTitle: scrapedArticle.title,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 4: Summary
    logger.info('\n=== Processing Complete ===');
    logger.info(`Total: ${results.total}`);
    logger.info(`Successful: ${results.successful}`);
    logger.info(`Skipped: ${results.skipped}`);
    logger.info(`Failed: ${results.failed}`);
    
    return results;
    
  } catch (error) {
    logger.error('Pipeline failed', { error: error.message });
    throw new ScraperError(`Article update pipeline failed: ${error.message}`, error);
  }
}

/**
 * Processes update for a single article by ID
 * Useful for updating a specific article that already exists in the API
 * @param {Object} params - Processing parameters
 * @param {number} params.articleId - ID of original article in API
 * @param {string} params.apiUrl - API base URL
 * @param {Object} params.options - Processing options
 * @returns {Promise<Object>} Processing result
 */
export async function processSingleArticleUpdate(params) {
  const {
    articleId,
    apiUrl = process.env.API_URL || 'http://localhost:3001',
    options = {}
  } = params;
  
  const apiClient = createApiClient(apiUrl);
  
  logger.info(`Processing update for article ID: ${articleId}`);
  
  try {
    // Fetch original article
    const originalArticle = await apiClient.getArticle(articleId);
    
    if (!originalArticle) {
      throw new ScraperError(`Article with ID ${articleId} not found`);
    }
    
    if (originalArticle.type !== 'original') {
      throw new ScraperError(
        `Article ID ${articleId} is not an original article (type: ${originalArticle.type})`
      );
    }
    
    // Process update
    const result = await processArticleUpdate({
      originalArticle,
      apiClient,
      options
    });
    
    return result;
    
  } catch (error) {
    if (error instanceof HttpError || error instanceof ScraperError) {
      throw error;
    }
    
    throw new ScraperError(
      `Failed to process article update for ID ${articleId}: ${error.message}`,
      error
    );
  }
}

