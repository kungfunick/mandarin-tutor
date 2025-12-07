import React, { useState, useRef, useEffect } from 'react';
import { Header } from './Header';
import { SettingsPanel } from './SettingsPanel';
import { HistoryPanel } from './HistoryPanel';
import { MessageBubble, LoadingIndicator } from './MessageBubble';
import { InputArea } from './InputArea';
import { CustomProviderModal } from './CustomProviderModal';
import { AdvancedSettings } from './AdvancedSettings';
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
import logger from '../utils/logger';

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Persistent settings using custom hook
  const [aiProvider, setAiProvider] = useLocalStorage('aiProvider', 'claude');
  const [claudeApiKey, setClaudeApiKey] = useLocalStorage('claudeApiKey', '');
  const [openaiApiKey, setOpenaiApiKey] = useLocalStorage('openaiApiKey', '');
  const [geminiApiKey, setGeminiApiKey] = useLocalStorage('geminiApiKey', '');
  const [customProviders, setCustomProviders] = useLocalStorage('customProviders', []);
  const [difficulty, setDifficulty] = useLocalStorage('difficulty', 'beginner');
  const [showTranslations, setShowTranslations] = useLocalStorage('showTranslations', true);
  const [showDebugUI, setShowDebugUI] = useLocalStorage('showDebugUI', true);
  const [correctionMode, setCorrectionMode] = useLocalStorage('correctionMode', false);
  const [theme, setTheme] = useLocalStorage('theme', 'standard');
  const [voiceGender, setVoiceGender] = useLocalStorage('voiceGender', 'female');
  const [conversationHistory, setConversationHistory] = useLocalStorage('conversationHistory', []);

  // Custom hooks for speech
  const {
    isListening,
    transcript,
    error: speechError,
    debugInfo: speechDebugInfo,
    startListening,
    stopListening,
    resetTranscript,
    adjustNoiseGate,
    adjustMinSpeechLevel
  } = useSpeechRecognition();

  const { speak } = useTextToSpeech();

  const messagesEndRef = useRef(null);

  // Initialize debug UI visibility on mount
  useEffect(() => {
    const debugElements = document.querySelectorAll('[data-debug-ui]');
    debugElements.forEach(el => {
      el.style.display = showDebugUI ? '' : 'none';
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input text when speech recognition gets result
  useEffect(() => {
    if (transcript) {
      console.log('📝 Setting transcript to input:', transcript);
      logger.info(`Transcript received: "${transcript}"`);
      setInputText(transcript);
      // Don't reset here - let it accumulate during the session
      // Only reset when user manually stops or sends the message
    }
  }, [transcript]);

  // Handle microphone toggle
  const handleToggleListening = () => {
    if (isListening) {
      console.log('🛑 User clicked to stop listening');
      logger.info('User stopped listening manually');
      stopListening();
      // Don't reset transcript here - let the user see what was captured
      // They can manually clear it or send it
    } else {
      console.log('🎤 User clicked to start listening');
      logger.info('User started listening');
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
      logger.info(`Updated custom provider: ${provider.label}`);
    } else {
      // Add new
      setCustomProviders([...customProviders, provider]);
      logger.info(`Added new custom provider: ${provider.label}`);
    }

    alert('Custom provider saved!');
  };

  // Delete custom provider
  const handleDeleteCustomProvider = (id) => {
    if (confirm('Delete this custom provider?')) {
      const provider = customProviders.find(p => p.id === id);
      setCustomProviders(customProviders.filter(p => p.id !== id));
      logger.info(`Deleted custom provider: ${provider?.label || id}`);

      // If currently selected provider is deleted, switch to Claude
      if (aiProvider === id) {
        setAiProvider('claude');
      }
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputText.trim()) {
      logger.warn('Attempted to send empty message');
      return;
    }

    const currentApiKey = getCurrentApiKey();
    const customProvider = getCustomProvider();

    // Check if we need an API key (custom providers might not need one)
    if (!currentApiKey && !customProvider) {
      logger.error(`No API key set for provider: ${aiProvider}`);
      alert(`Please set your ${aiProvider.toUpperCase()} API key in the settings (gear icon).`);
      setShowSettings(true);
      return;
    }

    const userMessage = {
      role: 'user',
      mandarin: inputText,
      timestamp: new Date()
    };

    logger.info(`User message: "${inputText}"`);
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    resetTranscript(); // Reset the speech recognition transcript
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.mandarin
      }));

      logger.info(`Calling AI API: ${aiProvider} (correction mode: ${correctionMode})`);
      let responseText;

      if (customProvider) {
        // Use custom provider
        logger.debug(`Using custom provider: ${customProvider.label}`);
        responseText = await callCustomAPI(customProvider, conversationHistory, inputText, difficulty, correctionMode);
      } else {
        // Use built-in provider
        switch (aiProvider) {
          case 'claude':
            logger.debug('Calling Claude API');
            responseText = await callClaudeAPI(currentApiKey, conversationHistory, inputText, difficulty, correctionMode);
            break;
          case 'openai':
            logger.debug('Calling OpenAI API');
            responseText = await callOpenAIAPI(currentApiKey, conversationHistory, inputText, difficulty, correctionMode);
            break;
          case 'gemini':
            logger.debug('Calling Gemini API');
            responseText = await callGeminiAPI(currentApiKey, conversationHistory, inputText, difficulty, correctionMode);
            break;
          default:
            throw new Error('Invalid AI provider');
        }
      }

      logger.debug(`Raw AI response: ${responseText}`);
      const parsedResponse = parseAIResponse(responseText);
      logger.info(`AI response: "${parsedResponse.mandarin}"`);

      const assistantMessage = {
        role: 'assistant',
        mandarin: parsedResponse.mandarin,
        pinyin: parsedResponse.pinyin,
        english: parsedResponse.english,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-play response
      setTimeout(() => {
        logger.debug('Playing TTS for AI response');
        speak(parsedResponse.mandarin, { gender: voiceGender });
      }, 300);

    } catch (error) {
      logger.error('AI API Error:', error.message, error.stack);
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
    logger.info(`Conversation saved: ${conversationTitle}`);
    alert('Conversation saved!');
  };

  // Load a saved conversation
  const loadConversation = (conversation) => {
    setMessages(conversation.messages);
    setDifficulty(conversation.difficulty);
    setAiProvider(conversation.provider);
    setShowHistory(false);
    logger.info(`Loaded conversation: ${conversation.title}`);
  };

  // Delete a conversation
  const deleteConversation = (id) => {
    if (confirm('Delete this conversation?')) {
      const updatedHistory = conversationHistory.filter(conv => conv.id !== id);
      setConversationHistory(updatedHistory);
      logger.info(`Deleted conversation: ${id}`);
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
      logger.info('Started new conversation');
    }
  };

  // Save settings manually
  const handleSaveSettings = () => {
    logger.info('Settings saved', {
      provider: aiProvider,
      difficulty,
      showTranslations,
      showDebugUI,
      correctionMode
    });
    alert('Settings saved successfully!');
    setShowSettings(false);
  };

  const currentProvider = getProviderInfo(aiProvider, customProviders);

  return (
    <div className={`flex flex-col h-screen ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-red-50 to-orange-50'
    }`}>
      <Header
        currentProvider={currentProvider}
        onSave={saveCurrentConversation}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onReset={resetConversation}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        showDebugButton={showDebugUI}
        theme={theme}
      />

      <AdvancedSettings
        show={showAdvanced}
        onClose={() => setShowAdvanced(false)}
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
        onAdjustNoiseGate={adjustNoiseGate}
        onAdjustMinSpeech={adjustMinSpeechLevel}
        showDebugUI={showDebugUI}
        setShowDebugUI={setShowDebugUI}
        correctionMode={correctionMode}
        setCorrectionMode={setCorrectionMode}
        theme={theme}
        setTheme={setTheme}
        voiceGender={voiceGender}
        setVoiceGender={setVoiceGender}
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
              correctionMode={correctionMode}
              voiceGender={voiceGender}
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
        theme={theme}
      />
    </div>
  );
};

export default MandarinTutor;
