# Automation Scripts

This package contains automation scripts for web scraping, Google search integration, and LLM-based article updates.

## Google Search Service

The Google search service finds relevant blog/article pages for a given article title.

### Features

- **Google Custom Search API**: Uses official API for reliable results
- **Web Scraping Fallback**: Falls back to scraping if API unavailable
- **Intelligent Filtering**: Filters out ads, non-article pages, and excluded domains
- **Query Expansion**: Automatically tries query variations if insufficient results
- **Deterministic Logic**: Clear, explainable filtering rules

### Usage

#### Command Line

```bash
npm run search "Article Title"
# or
node src/index.js search "Article Title"
```

#### Programmatic

```javascript
import { searchForArticle, structureResultsForScraping } from './services/googleSearch.js';

const results = await searchForArticle('Getting Started with Node.js', {
  minResults: 2,
  maxAttempts: 3
});

const structured = structureResultsForScraping(results);
```

### Configuration

Set up Google Custom Search API credentials in `.env.local`:

```env
GOOGLE_API_KEY=your-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
```

See `src/services/README.md` for detailed documentation.

## Article Content Extractor

The article content extractor extracts clean, readable content from any blog/article URL.

### Features

- **Multi-Strategy Extraction**: Uses 4 different strategies to find main content
- **Content Cleaning**: Removes navigation, ads, social widgets, and other noise
- **Resilient**: Works with various website structures and CMS platforms
- **Text Normalization**: Returns clean, well-formatted plain text
- **LLM-Ready**: Output is optimized for LLM input

### Usage

#### Command Line

```bash
npm run extract "https://example.com/blog/article"
# or
node src/index.js extract "https://example.com/blog/article"
```

#### Programmatic

```javascript
import { extractArticleContent } from './scrapers/articleContentExtractor.js';

const result = await extractArticleContent('https://example.com/blog/article');
console.log(result.content);
```

### Output Format

```javascript
{
  title: "Article Title",
  content: "Clean, readable article content...",
  url: "https://example.com/blog/article",
  contentLength: 5000,
  extractedAt: "2024-01-15T10:30:00.000Z"
}
```

### Extraction Strategy

The extractor uses a multi-strategy approach:

1. **Semantic HTML5**: Looks for `<article>`, `<main>`, or `[role="article"]` tags
2. **Class Patterns**: Searches for common class names (`.article-content`, `.post-content`, etc.)
3. **Content Scoring**: Scores all potential containers using heuristics
4. **Size Fallback**: Selects the largest text container as last resort

After finding content, it removes:
- Navigation elements
- Ads and promotional content
- Social media widgets
- Comments sections
- Related content sections
- Forms and newsletter signups
- Hidden elements

### Error Handling

The extractor includes comprehensive error handling:
- **HttpError**: Network or HTTP errors
- **ParseError**: Content extraction failures
- **ScraperError**: General scraping errors

## Blog Scraper

The blog scraper fetches the 5 oldest articles from https://beyondchats.com/blogs/

### Features

- **Pagination Support**: Automatically handles pagination to find all articles
- **Date Parsing**: Extracts and parses publish dates from various formats
- **Content Extraction**: Cleans and extracts main article content, removing navigation and ads
- **Error Handling**: Robust error handling with detailed logging
- **Reusable**: Standalone module that can be imported and used programmatically

### Installation

```bash
cd scripts/automation
npm install
```

### Usage

#### Command Line

```bash
npm run scrape
# or
node src/index.js scrape
```

#### Programmatic

```javascript
import { scrapeOldestArticles } from './scrapers/blogScraper.js';

const articles = await scrapeOldestArticles();
console.log(articles);
```

### Output Format

The scraper returns an array of article objects:

```javascript
[
  {
    title: "Article Title",
    url: "https://beyondchats.com/blog/article-url",
    content: "Clean text content of the article...",
    publishDate: "2024-01-15T10:30:00.000Z" // ISO string or null
  },
  // ... 4 more articles
]
```

### How It Works

1. **Fetches Blog Listing**: Starts at `/blogs/` and follows pagination links
2. **Extracts Article Metadata**: Finds article links, titles, and publish dates
3. **Sorts by Date**: Orders articles chronologically (oldest first)
4. **Selects Top 5**: Takes the 5 oldest articles
5. **Fetches Content**: Downloads each article page and extracts clean content
6. **Returns Clean Data**: Returns structured data without HTML

### Assumptions

The scraper makes the following assumptions about the blog structure:

- Articles are listed on `/blogs/` with pagination
- Article links contain `/blog/` or `/post/` in the URL
- Publish dates are available in HTML (either in `<time>` tags or text)
- Main content is in semantic HTML elements (`<article>`, `<main>`, etc.)
- Oldest articles are either at the end of pagination or sorted by date

### Error Handling

The scraper includes comprehensive error handling:

- **HttpError**: Network or HTTP errors (timeouts, 404, etc.)
- **ParseError**: HTML parsing failures or missing expected elements
- **ScraperError**: General scraping errors

All errors are logged with timestamps and context.

### Logging

The scraper uses a structured logger that outputs:
- Timestamp
- Log level (ERROR, WARN, INFO, DEBUG)
- Message
- Optional data payload

### Dependencies

- `axios`: HTTP client for fetching pages
- `cheerio`: Fast, server-side HTML parsing (jQuery-like API)
- `dotenv`: Environment variable management (dev dependency)

