import React from 'react';
import { Volume2 } from 'lucide-react';

/**
 * Parse correction markup from AI response
 * Supports formats like:
 * - [correct: 正确的词]
 * - [error: 错误的词 → 正确的词]
 * - <correction>text</correction>
 */
const parseCorrections = (text) => {
  if (!text) return { hasCorrections: false, elements: [{ type: 'text', content: text }] };

  const elements = [];
  let hasCorrections = false;

  // Pattern 1: [error: wrong → right]
  const errorPattern = /\[error:\s*([^→]+)\s*→\s*([^\]]+)\]/g;
  // Pattern 2: [correct: text]
  const correctPattern = /\[correct:\s*([^\]]+)\]/g;
  // Pattern 3: <correction>text</correction>
  const xmlPattern = /<correction>([^<]+)<\/correction>/g;

  let lastIndex = 0;
  let match;

  // Combine all patterns
  const combinedPattern = /(\[error:\s*([^→]+)\s*→\s*([^\]]+)\]|\[correct:\s*([^\]]+)\]|<correction>([^<]+)<\/correction>)/g;

  while ((match = combinedPattern.exec(text)) !== null) {
    hasCorrections = true;

    // Add text before the match
    if (match.index > lastIndex) {
      elements.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Determine which pattern matched
    if (match[0].startsWith('[error:')) {
      // Error correction
      elements.push({
        type: 'error',
        wrong: match[2].trim(),
        right: match[3].trim()
      });
    } else if (match[0].startsWith('[correct:')) {
      // Correct usage highlight
      elements.push({
        type: 'correct',
        content: match[4].trim()
      });
    } else if (match[0].startsWith('<correction>')) {
      // XML-style correction
      elements.push({
        type: 'suggestion',
        content: match[5].trim()
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return { hasCorrections, elements: elements.length > 0 ? elements : [{ type: 'text', content: text }] };
};

const CorrectionElement = ({ element }) => {
  switch (element.type) {
    case 'error':
      return (
        <span className="inline-flex items-center gap-1">
          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded line-through">
            {element.wrong}
          </span>
          <span className="text-gray-500">→</span>
          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
            {element.right}
          </span>
        </span>
      );
    case 'correct':
      return (
        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300">
          ✓ {element.content}
        </span>
      );
    case 'suggestion':
      return (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-300">
          💡 {element.content}
        </span>
      );
    default:
      return <span>{element.content}</span>;
  }
};

export const MessageBubble = ({ message, showTranslations, onSpeak, correctionMode, voiceGender }) => {
  const isUser = message.role === 'user';

  // Parse corrections if in correction mode and it's an assistant message
  const parsed = correctionMode && !isUser
    ? parseCorrections(message.mandarin)
    : { hasCorrections: false, elements: [{ type: 'text', content: message.mandarin }] };

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
            {/* Main text with corrections */}
            <div className="text-xl font-medium mb-1">
              {parsed.hasCorrections ? (
                <div className="space-y-1">
                  {parsed.elements.map((element, idx) => (
                    <CorrectionElement key={idx} element={element} />
                  ))}
                </div>
              ) : (
                message.mandarin
              )}
            </div>

            {/* Pinyin */}
            {showTranslations && message.pinyin && (
              <p className={`text-sm italic mb-1 ${
                isUser ? 'text-blue-100' : 'text-gray-600'
              }`}>
                {message.pinyin}
              </p>
            )}

            {/* English translation */}
            {showTranslations && message.english && (
              <p className={`text-sm ${
                isUser ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.english}
              </p>
            )}

            {/* Correction note */}
            {parsed.hasCorrections && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600 italic">
                  💡 The teacher highlighted some corrections above to help you improve
                </p>
              </div>
            )}
          </div>

          {/* Speaker button */}
          {!isUser && (
            <button
              onClick={() => onSpeak(message.mandarin, { gender: voiceGender })}
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