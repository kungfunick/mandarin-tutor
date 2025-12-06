import React from 'react';
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
  onOpenCustomProviders
}) => {
  if (!show) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 p-4 max-h-96 overflow-y-auto">
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

        {aiProvider === 'claude' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claude API Key (saved locally)
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
              OpenAI API Key (saved locally)
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
              Gemini API Key (saved locally)
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
  );
};