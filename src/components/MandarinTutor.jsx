import React, { useState, useRef, useEffect } from 'react';
import { Header } from './Header';
import { SettingsPanel } from './SettingsPanel';
import { HistoryPanel } from './HistoryPanel';
import { MessageBubble, LoadingIndicator } from './MessageBubble';
import { InputArea } from './InputArea';
import { CustomProviderModal } from './CustomProviderModal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import {
  callClaudeAPI,
  callOpenAIAPI,
  callGeminiAPI,
  callCustomAPI,
  parseAIResponse,
  getProviderInfo
} from '../services/aiService';

const MandarinTutor = () => {
  // Message state
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
  const [isLoading, setIsLoading] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCustomProviders, setShowCustomProviders] = useState(false);

  // Persistent settings using custom hook
  const [aiProvider, setAiProvider] = useLocalStorage('aiProvider', 'claude');
  const [claudeApiKey, setClaudeApiKey] = useLocalStorage('claudeApiKey', '');
  const [openaiApiKey, setOpenaiApiKey] = useLocalStorage('openaiApiKey', '');
  const [geminiApiKey, setGeminiApiKey] = useLocalStorage('geminiApiKey', '');
  const [customProviders, setCustomProviders] = useLocalStorage('customProviders', []);
  const [difficulty, setDifficulty] = useLocalStorage('difficulty', 'beginner');
  const [showTranslations, setShowTranslations] = useLocalStorage('showTranslations', true);
  const [conversationHistory, setConversationHistory] = useLocalStorage('conversationHistory', []);

  // Custom hooks for speech
  const {
    isListening,
    transcript,
    error: speechError,
    debugInfo: speechDebugInfo,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  const { speak } = useTextToSpeech();

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input text when speech recognition gets result
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Handle microphone toggle
  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Get current API key based on provider
  const getCurrentApiKey = () => {
    switch (aiProvider) {
      case 'claude': return claudeApiKey;
      case 'openai': return openaiApiKey;
      case 'gemini': return geminiApiKey;
      default: {
        // Check if it's a custom provider
        const customProvider = customProviders.find(p => p.id === aiProvider);
        return customProvider?.apiKey || '';
      }
    }
  };

  // Get custom provider config
  const getCustomProvider = () => {
    return customProviders.find(p => p.id === aiProvider);
  };

  // Save custom provider
  const handleSaveCustomProvider = (provider) => {
    const existingIndex = customProviders.findIndex(p => p.id === provider.id);

    if (existingIndex >= 0) {
      // Update existing
      const updated = [...customProviders];
      updated[existingIndex] = provider;
      setCustomProviders(updated);
    } else {
      // Add new
      setCustomProviders([...customProviders, provider]);
    }

    alert('Custom provider saved!');
  };

  // Delete custom provider
  const handleDeleteCustomProvider = (id) => {
    if (confirm('Delete this custom provider?')) {
      setCustomProviders(customProviders.filter(p => p.id !== id));

      // If currently selected provider is deleted, switch to Claude
      if (aiProvider === id) {
        setAiProvider('claude');
      }
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const currentApiKey = getCurrentApiKey();
    const customProvider = getCustomProvider();

    // Check if we need an API key (custom providers might not need one)
    if (!currentApiKey && !customProvider) {
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

      if (customProvider) {
        // Use custom provider
        responseText = await callCustomAPI(customProvider, conversationHistory, inputText, difficulty);
      } else {
        // Use built-in provider
        switch (aiProvider) {
          case 'claude':
            responseText = await callClaudeAPI(currentApiKey, conversationHistory, inputText, difficulty);
            break;
          case 'openai':
            responseText = await callOpenAIAPI(currentApiKey, conversationHistory, inputText, difficulty);
            break;
          case 'gemini':
            responseText = await callGeminiAPI(currentApiKey, conversationHistory, inputText, difficulty);
            break;
          default:
            throw new Error('Invalid AI provider');
        }
      }

      const parsedResponse = parseAIResponse(responseText);

      const assistantMessage = {
        role: 'assistant',
        mandarin: parsedResponse.mandarin,
        pinyin: parsedResponse.pinyin,
        english: parsedResponse.english,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-play response
      setTimeout(() => speak(parsedResponse.mandarin), 300);

    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}\n\nCheck your API key and configuration, then try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save current conversation
  const saveCurrentConversation = () => {
    if (messages.length <= 1) {
      alert('No conversation to save yet!');
      return;
    }

    const conversationTitle = `Conversation ${new Date().toLocaleString()}`;
    const newConversation = {
      id: Date.now(),
      title: conversationTitle,
      messages: messages,
      difficulty: difficulty,
      provider: aiProvider,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [newConversation, ...conversationHistory];
    setConversationHistory(updatedHistory);
    alert('Conversation saved!');
  };

  // Load a saved conversation
  const loadConversation = (conversation) => {
    setMessages(conversation.messages);
    setDifficulty(conversation.difficulty);
    setAiProvider(conversation.provider);
    setShowHistory(false);
  };

  // Delete a conversation
  const deleteConversation = (id) => {
    if (confirm('Delete this conversation?')) {
      const updatedHistory = conversationHistory.filter(conv => conv.id !== id);
      setConversationHistory(updatedHistory);
    }
  };

  // Reset to new conversation
  const resetConversation = () => {
    if (confirm('Start a new conversation? (Current conversation will not be saved)')) {
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

  // Save settings manually
  const handleSaveSettings = () => {
    alert('Settings saved successfully!');
    setShowSettings(false);
  };

  const currentProvider = getProviderInfo(aiProvider, customProviders);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <Header
        currentProvider={currentProvider}
        onSave={saveCurrentConversation}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onReset={resetConversation}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      <HistoryPanel
        show={showHistory}
        conversations={conversationHistory}
        onLoadConversation={loadConversation}
        onDeleteConversation={deleteConversation}
      />

      <SettingsPanel
        show={showSettings}
        aiProvider={aiProvider}
        setAiProvider={setAiProvider}
        claudeApiKey={claudeApiKey}
        setClaudeApiKey={setClaudeApiKey}
        openaiApiKey={openaiApiKey}
        setOpenaiApiKey={setOpenaiApiKey}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        showTranslations={showTranslations}
        setShowTranslations={setShowTranslations}
        currentProvider={currentProvider}
        onSaveSettings={handleSaveSettings}
        customProviders={customProviders}
        onOpenCustomProviders={() => setShowCustomProviders(true)}
      />

      <CustomProviderModal
        show={showCustomProviders}
        onClose={() => setShowCustomProviders(false)}
        customProviders={customProviders}
        onSaveProvider={handleSaveCustomProvider}
        onDeleteProvider={handleDeleteCustomProvider}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              showTranslations={showTranslations}
              onSpeak={speak}
            />
          ))}

          {isLoading && <LoadingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <InputArea
        inputText={inputText}
        setInputText={setInputText}
        isListening={isListening}
        isLoading={isLoading}
        onToggleListening={handleToggleListening}
        onSendMessage={sendMessage}
        speechError={speechError}
        speechDebugInfo={speechDebugInfo}
      />
    </div>
  );
};

export default MandarinTutor;