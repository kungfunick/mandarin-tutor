import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, MessageSquare, HelpCircle, RotateCcw, Settings, Zap } from 'lucide-react';

const MandarinTutor = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      mandarin: '你好！我是你的中文老师。',
      pinyin: 'Nǐ hǎo! Wǒ shì nǐ de zhōngwén lǎoshī.',
      english: "Hello! I'm your Chinese teacher.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // API Settings
  const [aiProvider, setAiProvider] = useState('claude');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const [showTranslations, setShowTranslations] = useState(true);
  const [difficulty, setDifficulty] = useState('beginner');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;

      const voices = speechSynthesis.getVoices();
      const chineseVoice = voices.find(voice => voice.lang.startsWith('zh'));
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }

      speechSynthesis.speak(utterance);
    }
  };

  const callClaudeAPI = async (conversationHistory, userInput) => {
    if (!claudeApiKey) {
      throw new Error('Claude API key not set');
    }

    const systemPrompt = `You are a Mandarin Chinese language tutor helping an English speaker practice conversation.

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
- Be encouraging and helpful
- If user makes mistakes, gently correct them in your next response

Return ONLY the JSON object, no other text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...conversationHistory,
          { role: 'user', content: userInput }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  };

  const callOpenAIAPI = async (conversationHistory, userInput) => {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not set');
    }

    const systemPrompt = `You are a Mandarin Chinese language tutor helping an English speaker practice conversation at ${difficulty} level.

Respond in JSON format:
{
  "mandarin": "你的中文回答",
  "pinyin": "Nǐ de zhōngwén huídá",
  "english": "Your English translation"
}

Keep responses conversational (2-3 sentences), use ${difficulty} vocabulary, and provide accurate pinyin with tone marks.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userInput }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
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
  };

  const callGeminiAPI = async (conversationHistory, userInput) => {
    if (!geminiApiKey) {
      throw new Error('Gemini API key not set');
    }

    const systemPrompt = `You are a Mandarin Chinese language tutor helping an English speaker practice conversation at ${difficulty} level.

Respond in JSON format:
{
  "mandarin": "你的中文回答",
  "pinyin": "Nǐ de zhōngwén huídá",
  "english": "Your English translation"
}

Keep responses conversational (2-3 sentences), use ${difficulty} vocabulary, and provide accurate pinyin with tone marks.`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: userInput }] }
    ];


    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const currentApiKey = aiProvider === 'claude' ? claudeApiKey :
                          aiProvider === 'openai' ? openaiApiKey : geminiApiKey;

    if (!currentApiKey) {
      alert(`Please set your ${aiProvider.toUpperCase()} API key in the settings (gear icon).`);
      setShowSettings(true);
      return;
    }

    const userMessage = {
      role: 'user',
      mandarin: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.mandarin
      }));

      let responseText;

      if (aiProvider === 'claude') {
        responseText = await callClaudeAPI(conversationHistory, inputText);
      } else if (aiProvider === 'openai') {
        responseText = await callOpenAIAPI(conversationHistory, inputText);
      } else if (aiProvider === 'gemini') {
        responseText = await callGeminiAPI(conversationHistory, inputText);
      }

      let parsedResponse;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(responseText);
        }
      } catch (e) {
        console.error('JSON parse error:', e);
        parsedResponse = {
          mandarin: responseText,
          pinyin: '(pinyin not available)',
          english: '(translation not available)'
        };
      }

      const assistantMessage = {
        role: 'assistant',
        mandarin: parsedResponse.mandarin,
        pinyin: parsedResponse.pinyin,
        english: parsedResponse.english,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setTimeout(() => speakText(parsedResponse.mandarin), 300);

    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}\n\nCheck your API key and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    if (confirm('Start a new conversation?')) {
      setMessages([
        {
          role: 'assistant',
          mandarin: '你好！我是你的中文老师。',
          pinyin: 'Nǐ hǎo! Wǒ shì nǐ de zhōngwén lǎoshī.',
          english: "Hello! I'm your Chinese teacher.",
          timestamp: new Date()
        }
      ]);
    }
  };

  const getProviderInfo = (provider) => {
    const info = {
      claude: {
        name: 'Claude (Anthropic)',
        model: 'Sonnet 4',
        cost: '$0.01-0.05/conversation',
        url: 'console.anthropic.com'
      },
      openai: {
        name: 'ChatGPT (OpenAI)',
        model: 'GPT-4o',
        cost: '$0.02-0.08/conversation',
        url: 'platform.openai.com'
      },
      gemini: {
        name: 'Gemini (Google)',
        model: 'Gemini Pro',
        cost: 'Free tier available',
        url: 'makersuite.google.com'
      }
    };
    return info[provider];
  };

  const currentProvider = getProviderInfo(aiProvider);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-red-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-red-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">中文对话 Mandarin Tutor</h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Zap size={14} />
                Powered by {currentProvider.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetConversation}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <RotateCcw size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4 max-h-96 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="claude">Claude (Anthropic) - Best quality</option>
                <option value="openai">ChatGPT (OpenAI) - GPT-4o</option>
                <option value="gemini">Gemini (Google) - Free tier</option>
              </select>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-medium text-blue-900">{currentProvider.name}</p>
                <p className="text-blue-700">Model: {currentProvider.model}</p>
                <p className="text-blue-700">Cost: {currentProvider.cost}</p>
                <p className="text-blue-600 text-xs mt-1">Get API key: {currentProvider.url}</p>
              </div>
            </div>

            {aiProvider === 'claude' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Claude API Key
                </label>
                <input
                  type="password"
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            )}

            {aiProvider === 'openai' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            )}

            {aiProvider === 'gemini' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="beginner">Beginner (初级)</option>
                <option value="intermediate">Intermediate (中级)</option>
                <option value="advanced">Advanced (高级)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showTrans"
                checked={showTranslations}
                onChange={(e) => setShowTranslations(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showTrans" className="text-sm text-gray-700">
                Show pinyin and English translations
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-xl font-medium mb-1">{msg.mandarin}</p>
                    {showTranslations && msg.pinyin && (
                      <p className={`text-sm italic mb-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-600'}`}>
                        {msg.pinyin}
                      </p>
                    )}
                    {showTranslations && msg.english && (
                      <p className={`text-sm ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.english}
                      </p>
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => speakText(msg.mandarin)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      title="Play audio"
                    >
                      <Volume2 size={18} className="text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="输入中文... (Type in Chinese or use microphone)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isLoading}
              title={isListening ? 'Stop recording' : 'Start recording'}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              发送
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <HelpCircle size={14} />
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MandarinTutor;