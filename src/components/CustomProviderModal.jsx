import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';

export const CustomProviderModal = ({
  show,
  onClose,
  customProviders,
  onSaveProvider,
  onDeleteProvider
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    apiUrl: '',
    apiKey: '',
    model: '',
    requestFormat: 'openai' // openai, anthropic, or custom
  });

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.label || !formData.apiUrl) {
      alert('Please fill in at least Label and API URL');
      return;
    }

    const provider = {
      id: editingId || `custom_${Date.now()}`,
      ...formData
    };

    onSaveProvider(provider);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      label: '',
      apiUrl: '',
      apiKey: '',
      model: '',
      requestFormat: 'openai'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (provider) => {
    setFormData({
      label: provider.label,
      apiUrl: provider.apiUrl,
      apiKey: provider.apiKey,
      model: provider.model || '',
      requestFormat: provider.requestFormat || 'openai'
    });
    setEditingId(provider.id);
    setIsAdding(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Custom API Providers</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* List existing custom providers */}
          {!isAdding && (
            <>
              <div className="space-y-2">
                {customProviders.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-8">
                    No custom providers yet. Add one to get started!
                  </p>
                ) : (
                  customProviders.map(provider => (
                    <div
                      key={provider.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{provider.label}</p>
                        <p className="text-sm text-gray-600 truncate">{provider.apiUrl}</p>
                        {provider.model && (
                          <p className="text-xs text-gray-500">Model: {provider.model}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Format: {provider.requestFormat}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(provider)}
                          className="p-2 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => onDeleteProvider(provider.id)}
                          className="p-2 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setIsAdding(true)}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={20} />
                Add Custom Provider
              </button>
            </>
          )}

          {/* Add/Edit form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Label *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  placeholder="e.g., My Local LLM, Azure OpenAI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL *
                </label>
                <input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                  placeholder="https://api.example.com/v1/chat/completions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Full endpoint URL for chat completions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  placeholder="Leave empty if no auth required"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  placeholder="e.g., gpt-4, llama-2-70b"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Format
                </label>
                <select
                  value={formData.requestFormat}
                  onChange={(e) => setFormData({...formData, requestFormat: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="openai">OpenAI Compatible</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="gemini">Google Gemini</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the API format your provider uses
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">Supported Formats:</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• <strong>OpenAI</strong>: Works with OpenAI, Azure OpenAI, Ollama, LM Studio, LocalAI</li>
                  <li>• <strong>Anthropic</strong>: Claude API format</li>
                  <li>• <strong>Gemini</strong>: Google Gemini API format</li>
                </ul>
                <div className="mt-2 pt-2 border-t border-blue-300">
                  <p className="font-medium text-blue-900 mb-1">Ollama Users:</p>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>• URL: <code className="bg-blue-100 px-1 rounded">http://localhost:11434/v1/chat/completions</code></li>
                    <li>• API Key: Leave empty or use "ollama"</li>
                    <li>• Model: Use exact model name (e.g., "command-r", "llama3.2")</li>
                    <li>• Format: Select "OpenAI Compatible"</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Add'} Provider
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};