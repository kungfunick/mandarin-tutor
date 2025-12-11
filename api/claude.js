/**
 * Vercel Serverless Function - Claude API Proxy
 * Proxies requests to Anthropic's API using server-side API key
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
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      console.error('CLAUDE_API_KEY not set in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'API key not configured on server. Please contact the administrator.'
      });
    }

    console.log('Proxying request to Claude API...');
    console.log('Messages count:', messages?.length);
    console.log('System prompt length:', systemPrompt?.length);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API Error:', response.status, data);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to get response from AI';
      if (response.status === 401) {
        userMessage = 'Invalid API key. Please contact the administrator.';
      } else if (response.status === 429) {
        userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status === 500) {
        userMessage = 'AI service temporarily unavailable. Please try again later.';
      } else if (data.error?.message) {
        userMessage = data.error.message;
      }
      
      return res.status(response.status).json({
        error: data.error || 'API Error',
        message: userMessage
      });
    }

    console.log('Claude API request successful');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to connect to AI service. Please try again.'
    });
  }
}