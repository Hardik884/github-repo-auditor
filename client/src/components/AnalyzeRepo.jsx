import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AnalyzeRepo.css';

/**
 * AnalyzeRepo Component - Repository analysis interface
 * 
 * Features:
 * - URL input and validation
 * - Repository analysis with loading states
 * - Display of repository metadata
 * - AI-generated summary
 * - Error handling
 */
function AnalyzeRepo() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  /**
   * Check authentication on component mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/user', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          navigate('/');
          return;
        }
        
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  /**
   * Validate GitHub URL format
   */
  const isValidGitHubUrl = (url) => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[^\/]+\/[^\/]+\/?$/;
    return githubPattern.test(url);
  };

  /**
   * Handle repository analysis
   */
  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    if (!isValidGitHubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ repoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format file size in bytes to human readable format
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Format date to readable format
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Calculate language percentages
   */
  const getLanguagePercentages = (languages) => {
    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    return Object.entries(languages).map(([lang, bytes]) => ({
      name: lang,
      percentage: ((bytes / total) * 100).toFixed(1),
      bytes
    })).sort((a, b) => b.bytes - a.bytes);
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="analyze-container">
      <header className="analyze-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1>🔍 Analyze Repository</h1>
          <div className="user-info">
            <img src={user.picture} alt="Profile" className="profile-picture" />
            <span>{user.name}</span>
          </div>
        </div>
      </header>

      <main className="analyze-main">
        <div className="input-section">
          <form onSubmit={handleAnalyze} className="url-form">
            <div className="input-group">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="url-input"
                disabled={loading}
              />
              <button 
                type="submit" 
                className="analyze-btn"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
        </div>

        {loading && (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Analyzing repository... This may take a few seconds.</p>
          </div>
        )}

        {result && (
          <div className="results-section">
            <div className="repo-header">
              <h2>
                <a href={result.repository.url} target="_blank" rel="noopener noreferrer">
                  {result.repository.fullName}
                </a>
              </h2>
              <p className="repo-description">{result.repository.description || 'No description available'}</p>
            </div>

            <div className="results-grid">
              {/* Repository Stats */}
              <div className="result-card">
                <h3>📊 Repository Stats</h3>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-value">⭐ {result.repository.stars.toLocaleString()}</span>
                    <span className="stat-label">Stars</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">🍴 {result.repository.forks.toLocaleString()}</span>
                    <span className="stat-label">Forks</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">👀 {result.repository.watchers.toLocaleString()}</span>
                    <span className="stat-label">Watchers</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">🐛 {result.repository.issues.toLocaleString()}</span>
                    <span className="stat-label">Issues</span>
                  </div>
                </div>
              </div>

              {/* Repository Info */}
              <div className="result-card">
                <h3>ℹ️ Repository Info</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{formatDate(result.repository.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">{formatDate(result.repository.updatedAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Size:</span>
                    <span className="info-value">{formatFileSize(result.repository.size * 1024)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">License:</span>
                    <span className="info-value">{result.repository.license}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Default Branch:</span>
                    <span className="info-value">{result.repository.defaultBranch}</span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              {Object.keys(result.languages).length > 0 && (
                <div className="result-card">
                  <h3>💻 Languages Used</h3>
                  <div className="languages-list">
                    {getLanguagePercentages(result.languages).map((lang, index) => (
                      <div key={lang.name} className="language-item">
                        <div className="language-info">
                          <span className="language-name">{lang.name}</span>
                          <span className="language-percentage">{lang.percentage}%</span>
                        </div>
                        <div className="language-bar">
                          <div 
                            className="language-fill" 
                            style={{ 
                              width: `${lang.percentage}%`,
                              backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {result.aiSummary && (
                <div className="result-card full-width">
                  <h3>🧠 AI-Generated Summary</h3>
                  <div className="ai-summary">
                    {result.aiSummary}
                  </div>
                </div>
              )}

              {/* README Preview */}
              {result.readme && result.readme !== 'No README available' && (
                <div className="result-card full-width">
                  <h3>📝 README Preview</h3>
                  <div className="readme-preview">
                    <pre>{result.readme.substring(0, 1000)}{result.readme.length > 1000 ? '...' : ''}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AnalyzeRepo;