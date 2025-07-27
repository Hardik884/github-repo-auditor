const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const axios = require('axios');
const { summarizeRepo } = require('./openai');

const app = express();
const PORT = 5000;

// 🔐 Express JSON + Session Setup
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// 🔑 Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// 🧠 Serialize/Deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// 🔐 Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// 🧭 Routes
app.get('/', (req, res) => {
  res.send('🚀 Repo Auditor Backend with Google OAuth is running!');
});

// 🌐 Start OAuth flow
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ✅ OAuth callback
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.send(`✅ Logged in as ${req.user.displayName}`);
  }
);

// 🚪 Logout route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// ✅ Middleware to protect routes (optional for now)
const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized. Please login with Google.' });
};

// 📦 Main API Route — GitHub Repo Fetcher
app.post('/api/repo', /* ensureAuth, */ async (req, res) => {
  try {
    const { repoUrl } = req.body;

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }

    const owner = match[1];
    const repo = match[2];

    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const langResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`);
    const readmeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { Accept: 'application/vnd.github.v3.raw' }
    });

    const summary = await summarizeRepo(readmeResponse.data);

    res.json({
      repo: repoResponse.data,
      languages: langResponse.data,
      readme: readmeResponse.data,
      summary: summary
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
// Route to return logged-in user details
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: {
        name: req.user.displayName,
        email: req.user.emails[0].value,
        picture: req.user.photos[0].value
      }
    });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});
// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
