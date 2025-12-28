# Google Search Service

Service module for searching Google and filtering results to find relevant blog/article pages.

## Features

- **Google Custom Search API Integration**: Uses official API for reliable results
- **Web Scraping Fallback**: Falls back to scraping if API unavailable
- **Intelligent Filtering**: Filters out ads, non-article pages, and excluded domains
- **Query Expansion**: Automatically tries query variations if insufficient results
- **Deterministic Logic**: Clear, explainable filtering rules
- **Structured Output**: Returns data ready for downstream scraping

## Installation

Ensure you have the required dependencies:

```bash
npm install
```

## Configuration

Set up Google Custom Search API credentials in `.env.local`:

```env
GOOGLE_API_KEY=your-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
```

**Getting API Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Custom Search API
3. Create API key
4. Create a Custom Search Engine at [Google Programmable Search](https://programmablesearchengine.google.com/)
5. Get your Search Engine ID

**Note:** If API credentials are not provided, the service will attempt web scraping as a fallback (less reliable and may violate Google's Terms of Service).

## Usage

### Basic Usage

```javascript
import { searchForArticle } from './services/googleSearch.js';

const results = await searchForArticle('Getting Started with Node.js');
console.log(results);
```

### With Options

```javascript
const results = await searchForArticle('Getting Started with Node.js', {
  minResults: 2,      // Minimum number of results (default: 2)
  maxAttempts: 3,     // Max search attempts with variations (default: 3)
  useAPI: true        // Use API or web scraping (default: true)
});
```

### Structure Results for Scraping

```javascript
import { searchForArticle, structureResultsForScraping } from './services/googleSearch.js';

const results = await searchForArticle('Article Title');
const structured = structureResultsForScraping(results);
// structured is ready for downstream scraping
```

## Output Format

```javascript
[
  {
    title: "Article Title",
    url: "https://example.com/blog/article",
    snippet: "Article snippet...",
    domain: "example.com",
    reason: "Valid article URL"
  },
  // ... more results
]
```

## Filtering Rules

The service uses deterministic rules to identify valid article/blog pages:

### Included:
- URLs with `/blog/`, `/article/`, `/post/`, `/news/` patterns
- Date-based URLs (YYYY/MM/)
- URLs ending in `.html` or `.php`
- Pages with article-related keywords in title

### Excluded:
- `beyondchats.com` domain (and subdomains)
- Social media platforms (YouTube, Facebook, Twitter, etc.)
- E-commerce sites (Amazon, eBay, Etsy)
- Non-content pages (tags, categories, search, feeds)
- Ad and tracking URLs
- Homepage and utility pages (about, contact, etc.)

## Fallback Strategy

If fewer than the requested number of results are found:

1. **Query Expansion**: Tries variations of the search query:
   - Original query
   - Query + "blog"
   - Query + "article"
   - Quoted query
   - Query + "guide"
   - Query + "tutorial"

2. **Partial Results**: Returns available results even if below minimum

3. **Error Handling**: Throws descriptive error if no results found

## Error Handling

The service throws custom errors:

- `ScraperError`: General scraping/search errors
- `HttpError`: HTTP/network errors

All errors are logged with context for debugging.

## Example

```javascript
import { searchForArticle, structureResultsForScraping } from './services/googleSearch.js';
import { logger } from './utils/logger.js';

try {
  const results = await searchForArticle('Introduction to React Hooks', {
    minResults: 2
  });
  
  logger.info(`Found ${results.length} articles`);
  
  const structured = structureResultsForScraping(results);
  
  // Use structured results for downstream scraping
  for (const result of structured) {
    console.log(`${result.rank}. ${result.title}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Domain: ${result.domain}`);
  }
} catch (error) {
  logger.error('Search failed', { error: error.message });
}
```

