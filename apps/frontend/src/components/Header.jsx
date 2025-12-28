/**
 * Header Component
 * 
 * Simple header with navigation.
 */

import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="app-header">
      <div className="container">
        <Link to="/" className="header-logo">
          <h1>BeyondChats Article Review</h1>
        </Link>
      </div>
    </header>
  );
}

