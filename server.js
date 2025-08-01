import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();  // load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const apiKey = process.env.CSE_API_KEY;
  const cx = process.env.CSE_CX;

  if (!apiKey || !cx) {
    return res.status(500).json({ error: 'Missing API key or CSE ID' });
  }

  const googleUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;

  try {
    const response = await fetch(googleUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Google API error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from Google API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use(express.static('public')); // serve your frontend static files from /public

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
