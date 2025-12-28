# API Documentation

Complete API documentation with request/response examples.

## Base URL

```
http://localhost:3001/api
```

## Article Endpoints

### 1. List Articles

**GET** `/articles`

List all articles with optional filtering and sorting.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type: `original` or `updated` |
| `originalArticleId` | number | Get all updates for a specific article |
| `sortBy` | string | Sort field: `createdAt`, `updatedAt`, or `title` |
| `sortOrder` | string | Sort order: `asc` or `desc` (default: `desc`) |

#### Example Request

```bash
GET /api/articles?type=original&sortBy=createdAt&sortOrder=asc
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Getting Started with Node.js",
      "url": "https://beyondchats.com/blog/getting-started-nodejs",
      "originalContent": "Node.js is a powerful runtime...",
      "updatedContent": null,
      "type": "original",
      "citationUrls": [],
      "originalArticleId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "originalPublishDate": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get Article

**GET** `/articles/:id`

Get a single article by ID.

#### Example Request

```bash
GET /api/articles/1
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Getting Started with Node.js",
    "url": "https://beyondchats.com/blog/getting-started-nodejs",
    "originalContent": "Node.js is a powerful runtime...",
    "updatedContent": null,
    "type": "original",
    "citationUrls": [],
    "originalArticleId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "originalPublishDate": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Error Response (404)

```json
{
  "success": false,
  "error": {
    "message": "Article with ID 999 not found",
    "code": 404
  }
}
```

---

### 3. Create Article

**POST** `/articles`

Create a new article.

#### Request Body

```json
{
  "title": "Getting Started with Node.js",
  "url": "https://beyondchats.com/blog/getting-started-nodejs",
  "originalContent": "Node.js is a powerful runtime environment...",
  "originalPublishDate": "2024-01-15T10:00:00.000Z",
  "type": "original"
}
```

#### Required Fields

- `title`: Article title (string, non-empty)
- `url`: Article URL (string, valid URL)
- `originalContent`: Original article content (string, non-empty)

#### Optional Fields

- `updatedContent`: Updated content (string)
- `type`: Article type - `original` or `updated` (defaults based on `updatedContent`)
- `citationUrls`: Array of reference URLs (string[])
- `originalArticleId`: ID of original article if this is an update (number)
- `originalPublishDate`: Original publish date (ISO date string)

#### Example Response (201)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Getting Started with Node.js",
    "url": "https://beyondchats.com/blog/getting-started-nodejs",
    "originalContent": "Node.js is a powerful runtime environment...",
    "updatedContent": null,
    "type": "original",
    "citationUrls": [],
    "originalArticleId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "originalPublishDate": "2024-01-15T10:00:00.000Z"
  },
  "message": "Article created successfully"
}
```

#### Error Response (400)

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": 400,
    "details": [
      "title is required and must be a non-empty string",
      "url must be a valid URL"
    ]
  }
}
```

---

### 4. Update Article

**PUT** `/articles/:id`

Update an existing article. **Note:** `originalContent` cannot be modified.

#### Request Body

```json
{
  "title": "Updated Title",
  "updatedContent": "Updated content here...",
  "citationUrls": [
    "https://example.com/reference1",
    "https://example.com/reference2"
  ]
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Title",
    "url": "https://beyondchats.com/blog/getting-started-nodejs",
    "originalContent": "Node.js is a powerful runtime environment...",
    "updatedContent": "Updated content here...",
    "type": "updated",
    "citationUrls": [
      "https://example.com/reference1",
      "https://example.com/reference2"
    ],
    "originalArticleId": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z",
    "originalPublishDate": "2024-01-15T10:00:00.000Z"
  },
  "message": "Article updated successfully"
}
```

#### Error Response (400) - Attempting to modify originalContent

```json
{
  "success": false,
  "error": {
    "message": "originalContent cannot be modified. Original content is immutable.",
    "code": 400
  }
}
```

---

### 5. Delete Article

**DELETE** `/articles/:id`

Delete an article.

#### Example Response

```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

---

### 6. Create Article Update

**POST** `/articles/:id/updates`

Create a new updated version of an article while preserving the original.

#### Request Body

```json
{
  "updatedContent": "AI-generated updated content with latest information...",
  "citationUrls": [
    "https://nodejs.org/en/docs/",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
  ],
  "title": "Updated: Getting Started with Node.js (Optional)"
}
```

#### Required Fields

- `updatedContent`: Updated content (string, non-empty)

#### Optional Fields

- `citationUrls`: Array of reference URLs (string[])
- `title`: Optional title override (string)

#### Example Response (201)

```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Getting Started with Node.js",
    "url": "https://beyondchats.com/blog/getting-started-nodejs",
    "originalContent": "Node.js is a powerful runtime environment...",
    "updatedContent": "AI-generated updated content with latest information...",
    "type": "updated",
    "citationUrls": [
      "https://nodejs.org/en/docs/",
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
    ],
    "originalArticleId": 1,
    "createdAt": "2024-01-16T09:00:00.000Z",
    "updatedAt": "2024-01-16T09:00:00.000Z",
    "originalPublishDate": "2024-01-15T10:00:00.000Z"
  },
  "message": "Article update created successfully"
}
```

---

### 7. Get Article Updates

**GET** `/articles/:id/updates`

Get all updated versions of a specific article.

#### Example Request

```bash
GET /api/articles/1/updates
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "Getting Started with Node.js",
      "url": "https://beyondchats.com/blog/getting-started-nodejs",
      "originalContent": "Node.js is a powerful runtime environment...",
      "updatedContent": "AI-generated updated content...",
      "type": "updated",
      "citationUrls": ["https://nodejs.org/en/docs/"],
      "originalArticleId": 1,
      "createdAt": "2024-01-16T09:00:00.000Z",
      "updatedAt": "2024-01-16T09:00:00.000Z",
      "originalPublishDate": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation error or invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server error |

## Design Decisions

### 1. Immutable Original Content

**Decision:** `originalContent` field cannot be modified after creation.

**Rationale:** 
- Preserves data integrity
- Allows comparison between original and updated versions
- Prevents accidental data loss
- Enables audit trail

**Implementation:** Validation middleware rejects any update attempts to `originalContent`.

### 2. Separate Update Endpoint

**Decision:** Use `/articles/:id/updates` endpoint to create new versions instead of overwriting.

**Rationale:**
- Maintains history of all updates
- Allows multiple updated versions
- Original article remains unchanged
- Better for analytics and tracking

### 3. Citation URLs Array

**Decision:** Store reference URLs as an array in `citationUrls`.

**Rationale:**
- Tracks sources used for AI updates
- Supports transparency and attribution
- Enables verification of updated content
- Useful for compliance and auditing

### 4. Type Field

**Decision:** Include `type` field (`original` or `updated`).

**Rationale:**
- Easy filtering and querying
- Clear distinction between article types
- Simplifies frontend display logic
- Supports business logic decisions

### 5. Timestamp Tracking

**Decision:** Track both `createdAt` and `updatedAt` timestamps.

**Rationale:**
- Audit trail for content changes
- Useful for sorting and filtering
- Helps identify recent updates
- Supports analytics and reporting

### 6. In-Memory Storage

**Decision:** Use in-memory storage for demonstration.

**Rationale:**
- Simple setup for evaluation
- No database dependencies
- Easy to understand and test
- Can be easily replaced with database ORM

**Production Note:** Replace with database (PostgreSQL, MongoDB, etc.) using Prisma, Sequelize, or Mongoose.

### 7. RESTful Design

**Decision:** Follow REST conventions with clear resource naming.

**Rationale:**
- Industry standard
- Easy to understand and consume
- Works well with frontend frameworks
- Supports caching and HTTP features

### 8. Consistent Response Format

**Decision:** All responses follow `{ success, data, error }` structure.

**Rationale:**
- Predictable API responses
- Easy error handling on frontend
- Consistent developer experience
- Supports API versioning

