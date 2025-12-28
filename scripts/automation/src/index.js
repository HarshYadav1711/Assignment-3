/**
 * Main entry point for automation scripts
 * Can be extended to include other automation tasks
 */

import { scrapeOldestArticles } from './scrapers/blogScraper.js';
import { extractArticleContent } from './scrapers/articleContentExtractor.js';
import { searchForArticle, structureResultsForScraping } from './services/googleSearch.js';
import { improveArticleWithLLM, getImprovementPrompt } from './services/llmService.js';
import { processOldestArticles, processSingleArticleUpdate } from './processors/articleUpdateProcessor.js';
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
        
      case 'update':
        const apiUrl = process.env.API_URL || 'http://localhost:3001';
        const articleIdArg = process.argv[3];
        
        if (articleIdArg) {
          // Update single article by ID
          const articleId = parseInt(articleIdArg, 10);
          if (isNaN(articleId)) {
            logger.error('Article ID must be a number');
            logger.info('Usage: node src/index.js update <articleId>');
            process.exit(1);
          }
          
          logger.info(`Processing update for article ID: ${articleId}`);
          const singleResult = await processSingleArticleUpdate({
            articleId,
            apiUrl,
            options: {
              skipIfExists: true
            }
          });
          
          logger.info(`\n=== Update Result ===`);
          console.log(JSON.stringify(singleResult, null, 2));
          
          return singleResult;
        } else {
          // Process oldest articles
          const articleCount = parseInt(process.argv[4] || '5', 10);
          
          logger.info('Processing oldest articles from BeyondChats...');
          const pipelineResult = await processOldestArticles({
            apiUrl,
            articleCount,
            skipIfExists: true
          });
          
          logger.info(`\n=== Pipeline Results ===`);
          console.log(`Total Processed: ${pipelineResult.total}`);
          console.log(`Successful: ${pipelineResult.successful}`);
          console.log(`Skipped: ${pipelineResult.skipped}`);
          console.log(`Failed: ${pipelineResult.failed}`);
          
          if (pipelineResult.articles.length > 0) {
            console.log(`\n=== Article Details ===`);
            pipelineResult.articles.forEach((article, index) => {
              console.log(`\n${index + 1}. ${article.originalTitle || 'Unknown'}`);
              if (article.success) {
                console.log(`   Status: ${article.skipped ? 'Skipped (already exists)' : 'Created'}`);
                console.log(`   Original ID: ${article.originalArticleId}`);
                console.log(`   Update ID: ${article.updateArticleId}`);
                console.log(`   Reference URLs: ${article.referenceUrls?.length || 0}`);
              } else {
                console.log(`   Status: Failed`);
                console.log(`   Error: ${article.error}`);
              }
            });
          }
          
          return pipelineResult;
        }
        
      default:
        logger.warn(`Unknown command: ${command}`);
        logger.info('Available commands: scrape, search, extract, update');
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
export { improveArticleWithLLM, getImprovementPrompt } from './services/llmService.js';
export { processOldestArticles, processSingleArticleUpdate } from './processors/articleUpdateProcessor.js';
export { createApiClient } from './services/apiClient.js';

