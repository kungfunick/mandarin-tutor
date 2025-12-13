import React, { useState, useRef, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { StudyGuidePanel } from './StudyGuidePanel';
import { TeacherDashboard } from './TeacherDashboard';
import { AdminPanel } from './AdminPanel';
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

  // Add auth
  const { user, profile, role, isAdmin, isTeacher, isStudent } = useAuth();

  // Add study guide state
  const [showStudyGuide, setShowStudyGuide] = useState(false);
  const [showTeacherDashboard, setShowTeacherDashboard] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // User preferences (these can stay in localStorage as they're non-sensitive)
  const [aiProvider, setAiProvider] = useLocalStorage('aiProvider', 'claude');
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
    }
  }, [transcript]);

  // Handle microphone toggle
  const handleToggleListening = () => {
    if (isListening) {
      console.log('🛑 User clicked to stop listening');
      logger.info('User stopped listening manually');
      stopListening();
    } else {
      console.log('🎤 User clicked to start listening');
      logger.info('User started listening');
      startListening();
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
      const updated = [...customProviders];
      updated[existingIndex] = provider;
      setCustomProviders(updated);
      logger.info(`Updated custom provider: ${provider.label}`);
    } else {
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

    const customProvider = getCustomProvider();

    // Custom providers might need their own API key
    if (customProvider && !customProvider.apiKey) {
      logger.error(`No API key set for custom provider: ${customProvider.label}`);
      alert(`Please set the API key for ${customProvider.label} in custom providers settings.`);
      setShowCustomProviders(true);
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
    resetTranscript();
    setIsLoading(true);

    try {
      const msgHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.mandarin
      }));

      logger.info(`Calling AI API: ${aiProvider} (correction mode: ${correctionMode})`);
      let responseText;

      if (customProvider) {
        // Use custom provider with its own API key
        logger.debug(`Using custom provider: ${customProvider.label}`);
        responseText = await callCustomAPI(customProvider, msgHistory, inputText, difficulty, correctionMode);
      } else {
        // Use built-in provider - server handles the API key
        switch (aiProvider) {
          case 'claude':
            logger.debug('Calling Claude API (server-side key)');
            responseText = await callClaudeAPI(null, msgHistory, inputText, difficulty, correctionMode);
            break;
          case 'openai':
            logger.debug('Calling OpenAI API (server-side key)');
            responseText = await callOpenAIAPI(null, msgHistory, inputText, difficulty, correctionMode);
            break;
          case 'gemini':
            logger.debug('Calling Gemini API (server-side key)');
            responseText = await callGeminiAPI(null, msgHistory, inputText, difficulty, correctionMode);
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
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.message.includes('API key not configured')) {
        errorMessage = 'The AI service is not configured on the server. Please contact the administrator.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Authentication failed. The server API key may be invalid.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      alert(`Error: ${errorMessage}`);
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
        onToggleStudyGuide={() => setShowStudyGuide(!showStudyGuide)}
        onToggleTeacherDashboard={() => setShowTeacherDashboard(!showTeacherDashboard)}
        onToggleAdminPanel={() => setShowAdminPanel(!showAdminPanel)}
        showDebugButton={true}
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

      {/* Study Guide Panel */}
      {showStudyGuide && profile?.role === 'student' && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-hidden">
          <StudyGuidePanel conversationHistory={conversationHistory} onClose={() => setShowStudyGuide(false)} />
        </div>
      )}

      {/* Teacher Dashboard */}
      {showTeacherDashboard && profile?.role === 'teacher' && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-hidden">
          <TeacherDashboard onClose={() => setShowTeacherDashboard(false)} />
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && profile?.role === 'admin' && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-hidden">
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        </div>
      )}

      <SettingsPanel
        show={showSettings}
        aiProvider={aiProvider}
        setAiProvider={setAiProvider}
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