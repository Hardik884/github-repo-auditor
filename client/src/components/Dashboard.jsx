import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Dashboard.css';

/**
 * Dashboard Component - Main user interface after login
 * 
 * Features:
 * - Displays user information
 * - Navigation to repository analysis
 * - Logout functionality
 * - Authentication check
 */
function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  /**
   * Check authentication and fetch user data on component mount
   */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/user", {
          method: "GET",
          credentials: "include", // Include session cookies
        });

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Please log in to continue");
        navigate("/"); // Redirect to login
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  /**
   * Handle user logout
   * Calls backend logout endpoint and redirects to login
   */
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to login
      navigate("/");
    }
  };

  /**
   * Navigate to repository analysis page
   */
  const handleAnalyzeRepo = () => {
    navigate("/analyze");
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔍 GitHub Repo Auditor</h1>
          <div className="user-info">
            {user?.picture && (
              <img 
                src={user.picture} 
                alt="Profile" 
                className="profile-picture"
              />
            )}
            <span className="user-name">{user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
          <p>Ready to analyze some GitHub repositories?</p>
        </div>

        <div className="action-cards">
          <div className="action-card primary" onClick={handleAnalyzeRepo}>
            <div className="card-icon">🔍</div>
            <h3>Analyze Repository</h3>
            <p>Enter any GitHub repository URL to get detailed insights and AI-powered summaries</p>
            <button className="card-button">Start Analysis</button>
          </div>

          <div className="action-card">
            <div className="card-icon">📊</div>
            <h3>Recent Analyses</h3>
            <p>View your previously analyzed repositories (Coming Soon)</p>
            <button className="card-button disabled" disabled>Coming Soon</button>
          </div>

          <div className="action-card">
            <div className="card-icon">⭐</div>
            <h3>Favorites</h3>
            <p>Save and organize your favorite repositories (Coming Soon)</p>
            <button className="card-button disabled" disabled>Coming Soon</button>
          </div>
        </div>

        <div className="stats-section">
          <h3>How it works</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">1</div>
              <div className="stat-label">Enter GitHub URL</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2</div>
              <div className="stat-label">Fetch Repository Data</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">AI Analysis</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">4</div>
              <div className="stat-label">Get Insights</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;