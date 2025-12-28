/**
 * Main entry point for automation scripts
 * Can be extended to include other automation tasks
 */

import { scrapeOldestArticles } from './scrapers/blogScraper.js';
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
        
      default:
        logger.warn(`Unknown command: ${command}`);
        logger.info('Available commands: scrape');
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

