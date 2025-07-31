import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AnalyzeRepo from './components/AnalyzeRepo';
import './App.css';

/**
 * Main App Component - Sets up routing for the application
 * 
 * Routes:
 * - / : Login page (public)
 * - /dashboard : User dashboard (protected)
 * - /analyze : Repository analysis page (protected)
 */
function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public route - Login page */}
        <Route path="/" element={<Login />} />
        
        {/* Protected routes - User must be authenticated */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analyze" element={<AnalyzeRepo />} />
      </Routes>
    </div>
  );
}

export default App;