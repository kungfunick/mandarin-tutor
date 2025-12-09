import React from 'react';
import { Mic, MicOff, HelpCircle, Send } from 'lucide-react';

export const InputArea = ({
  inputText,
  setInputText,
  isListening,
  isLoading,
  onToggleListening,
  onSendMessage,
  speechError,
  speechDebugInfo,
  theme
}) => {
  const isDark = theme === 'dark';
  
  return (
    <div className={`border-t p-4 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-4xl mx-auto">
        {speechError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" data-debug-ui>
            <p className="font-medium">Speech Recognition Error:</p>
            <p>{speechError}</p>
          </div>
        )}

        {speechDebugInfo && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700" data-debug-ui>
            <p className="font-medium">Debug Info:</p>
            <p>{speechDebugInfo}</p>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="输入中文... (Type in Chinese or use microphone)"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border-gray-300'
              }`}
              rows={2}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={onToggleListening}
            className={`p-3 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500 text-white shadow-lg scale-110 animate-pulse'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isLoading}
            title={isListening ? 'Recording... Click to stop' : 'Click and speak in Mandarin'}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={onSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <Send size={20} />
            Send
          </button>
        </div>

        <div className={`mt-2 flex items-center gap-2 text-xs ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <HelpCircle size={14} />
          <span>
            {isListening
              ? '🎤 Recording... Speak in Mandarin. CLICK MIC AGAIN TO STOP when done.'
              : 'Press Enter to send, Shift+Enter for new line. Click microphone to speak.'
            }
          </span>
        </div>
      </div>
    </div>
  );
};
