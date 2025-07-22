// routes/repo.js

const express = require('express');
const router = express.Router();
const { summarizeRepo } = require('../openai');

router.post('/repo', async (req, res) => {
  try {
    const { readme } = req.body;

    if (!readme) {
      return res.status(400).json({ error: 'README content is required' });
    }

    const summary = await summarizeRepo(readme);
    res.json({ summary });

  } catch (error) {
    console.error('Error in /api/repo:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
