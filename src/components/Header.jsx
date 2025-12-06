import React from 'react';
import { MessageSquare, Save, History, RotateCcw, Settings, Zap } from 'lucide-react';

export const Header = ({
  currentProvider,
  onSave,
  onToggleHistory,
  onReset,
  onToggleSettings
}) => {
  return (
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
            onClick={onSave}
            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
            title="Save conversation"
          >
            <Save size={20} className="text-green-600" />
          </button>
          <button
            onClick={onToggleHistory}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="View history"
          >
            <History size={20} className="text-blue-600" />
          </button>
          <button
            onClick={onReset}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="New conversation"
          >
            <RotateCcw size={20} className="text-gray-600" />
          </button>
          <button
            onClick={onToggleSettings}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};