/**
 * Article Data Model
 * 
 * Design Decisions:
 * 1. Immutable original content: originalContent is never modified after creation
 * 2. Version tracking: updatedContent stores AI-generated versions separately
 * 3. Reference URLs: citationUrls array stores sources used for updates
 * 4. Timestamps: createdAt tracks original creation, updatedAt tracks last modification
 * 5. Type field: distinguishes between 'original' and 'updated' articles
 * 
 * This is an in-memory model for demonstration. In production, this would be
 * replaced with a database ORM (Prisma, Sequelize, Mongoose, etc.)
 */

/**
 * In-memory storage (replace with database in production)
 */
let articles = [];
let nextId = 1;

/**
 * Article Schema
 * 
 * @typedef {Object} Article
 * @property {number} id - Unique identifier
 * @property {string} title - Article title
 * @property {string} url - Original article URL
 * @property {string} originalContent - Original article content (immutable)
 * @property {string|null} updatedContent - AI-generated updated content (null for original articles)
 * @property {string} type - 'original' or 'updated'
 * @property {string[]} citationUrls - URLs used as references for updated content
 * @property {string|null} originalArticleId - ID of original article (if this is an update)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {Date|null} originalPublishDate - Original publish date from source
 */

/**
 * Validates article data
 * @param {Object} data - Article data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result with isValid and errors
 */
export function validateArticle(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string');
    }
    
    if (!data.url || typeof data.url !== 'string' || data.url.trim().length === 0) {
      errors.push('url is required and must be a non-empty string');
    }
    
    if (!data.originalContent || typeof data.originalContent !== 'string' || data.originalContent.trim().length === 0) {
      errors.push('originalContent is required and must be a non-empty string');
    }
  } else {
    // For updates, only validate provided fields
    if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim().length === 0)) {
      errors.push('title must be a non-empty string if provided');
    }
    
    if (data.url !== undefined && (typeof data.url !== 'string' || data.url.trim().length === 0)) {
      errors.push('url must be a non-empty string if provided');
    }
  }
  
  // Validate URL format
  if (data.url) {
    try {
      new URL(data.url);
    } catch {
      errors.push('url must be a valid URL');
    }
  }
  
  // Validate type
  if (data.type !== undefined && !['original', 'updated'].includes(data.type)) {
    errors.push("type must be either 'original' or 'updated'");
  }
  
  // Validate citationUrls
  if (data.citationUrls !== undefined) {
    if (!Array.isArray(data.citationUrls)) {
      errors.push('citationUrls must be an array');
    } else {
      const invalidUrls = data.citationUrls.filter(url => {
        if (typeof url !== 'string') return true;
        try {
          new URL(url);
          return false;
        } catch {
          return true;
        }
      });
      
      if (invalidUrls.length > 0) {
        errors.push('citationUrls must contain valid URLs');
      }
    }
  }
  
  // Validate originalArticleId
  if (data.originalArticleId !== undefined && data.originalArticleId !== null) {
    if (typeof data.originalArticleId !== 'number' || data.originalArticleId <= 0) {
      errors.push('originalArticleId must be a positive number');
    }
  }
  
  // Validate dates
  if (data.originalPublishDate !== undefined && data.originalPublishDate !== null) {
    const date = new Date(data.originalPublishDate);
    if (isNaN(date.getTime())) {
      errors.push('originalPublishDate must be a valid ISO date string');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates a new article
 * @param {Object} data - Article data
 * @returns {Article} Created article
 */
export function createArticle(data) {
  const now = new Date();
  
  const article = {
    id: nextId++,
    title: data.title.trim(),
    url: data.url.trim(),
    originalContent: data.originalContent.trim(),
    updatedContent: data.updatedContent?.trim() || null,
    type: data.type || (data.updatedContent ? 'updated' : 'original'),
    citationUrls: data.citationUrls || [],
    originalArticleId: data.originalArticleId || null,
    createdAt: now,
    updatedAt: now,
    originalPublishDate: data.originalPublishDate ? new Date(data.originalPublishDate) : null
  };
  
  articles.push(article);
  return article;
}

/**
 * Gets all articles with optional filtering
 * @param {Object} filters - Filter options
 * @returns {Article[]} Array of articles
 */
export function getAllArticles(filters = {}) {
  let result = [...articles];
  
  // Filter by type
  if (filters.type) {
    result = result.filter(article => article.type === filters.type);
  }
  
  // Filter by originalArticleId (get updates for a specific article)
  if (filters.originalArticleId !== undefined) {
    result = result.filter(article => article.originalArticleId === filters.originalArticleId);
  }
  
  // Sort by createdAt (newest first) or updatedAt
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';
  
  result.sort((a, b) => {
    const aValue = a[sortBy]?.getTime() || 0;
    const bValue = b[sortBy]?.getTime() || 0;
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    }
    return bValue - aValue;
  });
  
  return result;
}

/**
 * Gets a single article by ID
 * @param {number} id - Article ID
 * @returns {Article|null} Article or null if not found
 */
export function getArticleById(id) {
  return articles.find(article => article.id === id) || null;
}

/**
 * Updates an article (preserves original content)
 * @param {number} id - Article ID
 * @param {Object} updates - Fields to update
 * @returns {Article|null} Updated article or null if not found
 */
export function updateArticle(id, updates) {
  const article = articles.find(a => a.id === id);
  if (!article) {
    return null;
  }
  
  // Never allow updating originalContent
  const { originalContent, ...safeUpdates } = updates;
  
  // Update allowed fields
  if (safeUpdates.title !== undefined) {
    article.title = safeUpdates.title.trim();
  }
  
  if (safeUpdates.url !== undefined) {
    article.url = safeUpdates.url.trim();
  }
  
  if (safeUpdates.updatedContent !== undefined) {
    article.updatedContent = safeUpdates.updatedContent?.trim() || null;
  }
  
  if (safeUpdates.type !== undefined) {
    article.type = safeUpdates.type;
  }
  
  if (safeUpdates.citationUrls !== undefined) {
    article.citationUrls = safeUpdates.citationUrls;
  }
  
  if (safeUpdates.originalPublishDate !== undefined) {
    article.originalPublishDate = safeUpdates.originalPublishDate 
      ? new Date(safeUpdates.originalPublishDate) 
      : null;
  }
  
  article.updatedAt = new Date();
  
  return article;
}

/**
 * Deletes an article
 * @param {number} id - Article ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteArticle(id) {
  const index = articles.findIndex(article => article.id === id);
  if (index === -1) {
    return false;
  }
  
  articles.splice(index, 1);
  return true;
}

/**
 * Creates an updated version of an article (preserves original)
 * @param {number} originalArticleId - ID of original article
 * @param {Object} updateData - Updated content and metadata
 * @returns {Article|null} New updated article or null if original not found
 */
export function createArticleUpdate(originalArticleId, updateData) {
  const originalArticle = getArticleById(originalArticleId);
  if (!originalArticle) {
    return null;
  }
  
  const now = new Date();
  
  const updatedArticle = {
    id: nextId++,
    title: updateData.title || originalArticle.title,
    url: originalArticle.url, // Keep original URL
    originalContent: originalArticle.originalContent, // Preserve original
    updatedContent: updateData.updatedContent?.trim() || null,
    type: 'updated',
    citationUrls: updateData.citationUrls || [],
    originalArticleId: originalArticleId,
    createdAt: now,
    updatedAt: now,
    originalPublishDate: originalArticle.originalPublishDate
  };
  
  articles.push(updatedArticle);
  return updatedArticle;
}

/**
 * Serializes article for JSON response (converts Dates to ISO strings)
 * @param {Article} article - Article to serialize
 * @returns {Object} Serialized article
 */
export function serializeArticle(article) {
  return {
    ...article,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    originalPublishDate: article.originalPublishDate?.toISOString() || null
  };
}

