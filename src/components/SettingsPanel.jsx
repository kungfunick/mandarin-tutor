import React, { useState } from 'react';
import { Plus, CheckCircle, Server, Cloud } from 'lucide-react';

export const SettingsPanel = ({
  show,
  aiProvider,
  setAiProvider,
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
            <optgroup label="Built-in Providers (Server-side API keys)">
              <option value="claude">Claude (Anthropic) - Best quality</option>
              <option value="openai">ChatGPT (OpenAI) - GPT-4o</option>
              <option value="gemini">Gemini (Google) - Free tier</option>
            </optgroup>
            {customProviders.length > 0 && (
              <optgroup label="Custom Providers (Client-side API keys)">
                {customProviders.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          
          {/* Provider Info Box */}
          <div className={`mt-2 p-3 rounded-lg text-sm ${
            isBuiltInProvider 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {isBuiltInProvider ? (
                <Server size={16} className="text-green-600" />
              ) : (
                <Cloud size={16} className="text-blue-600" />
              )}
              <p className={`font-medium ${isBuiltInProvider ? 'text-green-900' : 'text-blue-900'}`}>
                {currentProvider.name}
              </p>
            </div>
            <p className={isBuiltInProvider ? 'text-green-700' : 'text-blue-700'}>
              Model: {currentProvider.model}
            </p>
            {isBuiltInProvider ? (
              <>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-green-200">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-green-800 font-medium">API key configured on server</span>
                </div>
                <p className="text-green-600 text-xs mt-1">
                  No manual configuration required - ready to use!
                </p>
              </>
            ) : (
              <p className="text-blue-600 text-xs mt-1">
                Custom endpoint: {currentProvider.url}
              </p>
            )}
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
            <option value="standard">Standard (Light)</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>

        {/* Difficulty Level */}
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

        {/* Toggle Options */}
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showTranslations}
              onChange={(e) => setShowTranslations(e.target.checked)}
              className="w-4 h-4 rounded text-red-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Show English translations
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={correctionMode}
              onChange={(e) => setCorrectionMode(e.target.checked)}
              className="w-4 h-4 rounded text-red-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Correction Mode (highlight mistakes)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDebugUI}
              onChange={(e) => handleDebugUIToggle(e.target.checked)}
              className="w-4 h-4 rounded text-red-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Show Debug UI
            </span>
          </label>
        </div>

        {/* Voice Settings */}
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

        {/* Microphone Settings */}
        <div className="pt-4 border-t border-yellow-300">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Microphone Settings</h4>
          
          <div className="space-y-4">
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
      </div>
    </div>
  );
};