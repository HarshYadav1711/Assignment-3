/**
 * Article Content Extractor
 * 
 * Extracts clean, readable content from blog/article URLs.
 * Designed to work with various website structures and extract only
 * the main article content while removing navigation, ads, and unrelated elements.
 * 
 * Extraction Strategy:
 * 1. Multi-strategy approach: Try semantic HTML5 elements first, then common class patterns
 * 2. Content scoring: Identify the largest text container that likely contains the article
 * 3. Element removal: Remove navigation, ads, social media widgets, and other noise
 * 4. Text normalization: Clean whitespace, remove empty elements, preserve paragraph structure
 * 5. Fallback mechanisms: If primary strategies fail, use heuristics to find content
 * 
 * This approach is resilient because:
 * - It tries multiple common patterns used across different CMS platforms
 * - It uses content scoring to identify the main content area
 * - It has fallback strategies for edge cases
 * - It removes common noise patterns regardless of site structure
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { HttpError, ParseError, ScraperError } from '../utils/errors.js';

/**
 * Fetches HTML content from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} HTML content
 * @throws {HttpError} If request fails
 */
async function fetchPage(url) {
  try {
    logger.debug(`Fetching page: ${url}`);
    const response = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      maxRedirects: 5
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
 * Removes unwanted elements from the DOM
 * These elements typically contain navigation, ads, social widgets, etc.
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} $content - Content container to clean
 */
function removeUnwantedElements($, $content) {
  // Remove script and style tags (they don't contain readable content)
  $content.find('script, style, noscript').remove();
  
  // Remove navigation elements
  $content.find('nav, .nav, .navigation, .navbar, .menu, .header, .footer').remove();
  $content.find('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  
  // Remove ads and promotional content
  $content.find('.ad, .ads, .advertisement, .advert, [class*="ad-"], [id*="ad-"]').remove();
  $content.find('.sponsored, .promo, .promotion, [class*="sponsor"]').remove();
  
  // Remove social media widgets and share buttons
  $content.find('.social, .share, .sharing, [class*="social"], [class*="share"]').remove();
  $content.find('[class*="facebook"], [class*="twitter"], [class*="linkedin"]').remove();
  
  // Remove comments sections
  $content.find('.comments, .comment-section, #comments, [class*="comment"]').remove();
  
  // Remove related/recommended content (we want only the main article)
  $content.find('.related, .recommended, .more-articles, [class*="related"]').remove();
  
  // Remove newsletter signup and forms
  $content.find('form, .newsletter, .subscribe, [class*="newsletter"]').remove();
  
  // Remove breadcrumbs
  $content.find('.breadcrumb, .breadcrumbs, [class*="breadcrumb"]').remove();
  
  // Remove author bio boxes (optional - can be kept if needed)
  $content.find('.author-bio, .author-box, [class*="author"]').remove();
  
  // Remove table of contents
  $content.find('.toc, .table-of-contents, [class*="toc"]').remove();
  
  // Remove hidden elements (they don't contribute to readable content)
  $content.find('[style*="display: none"], [style*="display:none"], .hidden, [hidden]').remove();
  
  // Remove elements with very little text (likely icons or decorative elements)
  $content.find('svg, img[alt=""], .icon, [class*="icon"]').remove();
}

/**
 * Scores a potential content container based on various heuristics
 * Higher score = more likely to be the main content
 * @param {Cheerio} $element - Element to score
 * @returns {number} Score (0-100)
 */
function scoreContentContainer($element) {
  let score = 0;
  const text = $element.text().trim();
  const textLength = text.length;
  
  // Must have substantial text content (at least 200 characters)
  if (textLength < 200) {
    return 0;
  }
  
  // Prefer longer content (up to 50 points)
  score += Math.min(50, textLength / 100);
  
  // Check for semantic HTML5 article elements (high score)
  const tagName = $element.prop('tagName')?.toLowerCase();
  if (tagName === 'article') {
    score += 30;
  } else if (tagName === 'main') {
    score += 20;
  }
  
  // Check for common article content class names
  const className = $element.attr('class') || '';
  const id = $element.attr('id') || '';
  const combined = `${className} ${id}`.toLowerCase();
  
  const articleIndicators = [
    'article', 'content', 'post', 'entry', 'story', 'blog-post',
    'article-content', 'post-content', 'entry-content', 'main-content'
  ];
  
  articleIndicators.forEach(indicator => {
    if (combined.includes(indicator)) {
      score += 10;
    }
  });
  
  // Penalize elements with too many links (likely navigation or related content)
  const linkCount = $element.find('a').length;
  const linkRatio = linkCount / (textLength / 100); // links per 100 chars
  if (linkRatio > 2) {
    score -= 20; // Too many links suggests navigation, not content
  }
  
  // Prefer elements with paragraph tags (structured content)
  const paragraphCount = $element.find('p').length;
  if (paragraphCount > 3) {
    score += 15;
  }
  
  // Penalize elements with forms (likely newsletter signup, etc.)
  if ($element.find('form').length > 0) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Strategy 1: Find content using semantic HTML5 elements
 * Modern websites often use <article> or <main> tags
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Cheerio|null} Content container or null
 */
function findContentBySemanticElements($) {
  // Try <article> tag first (most specific)
  let $content = $('article').first();
  if ($content.length > 0 && $content.text().trim().length > 200) {
    logger.debug('Found content using <article> tag');
    return $content;
  }
  
  // Try <main> tag
  $content = $('main').first();
  if ($content.length > 0 && $content.text().trim().length > 200) {
    logger.debug('Found content using <main> tag');
    return $content;
  }
  
  // Try [role="article"]
  $content = $('[role="article"]').first();
  if ($content.length > 0 && $content.text().trim().length > 200) {
    logger.debug('Found content using [role="article"]');
    return $content;
  }
  
  return null;
}

/**
 * Strategy 2: Find content using common class/id patterns
 * Many CMS platforms use predictable class names
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Cheerio|null} Content container or null
 */
function findContentByClassPatterns($) {
  const selectors = [
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content',
    '.main-content',
    '#content',
    '#main-content',
    '.blog-post',
    '.article-body',
    '.post-body',
    '.entry-body',
    '[class*="article"]',
    '[class*="post-content"]',
    '[class*="entry-content"]'
  ];
  
  for (const selector of selectors) {
    const $element = $(selector).first();
    if ($element.length > 0) {
      const text = $element.text().trim();
      if (text.length > 200) {
        logger.debug(`Found content using selector: ${selector}`);
        return $element;
      }
    }
  }
  
  return null;
}

/**
 * Strategy 3: Find content by scoring all potential containers
 * Uses heuristics to identify the most likely content container
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Cheerio|null} Content container or null
 */
function findContentByScoring($) {
  const candidates = [];
  
  // Score all div, section, and article elements
  $('body').find('div, section, article, main').each((_, element) => {
    const $el = $(element);
    const score = scoreContentContainer($el);
    
    if (score > 20) { // Only consider elements with decent scores
      candidates.push({ element: $el, score });
    }
  });
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);
  
  const best = candidates[0];
  logger.debug(`Found content by scoring (score: ${best.score.toFixed(1)})`);
  return best.element;
}

/**
 * Strategy 4: Fallback - find largest text container
 * Last resort if other strategies fail
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Cheerio|null} Content container or null
 */
function findContentBySize($) {
  let $best = null;
  let maxLength = 0;
  
  $('body').find('div, section, article, main').each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    
    // Skip if too short or has too many links (likely navigation)
    if (text.length < 200) return;
    
    const linkCount = $el.find('a').length;
    if (linkCount > text.length / 50) return; // More than 1 link per 50 chars
    
    if (text.length > maxLength) {
      maxLength = text.length;
      $best = $el;
    }
  });
  
  if ($best) {
    logger.debug(`Found content by size (${maxLength} characters)`);
  }
  
  return $best;
}

/**
 * Normalizes text content by cleaning whitespace and structure
 * @param {string} text - Raw text to normalize
 * @returns {string} Clean, normalized text
 */
function normalizeText(text) {
  // Replace multiple whitespace with single space
  let normalized = text.replace(/\s+/g, ' ');
  
  // Replace multiple newlines with double newline (paragraph breaks)
  normalized = normalized.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  // Trim whitespace from each line
  normalized = normalized.split('\n').map(line => line.trim()).join('\n');
  
  // Remove excessive blank lines (more than 2 consecutive)
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  
  // Final trim
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Extracts clean, readable content from a blog/article URL
 * @param {string} url - URL of the article to extract content from
 * @returns {Promise<Object>} Object with title, content, and metadata
 * @throws {HttpError|ParseError|ScraperError} If extraction fails
 */
export async function extractArticleContent(url) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new ScraperError('URL is required and must be a non-empty string');
  }
  
  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new ScraperError(`Invalid URL format: ${url}`);
  }
  
  logger.info(`Extracting content from: ${url}`);
  
  try {
    // Step 1: Fetch the page
    const html = await fetchPage(url);
    
    // Step 2: Parse HTML
    const $ = cheerio.load(html);
    
    // Step 3: Extract title (try multiple strategies)
    let title = '';
    const titleSelectors = [
      'h1',
      'title',
      '.title',
      '.post-title',
      '.article-title',
      '[class*="title"]'
    ];
    
    for (const selector of titleSelectors) {
      const $title = $(selector).first();
      if ($title.length > 0) {
        title = $title.text().trim();
        if (title.length > 0 && title.length < 200) { // Reasonable title length
          break;
        }
      }
    }
    
    // Fallback: use page title
    if (!title) {
      title = $('title').text().trim() || 'Untitled';
    }
    
    logger.debug(`Extracted title: ${title}`);
    
    // Step 4: Find main content using multiple strategies
    let $content = null;
    
    // Strategy 1: Semantic HTML5 elements
    $content = findContentBySemanticElements($);
    
    // Strategy 2: Common class patterns
    if (!$content) {
      $content = findContentByClassPatterns($);
    }
    
    // Strategy 3: Content scoring
    if (!$content) {
      $content = findContentByScoring($);
    }
    
    // Strategy 4: Fallback - largest text container
    if (!$content) {
      $content = findContentBySize($);
    }
    
    // Final fallback: use body (last resort)
    if (!$content) {
      logger.warn('All extraction strategies failed, using body as fallback');
      $content = $('body');
    }
    
    // Step 5: Remove unwanted elements
    removeUnwantedElements($, $content);
    
    // Step 6: Extract text content
    let text = $content.text();
    
    // Step 7: Normalize text
    text = normalizeText(text);
    
    // Validate that we extracted meaningful content
    if (text.length < 100) {
      throw new ParseError(
        `Extracted content is too short (${text.length} chars). ` +
        `The page may not contain article content or the structure is unrecognized.`
      );
    }
    
    logger.info(`Successfully extracted ${text.length} characters of content`);
    
    return {
      title: title || 'Untitled',
      content: text,
      url,
      contentLength: text.length,
      extractedAt: new Date().toISOString()
    };
    
  } catch (error) {
    if (error instanceof HttpError || error instanceof ParseError || error instanceof ScraperError) {
      throw error;
    }
    
    throw new ScraperError(`Failed to extract content from ${url}: ${error.message}`, error);
  }
}

