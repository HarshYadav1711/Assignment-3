/**
 * Article Detail Component
 * 
 * Displays full article content with original and updated versions.
 * Shows reference URLs and metadata.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchArticle, fetchArticleUpdates } from '../services/api';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import './ArticleDetail.css';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'original', 'updates'

  useEffect(() => {
    const loadArticle = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const articleData = await fetchArticle(id);
        setArticle(articleData);
        
        // If this is an original article, load its updates
        if (articleData.type === 'original') {
          try {
            const updatesData = await fetchArticleUpdates(id);
            setUpdates(updatesData);
          } catch (err) {
            // Updates not found is not critical
            console.warn('Could not load updates:', err);
          }
        } else if (articleData.originalArticleId) {
          // If this is an update, load the original
          try {
            const originalData = await fetchArticle(articleData.originalArticleId);
            setArticle(prev => ({ ...prev, originalArticle: originalData }));
          } catch (err) {
            console.warn('Could not load original article:', err);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <Loading message="Loading article..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!article) {
    return <ErrorMessage error="Article not found" />;
  }

  const isUpdated = article.type === 'updated';
  const displayContent = article.updatedContent || article.originalContent || '';
  const hasOriginal = article.originalArticle || (isUpdated && article.originalContent);

  return (
    <div className="article-detail-container">
      <Link to="/" className="article-detail-back">
        ← Back to Articles
      </Link>

      <div className="article-detail-header">
        <div className="article-detail-badges">
          <span className={`article-type-badge ${isUpdated ? 'badge-updated' : 'badge-original'}`}>
            {isUpdated ? 'Updated' : 'Original'}
          </span>
          {article.originalArticleId && (
            <Link 
              to={`/articles/${article.originalArticleId}`}
              className="article-link-badge"
            >
              View Original #{article.originalArticleId}
            </Link>
          )}
        </div>
        
        <h1 className="article-detail-title">{article.title}</h1>
        
        <div className="article-detail-meta">
          <div className="meta-item">
            <strong>Created:</strong> {formatDate(article.createdAt)}
          </div>
          <div className="meta-item">
            <strong>Updated:</strong> {formatDate(article.updatedAt)}
          </div>
          {article.originalPublishDate && (
            <div className="meta-item">
              <strong>Published:</strong> {formatDate(article.originalPublishDate)}
            </div>
          )}
          {article.url && (
            <div className="meta-item">
              <strong>Source:</strong>{' '}
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                {article.url}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tabs for content switching */}
      {hasOriginal && (
        <div className="article-detail-tabs">
          <button
            className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            {isUpdated ? 'Updated Content' : 'Content'}
          </button>
          {isUpdated && article.originalContent && (
            <button
              className={`tab-button ${activeTab === 'original' ? 'active' : ''}`}
              onClick={() => setActiveTab('original')}
            >
              Original Content
            </button>
          )}
          {article.type === 'original' && updates.length > 0 && (
            <button
              className={`tab-button ${activeTab === 'updates' ? 'active' : ''}`}
              onClick={() => setActiveTab('updates')}
            >
              Updates ({updates.length})
            </button>
          )}
        </div>
      )}

      {/* Content display */}
      <div className="article-detail-content">
        {activeTab === 'content' && (
          <div className="content-section">
            <div className="content-text">
              {displayContent.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'original' && article.originalContent && (
          <div className="content-section">
            <div className="content-text">
              {article.originalContent.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="updates-section">
            {updates.length === 0 ? (
              <p>No updates available.</p>
            ) : (
              updates.map((update) => (
                <div key={update.id} className="update-item">
                  <div className="update-header">
                    <Link to={`/articles/${update.id}`}>
                      <h3>Update #{update.id}</h3>
                    </Link>
                    <span className="update-date">{formatDate(update.createdAt)}</span>
                  </div>
                  {update.citationUrls && update.citationUrls.length > 0 && (
                    <div className="update-references">
                      <strong>References:</strong>
                      <ul>
                        {update.citationUrls.map((url, idx) => (
                          <li key={idx}>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Link to={`/articles/${update.id}`} className="btn-primary">
                    View Full Update
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Reference URLs */}
      {article.citationUrls && article.citationUrls.length > 0 && (
        <div className="article-detail-references">
          <h3>Reference Sources</h3>
          <ul>
            {article.citationUrls.map((url, index) => (
              <li key={index}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

