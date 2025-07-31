const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const { summarizeRepo } = require('./openai');

const app = express();
const PORT = process.env.PORT || 5000;

// 🌐 CORS Configuration - Allows frontend to communicate with backend
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true // Allow cookies to be sent with requests
}));

// 🔐 Express JSON + Session Setup
app.use(express.json()); // Parse JSON request bodies
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // Use environment variable
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 🔑 Passport initialization - Must come after session middleware
app.use(passport.initialize());
app.use(passport.session());

// 🧠 Serialize/Deserialize user - How passport stores user in session
passport.serializeUser((user, done) => {
  // Store only user ID in session (more secure)
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  // Retrieve full user object from stored ID
  done(null, obj);
});

// 🔐 Google OAuth Strategy Configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  // This function runs when Google sends back user data
  // In a real app, you'd save user to database here
  const user = {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    picture: profile.photos[0].value,
    accessToken // Store for potential GitHub API calls
  };
  return done(null, user);
}));

// 🧭 Basic Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 GitHub Repo Auditor Backend is running!',
    authenticated: req.isAuthenticated()
  });
});

// 🌐 Start OAuth flow - Redirects user to Google
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] // What data we want from Google
  })
);

// ✅ OAuth callback - Google redirects here after user approves
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173' }),
  (req, res) => {
    // Successful authentication, redirect to frontend dashboard
    res.redirect('http://localhost:5173/dashboard');
  }
);

// 🚪 Logout route - Destroys session
app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// ✅ Middleware to protect routes
const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is logged in, continue
  }
  res.status(401).json({ error: 'Unauthorized. Please login with Google.' });
};

// 👤 Get current user info
app.get('/api/user', ensureAuth, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    picture: req.user.picture
  });
});

// 📦 Fetch user's GitHub repositories (if they connected GitHub)
app.get('/api/repos', ensureAuth, async (req, res) => {
  try {
    // This is a placeholder - in real app, user would connect GitHub account
    // For now, we'll return empty array or mock data
    res.json([]);
  } catch (error) {
    console.error('Error fetching repos:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// 📦 Main API Route — Analyze any GitHub repository by URL
app.post('/api/analyze-repo', ensureAuth, async (req, res) => {
  try {
    const { repoUrl } = req.body;

    // Validate input
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    // Extract owner and repo name from GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub URL format' });
    }

    const owner = match[1];
    const repo = match[2].replace('.git', ''); // Remove .git if present

    console.log(`🔍 Analyzing repository: ${owner}/${repo}`);

    // Fetch repository metadata from GitHub API
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'User-Agent': 'GitHub-Repo-Auditor',
        // Add GitHub token if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        })
      }
    });

    // Fetch programming languages used
    const langResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: {
        'User-Agent': 'GitHub-Repo-Auditor',
        ...(process.env.GITHUB_TOKEN && {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        })
      }
    });

    // Fetch README content
    let readmeContent = '';
    let summary = '';
    
    try {
      const readmeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: { 
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'GitHub-Repo-Auditor',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        }
      });
      
      readmeContent = readmeResponse.data;
      
      // Generate AI summary if README exists and OpenAI is configured
      if (readmeContent && process.env.OPENAI_API_KEY) {
        console.log('🧠 Generating AI summary...');
        summary = await summarizeRepo(readmeContent);
      }
    } catch (readmeError) {
      console.log('📝 No README found or error fetching README');
      readmeContent = 'No README available';
      summary = 'No README available for analysis';
    }

    // Structure the response data
    const analysisResult = {
      repository: {
        name: repoResponse.data.name,
        fullName: repoResponse.data.full_name,
        description: repoResponse.data.description,
        url: repoResponse.data.html_url,
        stars: repoResponse.data.stargazers_count,
        forks: repoResponse.data.forks_count,
        watchers: repoResponse.data.watchers_count,
        issues: repoResponse.data.open_issues_count,
        createdAt: repoResponse.data.created_at,
        updatedAt: repoResponse.data.updated_at,
        defaultBranch: repoResponse.data.default_branch,
        size: repoResponse.data.size,
        license: repoResponse.data.license?.name || 'No license'
      },
      languages: langResponse.data,
      readme: readmeContent,
      aiSummary: summary,
      analyzedAt: new Date().toISOString()
    };

    console.log('✅ Repository analysis completed');
    res.json(analysisResult);

  } catch (error) {
    console.error('❌ Error analyzing repository:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Repository not found or is private' });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ error: 'GitHub API rate limit exceeded. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Failed to analyze repository' });
  }
});

// 🚀 Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🔐 Google OAuth configured: ${!!process.env.GOOGLE_CLIENT_ID}`);
  console.log(`🧠 OpenAI configured: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`🐙 GitHub token configured: ${!!process.env.GITHUB_TOKEN}`);
});