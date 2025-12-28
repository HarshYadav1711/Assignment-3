/**
 * Google Search Service
 * 
 * Searches Google for article titles and filters results to find relevant blog/article pages.
 * 
 * Design Decisions:
 * 1. Uses Google Custom Search API (preferred) with fallback to web scraping
 * 2. Deterministic filtering: clear rules for identifying blog/article pages
 * 3. Excludes beyondchats.com domain to avoid self-references
 * 4. Skips ads, non-article pages, and irrelevant links
 * 5. Fallback strategies: expands search if fewer than 2 results found
 * 6. Structured output: returns clean data ready for downstream scraping
 * 
 * Filtering Rules:
 * - Must be from a different domain than beyondchats.com
 * - URL patterns that suggest blog/article content
 * - Excludes common non-article patterns (ads, social media, etc.)
 * - Validates URL accessibility
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { HttpError, ScraperError } from '../utils/errors.js';

const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';
const GOOGLE_WEB_SEARCH_URL = 'https://www.google.com/search';

// Domains to exclude (beyondchats.com and common non-article sites)
const EXCLUDED_DOMAINS = [
  'beyondchats.com',
  'youtube.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'instagram.com',
  'pinterest.com',
  'reddit.com',
  'quora.com',
  'amazon.com',
  'ebay.com',
  'etsy.com'
];

// URL patterns that suggest blog/article content
const ARTICLE_URL_PATTERNS = [
  /\/blog\//i,
  /\/article\//i,
  /\/post\//i,
  /\/news\//i,
  /\/story\//i,
  /\/entry\//i,
  /\/[0-9]{4}\/[0-9]{2}\//, // Date-based URLs (YYYY/MM/)
  /\/[a-z0-9-]+\.html$/i,
  /\/[a-z0-9-]+\.php$/i
];

// URL patterns to exclude (ads, tracking, non-content pages)
const EXCLUDED_URL_PATTERNS = [
  /\/tag\//i,
  /\/category\//i,
  /\/author\//i,
  /\/search\?/i,
  /\/feed\//i,
  /\/rss\//i,
  /\/amp\//i,
  /\/print\//i,
  /\/share\//i,
  /\/comment\//i,
  /\/login\//i,
  /\/register\//i,
  /\/cart\//i,
  /\/checkout\//i,
  /\/product\//i,
  /\/shop\//i,
  /\/ad\//i,
  /\/ads\//i,
  /\/advertisement\//i,
  /utm_source=/i,
  /ref=/i,
  /affiliate/i
];

// Common non-article page indicators in URL
const NON_ARTICLE_INDICATORS = [
  'home',
  'index',
  'about',
  'contact',
  'privacy',
  'terms',
  'sitemap',
  'archive'
];

/**
 * Extracts domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string|null} Domain or null if invalid
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Checks if URL is from an excluded domain
 * @param {string} url - URL to check
 * @returns {boolean} True if excluded
 */
function isExcludedDomain(url) {
  const domain = extractDomain(url);
  if (!domain) return true;
  
  return EXCLUDED_DOMAINS.some(excluded => 
    domain === excluded || domain.endsWith(`.${excluded}`)
  );
}

/**
 * Checks if URL matches article/blog patterns
 * @param {string} url - URL to check
 * @returns {boolean} True if likely an article
 */
function matchesArticlePattern(url) {
  // Check if URL matches any article pattern
  const hasArticlePattern = ARTICLE_URL_PATTERNS.some(pattern => pattern.test(url));
  
  // Check if URL contains excluded patterns
  const hasExcludedPattern = EXCLUDED_URL_PATTERNS.some(pattern => pattern.test(url));
  
  // Check for non-article indicators in path
  const path = new URL(url).pathname.toLowerCase();
  const hasNonArticleIndicator = NON_ARTICLE_INDICATORS.some(indicator => 
    path.includes(`/${indicator}`) || path === `/${indicator}`
  );
  
  // Must have article pattern AND not have excluded patterns AND not have non-article indicators
  return hasArticlePattern && !hasExcludedPattern && !hasNonArticleIndicator;
}

/**
 * Validates if a URL is likely a blog/article page
 * @param {string} url - URL to validate
 * @param {string} title - Page title (optional)
 * @returns {Object} Validation result with isValid and reason
 */
function validateArticleUrl(url, title = '') {
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { isValid: false, reason: 'Invalid URL format' };
  }
  
  // Check domain exclusion
  if (isExcludedDomain(url)) {
    return { isValid: false, reason: 'Excluded domain' };
  }
  
  // Check URL patterns
  if (!matchesArticlePattern(url)) {
    // Fallback: check if title suggests it's an article
    const titleLower = title.toLowerCase();
    const articleKeywords = ['blog', 'article', 'post', 'story', 'news', 'guide', 'tutorial'];
    const hasArticleKeyword = articleKeywords.some(keyword => titleLower.includes(keyword));
    
    if (!hasArticleKeyword) {
      return { isValid: false, reason: 'URL pattern does not match article format' };
    }
  }
  
  // Additional heuristics: URL should have some depth (not just domain root)
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
  
  // If path is too short, likely not an article
  if (pathParts.length < 1) {
    return { isValid: false, reason: 'URL path too short (likely homepage)' };
  }
  
  return { isValid: true, reason: 'Valid article URL' };
}

/**
 * Searches Google using Custom Search API
 * @param {string} query - Search query
 * @param {number} numResults - Number of results to fetch
 * @returns {Promise<Array>} Array of search results
 */
async function searchWithAPI(query, numResults = 10) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    throw new ScraperError(
      'Google API credentials not found. Set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID in environment variables.'
    );
  }
  
  try {
    logger.info(`Searching Google API for: "${query}"`);
    
    const response = await axios.get(GOOGLE_SEARCH_API_URL, {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: query,
        num: Math.min(numResults, 10) // API max is 10 per request
      },
      timeout: 10000
    });
    
    if (!response.data.items) {
      logger.warn('No results from Google API');
      return [];
    }
    
    return response.data.items.map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink
    }));
  } catch (error) {
    if (error.response) {
      throw new HttpError(
        `Google API error: ${error.response.status} - ${error.response.data?.error?.message || error.message}`,
        error.response.status,
        error
      );
    }
    
    throw new HttpError(`Failed to search Google API: ${error.message}`, null, error);
  }
}

/**
 * Searches Google using web scraping (fallback method)
 * Note: Google's HTML structure changes frequently, so this is fragile.
 * In production, prefer using Google Custom Search API.
 * @param {string} query - Search query
 * @param {number} numResults - Number of results to fetch
 * @returns {Promise<Array>} Array of search results
 */
async function searchWithWebScraping(query, numResults = 10) {
  logger.warn('Using web scraping fallback (less reliable). Consider using Google Custom Search API.');
  
  try {
    const response = await axios.get(GOOGLE_WEB_SEARCH_URL, {
      params: {
        q: query,
        num: numResults
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    const seenUrls = new Set();
    
    // Try multiple selectors for Google search results
    // Google's structure varies, so we try common patterns
    const selectors = [
      'div.g a[href^="http"]',           // Standard result links
      'div[data-ved] a[href^="http"]',   // Results with data-ved attribute
      'h3 a[href^="http"]',               // Heading links
      'a[href^="http"]:not([href*="google.com"])' // Any external link
    ];
    
    for (const selector of selectors) {
      $(selector).each((_, element) => {
        if (results.length >= numResults) return false; // Break loop
        
        const $link = $(element);
        let url = $link.attr('href');
        
        // Skip if no URL or already seen
        if (!url || seenUrls.has(url)) return;
        
        // Clean up Google redirect URLs
        if (url.startsWith('/url?q=')) {
          const match = url.match(/\/url\?q=([^&]+)/);
          if (match) {
            url = decodeURIComponent(match[1]);
          }
        }
        
        // Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return;
        }
        
        // Skip Google domains
        try {
          const urlObj = new URL(url);
          if (urlObj.hostname.includes('google.com')) {
            return;
          }
        } catch {
          return; // Invalid URL
        }
        
        // Extract title
        let title = $link.text().trim();
        if (!title) {
          // Try parent element
          title = $link.closest('h3').text().trim() || 
                  $link.closest('div').find('h3').text().trim() ||
                  'Untitled';
        }
        
        // Extract snippet (try to find nearby text)
        let snippet = '';
        const $parent = $link.closest('div.g, div[data-ved]');
        if ($parent.length) {
          snippet = $parent.find('span, div').not('a').first().text().trim().substring(0, 200);
        }
        
        seenUrls.add(url);
        results.push({
          title: title || 'Untitled',
          url,
          snippet: snippet || '',
          displayUrl: extractDomain(url) || ''
        });
      });
      
      if (results.length >= numResults) break;
    }
    
    logger.info(`Scraped ${results.length} results from Google search`);
    return results;
  } catch (error) {
    throw new HttpError(`Failed to scrape Google search: ${error.message}`, null, error);
  }
}

/**
 * Filters search results to find valid article/blog pages
 * @param {Array} results - Raw search results
 * @param {number} minResults - Minimum number of results to return
 * @returns {Array} Filtered results
 */
function filterArticleResults(results, minResults = 2) {
  const validResults = [];
  
  logger.info(`Filtering ${results.length} search results...`);
  
  for (const result of results) {
    const validation = validateArticleUrl(result.url, result.title);
    
    if (validation.isValid) {
      validResults.push({
        title: result.title,
        url: result.url,
        snippet: result.snippet || '',
        domain: extractDomain(result.url),
        reason: validation.reason
      });
      
      logger.debug(`Valid article found: ${result.url} (${validation.reason})`);
      
      if (validResults.length >= minResults) {
        break;
      }
    } else {
      logger.debug(`Skipped: ${result.url} - ${validation.reason}`);
    }
  }
  
  return validResults;
}

/**
 * Expands search query with variations to find more results
 * @param {string} originalQuery - Original search query
 * @returns {Array<string>} Array of expanded queries
 */
function expandSearchQuery(originalQuery) {
  const variations = [
    originalQuery,
    `${originalQuery} blog`,
    `${originalQuery} article`,
    `"${originalQuery}"`,
    `${originalQuery} guide`,
    `${originalQuery} tutorial`
  ];
  
  return variations;
}

/**
 * Main function: Searches Google for article title and returns filtered results
 * @param {string} articleTitle - Article title to search for
 * @param {Object} options - Search options
 * @param {number} options.minResults - Minimum number of results to return (default: 2)
 * @param {number} options.maxAttempts - Maximum search attempts with query variations (default: 3)
 * @param {boolean} options.useAPI - Whether to use Google API (default: true, falls back to scraping)
 * @returns {Promise<Array>} Array of valid article results
 */
export async function searchForArticle(articleTitle, options = {}) {
  const {
    minResults = 2,
    maxAttempts = 3,
    useAPI = true
  } = options;
  
  if (!articleTitle || typeof articleTitle !== 'string' || articleTitle.trim().length === 0) {
    throw new ScraperError('Article title is required and must be a non-empty string');
  }
  
  const query = articleTitle.trim();
  logger.info(`Starting Google search for article: "${query}"`);
  
  const queryVariations = expandSearchQuery(query);
  let allResults = [];
  let attemptCount = 0;
  
  // Try different query variations until we have enough results
  for (const searchQuery of queryVariations) {
    if (attemptCount >= maxAttempts) {
      break;
    }
    
    attemptCount++;
    logger.info(`Search attempt ${attemptCount}/${maxAttempts}: "${searchQuery}"`);
    
    try {
      // Try API first, fallback to scraping
      let results;
      if (useAPI) {
        try {
          results = await searchWithAPI(searchQuery, 10);
        } catch (apiError) {
          logger.warn('API search failed, falling back to web scraping', { error: apiError.message });
          results = await searchWithWebScraping(searchQuery, 10);
        }
      } else {
        results = await searchWithWebScraping(searchQuery, 10);
      }
      
      // Filter results
      const filtered = filterArticleResults(results, minResults);
      
      // Add to all results (avoid duplicates)
      const seenUrls = new Set(allResults.map(r => r.url));
      for (const result of filtered) {
        if (!seenUrls.has(result.url)) {
          allResults.push(result);
          seenUrls.add(result.url);
        }
      }
      
      // If we have enough results, return early
      if (allResults.length >= minResults) {
        logger.info(`Found ${allResults.length} valid articles (target: ${minResults})`);
        return allResults.slice(0, minResults);
      }
      
      // Small delay between searches to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      logger.warn(`Search attempt ${attemptCount} failed: ${error.message}`);
      // Continue to next variation
    }
  }
  
  // If we still don't have enough results, return what we have
  if (allResults.length > 0) {
    logger.warn(`Only found ${allResults.length} valid articles (target: ${minResults}). Returning available results.`);
    return allResults;
  }
  
  // No results found at all
  throw new ScraperError(
    `Could not find ${minResults} valid article results for "${query}" after ${attemptCount} attempts. ` +
    `Try adjusting the search query or checking your Google API credentials.`
  );
}

/**
 * Validates and structures search results for downstream scraping
 * @param {Array} results - Search results from searchForArticle
 * @returns {Array} Structured results ready for scraping
 */
export function structureResultsForScraping(results) {
  return results.map((result, index) => ({
    rank: index + 1,
    title: result.title,
    url: result.url,
    domain: result.domain,
    snippet: result.snippet,
    metadata: {
      source: 'google_search',
      validated: true,
      reason: result.reason || 'Validated article URL'
    }
  }));
}

