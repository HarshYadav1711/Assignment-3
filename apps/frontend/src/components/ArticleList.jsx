/**
 * Article List Component
 * 
 * Displays a list of articles with filtering options.
 * Handles loading and error states.
 */

import { useState, useEffect } from 'react';
import { fetchArticles } from '../services/api';
import ArticleCard from './ArticleCard';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import './ArticleList.css';

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'original', 'updated'

  const loadArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = filter !== 'all' ? { type: filter } : {};
      const data = await fetchArticles(filters);
      setArticles(data);
    } catch (err) {
      setError(err.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [filter]);

  if (loading) {
    return <Loading message="Loading articles..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={loadArticles} />;
  }

  return (
    <div className="article-list-container">
      <div className="article-list-header">
        <h1>Articles</h1>
        <div className="article-list-filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${filter === 'original' ? 'active' : ''}`}
            onClick={() => setFilter('original')}
          >
            Original
          </button>
          <button
            className={`filter-button ${filter === 'updated' ? 'active' : ''}`}
            onClick={() => setFilter('updated')}
          >
            Updated
          </button>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="article-list-empty">
          <p>No articles found.</p>
        </div>
      ) : (
        <div className="article-list-grid">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

