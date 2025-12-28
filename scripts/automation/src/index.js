/**
 * Main entry point for automation scripts
 * Can be extended to include other automation tasks
 */

import { scrapeOldestArticles } from './scrapers/blogScraper.js';
import { extractArticleContent } from './scrapers/articleContentExtractor.js';
import { searchForArticle, structureResultsForScraping } from './services/googleSearch.js';
import { logger } from './utils/logger.js';
import { ScraperError, HttpError, ParseError } from './utils/errors.js';

// Load environment variables if dotenv is available
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (error) {
  // dotenv is optional
}

/**
 * Main execution function
 */
async function main() {
  const command = process.argv[2] || 'scrape';
  
  try {
    switch (command) {
      case 'scrape':
        logger.info('Running blog scraper...');
        const articles = await scrapeOldestArticles();
        
        logger.info('\n=== Scraping Results ===');
        articles.forEach((article, index) => {
          console.log(`\n${index + 1}. ${article.title}`);
          console.log(`   URL: ${article.url}`);
          console.log(`   Date: ${article.publishDate || 'Not available'}`);
          console.log(`   Content length: ${article.content?.length || 0} characters`);
        });
        
        // Return articles for programmatic use
        return articles;
        
      case 'search':
        const searchTitle = process.argv[3];
        if (!searchTitle) {
          logger.error('Please provide an article title to search for');
          logger.info('Usage: node src/index.js search "Article Title"');
          process.exit(1);
        }
        
        logger.info(`Searching Google for: "${searchTitle}"`);
        const searchResults = await searchForArticle(searchTitle, {
          minResults: 2,
          maxAttempts: 3
        });
        
        logger.info(`\n=== Search Results (${searchResults.length} found) ===`);
        const structured = structureResultsForScraping(searchResults);
        structured.forEach((result) => {
          console.log(`\n${result.rank}. ${result.title}`);
          console.log(`   URL: ${result.url}`);
          console.log(`   Domain: ${result.domain}`);
          console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
          console.log(`   Reason: ${result.metadata.reason}`);
        });
        
        return structured;
        
      case 'extract':
        const articleUrl = process.argv[3];
        if (!articleUrl) {
          logger.error('Please provide an article URL to extract content from');
          logger.info('Usage: node src/index.js extract "https://example.com/article"');
          process.exit(1);
        }
        
        logger.info(`Extracting content from: ${articleUrl}`);
        const extracted = await extractArticleContent(articleUrl);
        
        logger.info(`\n=== Extracted Content ===`);
        console.log(`\nTitle: ${extracted.title}`);
        console.log(`URL: ${extracted.url}`);
        console.log(`Content Length: ${extracted.contentLength} characters`);
        console.log(`Extracted At: ${extracted.extractedAt}`);
        console.log(`\n--- Content Preview (first 500 chars) ---`);
        console.log(extracted.content.substring(0, 500) + '...');
        console.log(`\n--- Full Content ---`);
        console.log(extracted.content);
        
        return extracted;
        
      default:
        logger.warn(`Unknown command: ${command}`);
        logger.info('Available commands: scrape, search, extract');
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof HttpError) {
      logger.error(`HTTP Error: ${error.message}`, { statusCode: error.statusCode });
    } else if (error instanceof ParseError) {
      logger.error(`Parse Error: ${error.message}`);
    } else if (error instanceof ScraperError) {
      logger.error(`Scraper Error: ${error.message}`);
    } else {
      logger.error(`Unexpected error: ${error.message}`, { error: error.stack });
    }
    
    process.exit(1);
  }
}

// Run main function when script is executed directly
// In ES modules, we can check if this is the main module
main().catch(error => {
  logger.error('Unhandled error in main', { error: error.message, stack: error.stack });
  process.exit(1);
});

export { scrapeOldestArticles };
export { extractArticleContent } from './scrapers/articleContentExtractor.js';
export { searchForArticle, structureResultsForScraping } from './services/googleSearch.js';

