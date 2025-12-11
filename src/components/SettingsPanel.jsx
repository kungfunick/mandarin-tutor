import React, { useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';

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

  const isBuiltInProvider = ['claude', 'openai', 'gemini'].includes(aiProvider);

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

        {/* API Key Status - Built-in providers use server-side keys */}
        {isBuiltInProvider && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900 flex items-center gap-2">
              <CheckCircle size={16} />
              API key configured on server
            </p>
            <p className="text-xs text-green-700 mt-1">
              No manual configuration required
            </p>
          </div>
        )}

        {/* Only show API key input for custom providers */}
        {!isBuiltInProvider && currentProvider.isCustom && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentProvider.name} API Key (saved locally)
            </label>
            <input
              type="password"
              value={claudeApiKey} // This should be dynamic based on provider
              onChange={(e) => setClaudeApiKey(e.target.value)}
              placeholder="Enter API key..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Rest of settings remain the same */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="beginner">Beginner (HSK 1-2)</option>
            <option value="intermediate">Intermediate (HSK 3-4)</option>
            <option value="advanced">Advanced (HSK 5-6)</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showTranslations}
              onChange={(e) => setShowTranslations(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Show English translations
            </span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={correctionMode}
              onChange={(e) => setCorrectionMode(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Correction Mode (highlight mistakes)
            </span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDebugUI}
              onChange={(e) => handleDebugUIToggle(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Show Debug UI
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Gender
          </label>
          <select
            value={voiceGender}
            onChange={(e) => setVoiceGender(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Noise Gate Threshold: {noiseGate}
          </label>
          <input
            type="range"
            min="5"
            max="30"
            value={noiseGate}
            onChange={(e) => handleNoiseGateChange(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-600 mt-1">
            Lower = picks up quieter sounds (may pick up background noise)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Speech Level: {minSpeech}
          </label>
          <input
            type="range"
            min="15"
            max="50"
            value={minSpeech}
            onChange={(e) => handleMinSpeechChange(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-600 mt-1">
            Minimum volume to be considered speech
          </p>
        </div>
      </div>
    </div>
  );
};