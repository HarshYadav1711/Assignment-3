/**
 * Error Message Component
 * 
 * Displays error messages in a clear, user-friendly way.
 */

import './ErrorMessage.css';

export default function ErrorMessage({ error, onRetry = null }) {
  if (!error) return null;

  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h3 className="error-title">Error</h3>
        <p className="error-message">{error}</p>
        {onRetry && (
          <button className="btn-primary error-retry" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

