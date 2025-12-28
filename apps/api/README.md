# Article API

RESTful API for managing blog articles with support for original and AI-updated content.

## Features

- **CRUD Operations**: Create, read, update, and delete articles
- **Original Content Preservation**: Original content is never overwritten
- **Version Tracking**: Support for multiple updated versions of articles
- **Citation Management**: Store reference URLs for updated articles
- **Timestamp Tracking**: Automatic creation and update timestamps

## Installation

```bash
cd apps/api
npm install
```

## Running

```bash
# Development
npm run dev

# Production
npm start
```

The API will run on `http://localhost:3001` (or the port specified in `.env.local`).

## API Endpoints

### Health Check
- `GET /health` - Check API status

### Articles

#### List Articles
- `GET /api/articles`
- Query parameters:
  - `type`: Filter by type (`original` or `updated`)
  - `originalArticleId`: Get all updates for a specific article
  - `sortBy`: Sort field (`createdAt`, `updatedAt`, `title`)
  - `sortOrder`: Sort order (`asc` or `desc`)

#### Get Article
- `GET /api/articles/:id`

#### Create Article
- `POST /api/articles`

#### Update Article
- `PUT /api/articles/:id`
- Note: `originalContent` cannot be modified

#### Delete Article
- `DELETE /api/articles/:id`

#### Create Article Update
- `POST /api/articles/:id/updates`
- Creates a new updated version while preserving the original

#### Get Article Updates
- `GET /api/articles/:id/updates`
- Returns all updated versions of an article

## Data Model

```javascript
{
  id: number,
  title: string,
  url: string,
  originalContent: string,        // Immutable
  updatedContent: string | null,   // AI-generated content
  type: 'original' | 'updated',
  citationUrls: string[],         // Reference URLs
  originalArticleId: number | null, // ID of original (if updated)
  createdAt: string,              // ISO date string
  updatedAt: string,              // ISO date string
  originalPublishDate: string | null // ISO date string
}
```

## Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": 400,
    "details": ["Additional error details"]
  }
}
```

## Example Requests

See `docs/api.md` for detailed examples.

