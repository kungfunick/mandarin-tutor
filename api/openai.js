/**
 * Vercel Serverless Function - OpenAI API Proxy
 * Proxies requests to OpenAI's API using server-side API key
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, systemPrompt } = req.body;

    // Get API key from environment variable (server-side only)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OPENAI_API_KEY not set in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'OpenAI API key not configured on server'
      });
    }

    console.log('Proxying request to OpenAI API...');

    // Build messages with system prompt
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: fullMessages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('OpenAI API request successful');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}