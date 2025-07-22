// openai.js

const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function summarizeRepo(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes GitHub repos clearly.',
        },
        {
          role: 'user',
          content: `Summarize this repository content:\n${text}`,
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error('OpenAI error:', err);
    return 'Could not generate summary.';
  }
}

module.exports = { summarizeRepo };
