import fetch from 'node-fetch';

export default async function handler(req, res) {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });

  const apiKey = process.env.CSE_API_KEY;
  const cx = process.env.CSE_CX;

  if (!apiKey || !cx) return res.status(500).json({ error: 'Missing API key or CSE ID' });

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: 'Google API error' });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
