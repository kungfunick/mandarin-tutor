import React from 'react';
import { Volume2 } from 'lucide-react';

export const MessageBubble = ({ message, showTranslations, onSpeak }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-800'
        }`}
      >
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <p className="text-xl font-medium mb-1">{message.mandarin}</p>
            {showTranslations && message.pinyin && (
              <p className={`text-sm italic mb-1 ${
                isUser ? 'text-blue-100' : 'text-gray-600'
              }`}>
                {message.pinyin}
              </p>
            )}
            {showTranslations && message.english && (
              <p className={`text-sm ${
                isUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.english}
              </p>
            )}
          </div>
          {!isUser && (
            <button
              onClick={() => onSpeak(message.mandarin)}
              className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Play audio"
            >
              <Volume2 size={18} className="text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const LoadingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
      </div>
    </div>
  </div>
);