const express = require('express');
require('dotenv').config(); // Loads variables from .env
const axios = require('axios');           // Used to make HTTP requests
const app = express();
const PORT = 5000;

app.use(express.json());                  // Allows JSON data in requests

// GET route for testing
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// POST route to fetch GitHub repo data
app.post('/api/repo', async (req, res) => {
  try {
    const { repoUrl } = req.body;

    // Extract owner and repo name from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }

    const owner = match[1];
    const repo = match[2];

    // Fetch basic repo info
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    
    // Fetch languages used
    const langResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`);

    // Fetch README content
    const readmeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { Accept: 'application/vnd.github.v3.raw' }
    });

    res.json({
      repo: repoResponse.data,
      languages: langResponse.data,
      readme: readmeResponse.data
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
