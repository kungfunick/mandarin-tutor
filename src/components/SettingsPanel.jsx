import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus } from 'lucide-react';

export const SettingsPanel = ({
  show,
  aiProvider,
  setAiProvider,
  claudeApiKey,
  setClaudeApiKey,
  openaiApiKey,
  setOpenaiApiKey,
  geminiApiKey,
  setGeminiApiKey,
  difficulty,
  setDifficulty,
  showTranslations,
  setShowTranslations,
  currentProvider,
  onSaveSettings,
  customProviders,
  onOpenCustomProviders,
  onAdjustNoiseGate,
  onAdjustMinSpeech,
  showDebugUI,
  setShowDebugUI,
  correctionMode,
  setCorrectionMode,
  theme,
  setTheme,
  voiceGender,
  setVoiceGender
}) => {
  const { user, role, can, isAdmin, isTeacher, isStudent } = useAuth();
  const [noiseGate, setNoiseGate] = useState(15);
  const [minSpeech, setMinSpeech] = useState(25);

  if (!show) return null;

  const handleNoiseGateChange = (value) => {
    setNoiseGate(value);
    onAdjustNoiseGate(value);
  };

  const handleMinSpeechChange = (value) => {
    setMinSpeech(value);
    onAdjustMinSpeech(value);
  };

  const handleDebugUIToggle = (enabled) => {
    setShowDebugUI(enabled);

    // Toggle visibility of debug info panels
    const debugElements = document.querySelectorAll('[data-debug-ui]');
    debugElements.forEach(el => {
      el.style.display = enabled ? '' : 'none';
    });
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-4 max-h-[70vh] overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Settings</h3>
          <button
            onClick={onSaveSettings}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Save Settings
          </button>
        </div>
        {isAdmin() && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">AI Provider</h3>
            {
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    AI Provider
                  </label>
                  <button
                    onClick={onOpenCustomProviders}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add Custom Provider
                  </button>
                </div>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <optgroup label="Built-in Providers">
                    <option value="claude">Claude (Anthropic) - Best quality</option>
                    <option value="openai">ChatGPT (OpenAI) - GPT-4o</option>
                    <option value="gemini">Gemini (Google) - Free tier</option>
                  </optgroup>
                  {customProviders.length > 0 && (
                    <optgroup label="Custom Providers">
                      {customProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="font-medium text-blue-900">{currentProvider.name}</p>
                  <p className="text-blue-700">Model: {currentProvider.model}</p>
                  <p className="text-blue-700">Cost: {currentProvider.cost}</p>
                  {!currentProvider.isCustom && (
                    <p className="text-blue-600 text-xs mt-1">Get API key: {currentProvider.url}</p>
                  )}
                  {currentProvider.isCustom && (
                    <p className="text-blue-600 text-xs mt-1">Custom endpoint: {currentProvider.url}</p>
                  )}
                </div>
              </div>
            }
         </div>
        )}

        {aiProvider === 'claude' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claude API Key (saved locally)
            </label>
            {isAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {
                    <input
                      type="password"
                      value={claudeApiKey}
                      onChange={(e) => setClaudeApiKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  }
                </label>
              </div>
            )}
          </div>
        )}

        {aiProvider === 'openai' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key (saved locally)
            </label>
            {isAdmin() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {
                    <input
                      type="password"
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  }
                </label>
              </div>
            )}
          </div>
        )}

        {aiProvider === 'gemini' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key (saved locally)
            </label>
            {isAdmin() && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">AI Provider</h3>
                {
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                }
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Difficulty Level</h3>
          {
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="beginner">Beginner (初级)</option>
                <option value="intermediate">Intermediate (中级)</option>
                <option value="advanced">Advanced (高级)</option>
              </select>
            </div>
          }
        </div>

        <div className="space-y-2">
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

          {isAdmin() && (
            <div>
              {
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showDebug"
                    checked={showDebugUI}
                    onChange={(e) => handleDebugUIToggle(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="showDebug" className="text-sm text-gray-700">
                    Show debug UI panels (blue info boxes)
                  </label>
                </div>
              }
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="correctionMode"
              checked={correctionMode}
              onChange={(e) => setCorrectionMode(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="correctionMode" className="text-sm text-gray-700">
              Enable error correction highlighting
            </label>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="standard">Standard (Light Red/Orange)</option>
            <option value="dark">Dark Theme</option>
          </select>
        </div>

        {/* Voice Gender Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Gender (for Text-to-Speech)
          </label>
          <select
            value={voiceGender}
            onChange={(e) => setVoiceGender(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="female">Female Voice</option>
            <option value="male">Male Voice</option>
          </select>
          <p className="text-xs text-gray-600 mt-1">
            Preference for AI response voice. Actual voice depends on browser availability.
          </p>
        </div>

        {correctionMode && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="font-medium text-green-900 mb-1">✨ Correction Mode Active</p>
            <p className="text-green-700 text-xs">
              The AI will highlight errors in your Chinese and provide gentle corrections in its responses.
              Corrections will appear with special formatting to help you learn.
            </p>
          </div>
        )}

        <div className="border-t border-yellow-300 pt-4 mt-4">
          <h4 className="font-medium text-gray-800 mb-3">🎤 Microphone Settings</h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Noise Gate: {noiseGate}/255
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={noiseGate}
                onChange={(e) => handleNoiseGateChange(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">
                Filters out background noise. Higher = less sensitive. Start at 15.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Speech Level: {minSpeech}/255
              </label>
              <input
                type="range"
                min="15"
                max="60"
                value={minSpeech}
                onChange={(e) => handleMinSpeechChange(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">
                Minimum volume to register as speech. Higher = need to speak louder.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
              <p className="font-medium mb-1">Microphone Tips:</p>
              <ul className="space-y-1">
                <li>• Speak 6-12 inches from mic</li>
                <li>• Watch console for "🗣️ SPEECH" markers</li>
                <li>• Adjust settings if mic is too sensitive or not picking up voice</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
