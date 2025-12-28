# Automation Scripts

This package contains automation scripts for web scraping, Google search integration, and LLM-based article updates.

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

