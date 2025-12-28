/**
 * Blog Scraper for BeyondChats
 * 
 * Fetches the 5 oldest blog articles from https://beyondchats.com/blogs/
 * 
 * Assumptions:
 * 1. The blog listing page uses pagination or displays articles in chronological order
 * 2. Articles are listed with their publish dates (either visible or in metadata)
 * 3. The oldest articles are either at the end of pagination or sorted by date ascending
 * 4. Article URLs are relative or absolute paths that can be resolved
 * 5. Main content is in a semantic HTML element (article, main, or specific content class)
 * 
 * Strategy:
 * - Fetch blog listing pages to find articles
 * - Extract article metadata (title, URL, date) from listing
 * - Sort articles by publish date to identify oldest
 * - Fetch individual article pages to extract main content
 * - Return clean data structure
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { HttpError, ParseError, ScraperError } from '../utils/errors.js';

const BASE_URL = 'https://beyondchats.com';
const BLOG_LISTING_URL = `${BASE_URL}/blogs/`;

/**
 * Fetches HTML content from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} HTML content
 * @throws {HttpError} If request fails
 */
async function fetchPage(url) {
  try {
    logger.info(`Fetching page: ${url}`);
    const response = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new HttpError(`HTTP ${response.status} error fetching ${url}`, response.status);
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    if (error.response) {
      throw new HttpError(
        `HTTP ${error.response.status} error: ${error.message}`,
        error.response.status,
        error
      );
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new HttpError(`Request timeout for ${url}`, 408, error);
    }
    
    throw new HttpError(`Failed to fetch ${url}: ${error.message}`, null, error);
  }
}

/**
 * Resolves a URL (handles relative and absolute URLs)
 * @param {string} url - URL to resolve
 * @param {string} baseUrl - Base URL for relative URLs
 * @returns {string} Resolved absolute URL
 */
function resolveUrl(url, baseUrl = BASE_URL) {
  if (!url) return null;
  
  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Relative URL - resolve against base
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

/**
 * Parses publish date from various possible formats
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null if unparseable
 */
function parseDate(dateString) {
  if (!dateString) return null;
  
  // Clean the date string
  const cleaned = dateString.trim();
  if (!cleaned) return null;
  
  // Try parsing as ISO date first
  let date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try common date formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i, // DD MMM YYYY
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  logger.warn(`Could not parse date: ${dateString}`);
  return null;
}

/**
 * Extracts article links and metadata from blog listing page
 * @param {string} html - HTML content of listing page
 * @returns {Array<Object>} Array of article metadata objects
 */
function extractArticleLinks(html) {
  const $ = cheerio.load(html);
  const articles = [];
  
  // Common selectors for blog article listings
  // Try multiple strategies to find article links
  const possibleSelectors = [
    'article a[href*="/blog"]',
    '.blog-post a',
    '.article-link',
    'a[href*="/blog"]',
    '.post-title a',
    'h2 a, h3 a' // Common pattern: heading with link
  ];
  
  let foundLinks = new Set(); // Avoid duplicates
  
  for (const selector of possibleSelectors) {
    $(selector).each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const title = $link.text().trim() || $link.find('h1, h2, h3, h4').first().text().trim();
      
      if (href && title && !foundLinks.has(href)) {
        foundLinks.add(href);
        
        // Try to find publish date near the link
        // Look in parent container or nearby elements
        const $container = $link.closest('article, .post, .blog-item, .entry');
        let publishDate = null;
        
        // Try to find date in common locations
        const dateSelectors = [
          'time[datetime]',
          '.date',
          '.publish-date',
          '.post-date',
          '[class*="date"]'
        ];
        
        for (const dateSelector of dateSelectors) {
          const $dateElement = $container.find(dateSelector).first();
          if ($dateElement.length) {
            const dateAttr = $dateElement.attr('datetime') || $dateElement.text();
            publishDate = parseDate(dateAttr);
            if (publishDate) break;
          }
        }
        
        // If no date found in container, try searching nearby text
        if (!publishDate && $container.length) {
          const containerText = $container.text();
          const dateMatch = containerText.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/);
          if (dateMatch) {
            publishDate = parseDate(dateMatch[0]);
          }
        }
        
        articles.push({
          title,
          url: resolveUrl(href),
          publishDate,
          // Store raw date string for later sorting if date parsing failed
          rawDate: $container.find('time, .date').first().text().trim() || null
        });
      }
    });
    
    // If we found articles with this selector, break
    if (articles.length > 0) break;
  }
  
  if (articles.length === 0) {
    logger.warn('No article links found with standard selectors. Attempting fallback...');
    
    // Fallback: find all links that might be blog posts
    $('a[href]').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const title = $link.text().trim();
      
      // Heuristic: blog URLs often contain /blog/ or /post/
      if (href && (href.includes('/blog/') || href.includes('/post/')) && title.length > 10) {
        if (!foundLinks.has(href)) {
          foundLinks.add(href);
          articles.push({
            title,
            url: resolveUrl(href),
            publishDate: null,
            rawDate: null
          });
        }
      }
    });
  }
  
  return articles;
}

/**
 * Extracts main content from an article page
 * @param {string} html - HTML content of article page
 * @returns {string} Clean text content
 */
function extractArticleContent(html) {
  const $ = cheerio.load(html);
  
  // Common selectors for main article content
  const contentSelectors = [
    'article',
    '.article-content',
    '.post-content',
    '.entry-content',
    'main article',
    '[role="article"]',
    '.blog-content',
    '#content article'
  ];
  
  let $content = null;
  
  for (const selector of contentSelectors) {
    $content = $(selector).first();
    if ($content.length > 0) {
      break;
    }
  }
  
  // Fallback: try to find the largest text container
  if (!$content || $content.length === 0) {
    logger.warn('Standard content selectors not found, using fallback');
    const $body = $('body');
    let maxLength = 0;
    let $bestMatch = null;
    
    $body.find('div, section, main').each((_, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      if (text.length > maxLength && text.length > 200) {
        maxLength = text.length;
        $bestMatch = $el;
      }
    });
    
    $content = $bestMatch || $body;
  }
  
  if (!$content || $content.length === 0) {
    throw new ParseError('Could not find article content');
  }
  
  // Remove unwanted elements (navigation, ads, footer, etc.)
  $content.find('nav, .nav, header, .header, footer, .footer, .sidebar, .ad, .advertisement, script, style').remove();
  
  // Get clean text content
  const text = $content.text()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return text;
}

/**
 * Checks if pagination exists and fetches additional pages if needed
 * @param {string} html - HTML content of first page
 * @returns {Promise<Array<string>>} Array of additional page URLs to fetch
 */
async function findPaginationUrls(html) {
  const $ = cheerio.load(html);
  const paginationUrls = [];
  
  // Common pagination selectors
  const paginationSelectors = [
    '.pagination a',
    '.pager a',
    '.page-numbers a',
    'a[rel="next"]',
    '.next-page'
  ];
  
  for (const selector of paginationSelectors) {
    $(selector).each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const text = $link.text().toLowerCase();
      
      // Look for "next", "older", or page numbers
      if (href && (text.includes('next') || text.includes('older') || /^\d+$/.test(text.trim()))) {
        const url = resolveUrl(href, BLOG_LISTING_URL);
        if (url && !paginationUrls.includes(url)) {
          paginationUrls.push(url);
        }
      }
    });
  }
  
  return paginationUrls;
}

/**
 * Fetches all articles from blog listing (handles pagination)
 * @returns {Promise<Array<Object>>} Array of all article metadata
 */
async function fetchAllArticles() {
  const allArticles = [];
  const visitedUrls = new Set();
  const urlsToVisit = [BLOG_LISTING_URL];
  
  logger.info('Starting to fetch articles from blog listing...');
  
  // Fetch pages until we have enough articles or no more pages
  while (urlsToVisit.length > 0 && allArticles.length < 20) { // Limit to prevent infinite loops
    const currentUrl = urlsToVisit.shift();
    
    if (visitedUrls.has(currentUrl)) {
      continue;
    }
    
    visitedUrls.add(currentUrl);
    
    try {
      const html = await fetchPage(currentUrl);
      const articles = extractArticleLinks(html);
      
      logger.info(`Found ${articles.length} articles on ${currentUrl}`);
      allArticles.push(...articles);
      
      // Check for pagination
      const paginationUrls = await findPaginationUrls(html);
      for (const url of paginationUrls) {
        if (!visitedUrls.has(url) && !urlsToVisit.includes(url)) {
          urlsToVisit.push(url);
        }
      }
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logger.error(`Error fetching articles from ${currentUrl}`, { error: error.message });
      // Continue with other pages
    }
  }
  
  return allArticles;
}

/**
 * Fetches and extracts content for a single article
 * @param {Object} articleMetadata - Article metadata with url and title
 * @returns {Promise<Object>} Article with content added
 */
async function fetchArticleContent(articleMetadata) {
  try {
    logger.info(`Fetching content for: ${articleMetadata.title}`);
    const html = await fetchPage(articleMetadata.url);
    const content = extractArticleContent(html);
    
    return {
      ...articleMetadata,
      content
    };
  } catch (error) {
    logger.error(`Error fetching content for ${articleMetadata.url}`, { error: error.message });
    // Return article without content rather than failing completely
    return {
      ...articleMetadata,
      content: null,
      error: error.message
    };
  }
}

/**
 * Main scraper function - fetches the 5 oldest blog articles
 * @returns {Promise<Array<Object>>} Array of 5 oldest articles with title, URL, content, and publishDate
 */
export async function scrapeOldestArticles() {
  try {
    logger.info('Starting blog scraper for 5 oldest articles...');
    
    // Step 1: Fetch all articles from blog listing
    const allArticles = await fetchAllArticles();
    
    if (allArticles.length === 0) {
      throw new ScraperError('No articles found on blog listing page');
    }
    
    logger.info(`Found ${allArticles.length} total articles`);
    
    // Step 2: Sort articles by publish date (oldest first)
    // Articles with dates come first, then articles without dates
    const sortedArticles = allArticles.sort((a, b) => {
      // If both have dates, sort by date
      if (a.publishDate && b.publishDate) {
        return a.publishDate.getTime() - b.publishDate.getTime();
      }
      
      // Articles with dates come before articles without
      if (a.publishDate && !b.publishDate) return -1;
      if (!a.publishDate && b.publishDate) return 1;
      
      // If neither has date, maintain original order (assume listing is chronological)
      return 0;
    });
    
    // Step 3: Take the 5 oldest
    const oldestArticles = sortedArticles.slice(0, 5);
    
    logger.info(`Selected 5 oldest articles:`);
    oldestArticles.forEach((article, index) => {
      logger.info(`  ${index + 1}. ${article.title} (${article.publishDate ? article.publishDate.toISOString() : 'No date'})`);
    });
    
    // Step 4: Fetch content for each article
    logger.info('Fetching content for selected articles...');
    const articlesWithContent = await Promise.all(
      oldestArticles.map(article => fetchArticleContent(article))
    );
    
    // Step 5: Filter out articles that failed to fetch content
    const successfulArticles = articlesWithContent.filter(article => article.content !== null);
    
    if (successfulArticles.length === 0) {
      throw new ScraperError('Failed to fetch content for any articles');
    }
    
    logger.info(`Successfully scraped ${successfulArticles.length} articles`);
    
    // Return clean data structure
    return successfulArticles.map(article => ({
      title: article.title,
      url: article.url,
      content: article.content,
      publishDate: article.publishDate ? article.publishDate.toISOString() : null
    }));
    
  } catch (error) {
    if (error instanceof ScraperError || error instanceof HttpError || error instanceof ParseError) {
      throw error;
    }
    
    throw new ScraperError(`Unexpected error during scraping: ${error.message}`, error);
  }
}

