/**
 * Loading Component
 * 
 * Simple loading indicator for async operations.
 */

import './Loading.css';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

