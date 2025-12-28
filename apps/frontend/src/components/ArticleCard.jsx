/**
 * Article Card Component
 * 
 * Displays a preview of an article in a card format.
 * Shows article type, title, and basic metadata.
 */

import { Link } from 'react-router-dom';
import './ArticleCard.css';

export default function ArticleCard({ article }) {
  const isUpdated = article.type === 'updated';
  const content = article.updatedContent || article.originalContent || '';
  const preview = content.substring(0, 150) + (content.length > 150 ? '...' : '');
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`article-card ${isUpdated ? 'article-card-updated' : 'article-card-original'}`}>
      <div className="article-card-header">
        <span className={`article-type-badge ${isUpdated ? 'badge-updated' : 'badge-original'}`}>
          {isUpdated ? 'Updated' : 'Original'}
        </span>
        {article.originalArticleId && (
          <span className="article-link-badge">
            Linked to #{article.originalArticleId}
          </span>
        )}
      </div>
      
      <Link to={`/articles/${article.id}`} className="article-card-link">
        <h3 className="article-card-title">{article.title}</h3>
      </Link>
      
      <div className="article-card-meta">
        <span className="article-card-date">
          {formatDate(article.createdAt)}
        </span>
        {article.originalPublishDate && (
          <span className="article-card-original-date">
            Published: {formatDate(article.originalPublishDate)}
          </span>
        )}
      </div>
      
      <p className="article-card-preview">{preview}</p>
      
      {article.citationUrls && article.citationUrls.length > 0 && (
        <div className="article-card-references">
          <strong>References:</strong> {article.citationUrls.length} source(s)
        </div>
      )}
      
      <div className="article-card-footer">
        <Link to={`/articles/${article.id}`} className="btn-primary article-card-button">
          View Details
        </Link>
      </div>
    </div>
  );
}

