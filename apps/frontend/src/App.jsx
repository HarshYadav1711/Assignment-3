/**
 * Main App Component
 * 
 * Sets up routing and overall layout.
 */

import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <div className="container">
          <Routes>
            <Route path="/" element={<ArticleList />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;

