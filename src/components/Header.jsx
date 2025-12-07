import React from 'react';
import { MessageSquare, Save, History, RotateCcw, Settings, Zap, Sliders } from 'lucide-react';

export const Header = ({
  currentProvider,
  onSave,
  onToggleHistory,
  onReset,
  onToggleSettings,
  onToggleAdvanced,
  showDebugButton,
  theme
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`shadow-sm border-b p-4 ${
      isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-red-100'
    }`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className={isDark ? 'text-red-400' : 'text-red-600'} size={28} />
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              中文对话 Mandarin Tutor
            </h1>
            <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Zap size={14} />
              Powered by {currentProvider.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {showDebugButton && (
            <button
              onClick={onToggleAdvanced}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-purple-900'
                  : 'hover:bg-purple-100'
              }`}
              title="Advanced settings"
            >
              <Sliders size={20} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
            </button>
          )}
          <button
            onClick={onSave}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-green-900'
                : 'hover:bg-green-100'
            }`}
            title="Save conversation"
          >
            <Save size={20} className={isDark ? 'text-green-400' : 'text-green-600'} />
          </button>
          <button
            onClick={onToggleHistory}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-blue-900'
                : 'hover:bg-blue-100'
            }`}
            title="View history"
          >
            <History size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          </button>
          <button
            onClick={onReset}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
            }`}
            title="New conversation"
          >
            <RotateCcw size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>
          <button
            onClick={onToggleSettings}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
            }`}
            title="Settings"
          >
            <Settings size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
      </div>
    </div>
  );
};