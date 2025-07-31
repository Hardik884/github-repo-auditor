import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

/**
 * Login Component - Handles user authentication
 * 
 * Features:
 * - Checks if user is already logged in
 * - Provides Google OAuth login button
 * - Redirects to dashboard if already authenticated
 */
const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/user', {
          method: 'GET',
          credentials: 'include', // Include cookies for session
        });

        if (response.ok) {
          // User is already logged in, redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.log('User not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  /**
   * Initiates Google OAuth flow
   * Opens Google login in same window (better UX than popup)
   */
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading">Checking authentication...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔍 GitHub Repo Auditor</h1>
          <p>Analyze any GitHub repository with AI-powered insights</p>
        </div>
        
        <div className="login-content">
          <h2>Welcome!</h2>
          <p>Sign in with Google to start analyzing GitHub repositories</p>
          
          <button 
            onClick={handleGoogleLogin}
            className="google-login-btn"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
        
        <div className="login-footer">
          <p>🔐 Secure authentication • 🚀 Fast analysis • 🧠 AI-powered summaries</p>
        </div>
      </div>
    </div>
  );
};

export default Login;