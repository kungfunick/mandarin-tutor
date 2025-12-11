/**
 * AI Service - Handles communication with different AI providers
 * Enhanced with correction mode support
 */

const createSystemPrompt = (difficulty, correctionMode = false) => {
  const basePrompt = `You are a Mandarin Chinese language tutor helping an English speaker practice conversation.

Difficulty level: ${difficulty}

CRITICAL: You must respond in VALID JSON format with this EXACT structure:
{
  "mandarin": "你的中文回答",
  "pinyin": "Nǐ de zhōngwén huídá",
  "english": "Your English translation"
}

Guidelines:
- Respond naturally in Mandarin at ${difficulty} level
- Keep responses conversational (2-3 sentences)
- Use vocabulary appropriate for ${difficulty} learners
- Provide accurate pinyin with tone marks (ā á ǎ à)
- Give natural English translations
- Be encouraging and helpful`;

  const correctionAddition = correctionMode ? `

CORRECTION MODE ACTIVE:
- Carefully analyze the user's Chinese for errors in grammar, word choice, or usage
- In your "mandarin" field, highlight corrections using these formats:
  * For errors: [error: 错误的词 → 正确的词]
  * For good usage: [correct: 正确的用法]
  * For suggestions: <correction>建议的说法</correction>
- Keep corrections gentle and encouraging
- Explain why in your response naturally
- Examples:
  * "你说的 [error: 我很喜欢吃 → 我很喜欢] 苹果。'吃' is not needed here!"
  * "Great! [correct: 我昨天去了] is perfect past tense usage."
- Don't overdo it - only highlight 1-2 corrections per response
- Always be supportive and positive` : '';

  return basePrompt + correctionAddition + '\n\nReturn ONLY the JSON object, no other text.';
};

/**
 * Call Claude API (via proxy in development, direct in production)
 */
export const callClaudeAPI = async (apiKey, conversationHistory, userInput, difficulty, correctionMode = false) => {
  if (!apiKey) throw new Error('Claude API key not set');

  const systemPrompt = createSystemPrompt(difficulty, correctionMode);
  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userInput }
  ];

  // Use proxy server in development to avoid CORS issues
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    // Development mode: use proxy server
    console.log('🔄 Using proxy server:', proxyUrl);
    const response = await fetch(`${proxyUrl}/api/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey,
        messages,
        systemPrompt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } else {
    // Production mode: use Vercel serverless function
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey,
        messages,
        systemPrompt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
};

/**
 * Call OpenAI API (via proxy in development)
 */
export const callOpenAIAPI = async (apiKey, conversationHistory, userInput, difficulty, correctionMode = false) => {
  if (!apiKey) throw new Error('OpenAI API key not set');

  const systemPrompt = createSystemPrompt(difficulty, correctionMode);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userInput }
  ];

  // Use proxy server in development to avoid CORS issues
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    console.log('🔄 Using proxy server for OpenAI');
    const response = await fetch(`${proxyUrl}/api/openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        messages,
        systemPrompt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } else {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};

/**
 * Call Gemini API (via proxy in development)
 */
export const callGeminiAPI = async (apiKey, conversationHistory, userInput, difficulty, correctionMode = false) => {
  if (!apiKey) throw new Error('Gemini API key not set');

  const systemPrompt = createSystemPrompt(difficulty, correctionMode);
  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userInput }
  ];

  // Use proxy server in development
  const proxyUrl = import.meta.env.VITE_API_PROXY_URL;

  if (proxyUrl) {
    console.log('🔄 Using proxy server for Gemini');
    const response = await fetch(`${proxyUrl}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        messages,
        systemPrompt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } else {
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: userInput }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
};

/**
 * Parse AI response to extract JSON
 */
export const parseAIResponse = (responseText) => {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (e) {
    console.error('JSON parse error:', e);
    return {
      mandarin: responseText,
      pinyin: '(pinyin not available)',
      english: '(translation not available)'
    };
  }
};

/**
 * Call custom API provider
 */
export const callCustomAPI = async (provider, conversationHistory, userInput, difficulty, correctionMode = false) => {
  if (!provider.apiUrl) throw new Error('Custom provider API URL not set');

  const systemPrompt = createSystemPrompt(difficulty, correctionMode);

  let requestBody;
  let headers = { 'Content-Type': 'application/json' };

  // Add auth header if API key exists
  if (provider.apiKey) {
    if (provider.requestFormat === 'anthropic') {
      headers['x-api-key'] = provider.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider.requestFormat === 'openai') {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }
    // For Gemini, API key goes in URL
  }

  // Build request based on format
  if (provider.requestFormat === 'anthropic') {
    requestBody = {
      model: provider.model || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userInput }
      ]
    };
  } else if (provider.requestFormat === 'gemini') {
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: userInput }] }
    ];

    requestBody = {
      contents: contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7
      }
    };
  } else {
    // OpenAI format (default) - works with Ollama, LM Studio, etc.
    requestBody = {
      model: provider.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userInput }
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: false  // Ensure streaming is disabled
    };
  }

  // Add API key to URL for Gemini
  let url = provider.apiUrl;
  if (provider.requestFormat === 'gemini' && provider.apiKey) {
    url += (url.includes('?') ? '&' : '?') + `key=${provider.apiKey}`;
  }

  console.log('Custom API Request:', {
    url,
    format: provider.requestFormat,
    model: provider.model,
    correctionMode,
    requestBody
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Custom API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  console.log('Custom API Response:', data);

  // Parse response based on format
  try {
    if (provider.requestFormat === 'anthropic') {
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid Anthropic response format');
      }
      return data.content[0].text;
    } else if (provider.requestFormat === 'gemini') {
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid Gemini response format');
      }
      return data.candidates[0].content.parts[0].text;
    } else {
      // OpenAI format - handle both standard and Ollama responses
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else if (data.message && data.message.content) {
        // Some Ollama versions use this format
        return data.message.content;
      } else if (data.response) {
        // Ollama's generate endpoint format
        return data.response;
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Invalid OpenAI/Ollama response format. Response structure: ' + JSON.stringify(Object.keys(data)));
      }
    }
  } catch (parseError) {
    console.error('Error parsing custom API response:', parseError);
    console.error('Full response:', data);
    throw new Error(`Failed to parse API response: ${parseError.message}. Check console for details.`);
  }
};

/**
 * Get AI provider information
 */
export const getProviderInfo = (provider, customProviders = []) => {
  const builtInProviders = {
    claude: {
      name: 'Claude (Anthropic)',
      model: 'Sonnet 4',
      cost: '$0.01-0.05/conversation',
      url: 'console.anthropic.com',
      isCustom: false
    },
    openai: {
      name: 'ChatGPT (OpenAI)',
      model: 'GPT-4o',
      cost: '$0.02-0.08/conversation',
      url: 'platform.openai.com',
      isCustom: false
    },
    gemini: {
      name: 'Gemini (Google)',
      model: 'Gemini 2.0 Flash',
      cost: 'Free tier available',
      url: 'makersuite.google.com',
      isCustom: false
    }
  };

  // Check if it's a built-in provider
  if (builtInProviders[provider]) {
    return builtInProviders[provider];
  }

  // Check if it's a custom provider
  const customProvider = customProviders.find(p => p.id === provider);
  if (customProvider) {
    return {
      name: customProvider.label,
      model: customProvider.model || 'Custom Model',
      cost: 'Custom pricing',
      url: customProvider.apiUrl,
      isCustom: true
    };
  }

  return builtInProviders.claude;
};
