import React from 'react';
import { Trash2 } from 'lucide-react';

export const HistoryPanel = ({
  show,
  conversations,
  onLoadConversation,
  onDeleteConversation
}) => {
  if (!show) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 p-4 max-h-96 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h3 className="font-bold text-lg mb-3 text-gray-800">Conversation History</h3>
        {conversations.length === 0 ? (
          <p className="text-gray-600 text-sm">No saved conversations yet.</p>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className="bg-white rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onLoadConversation(conv)}
                >
                  <p className="font-medium text-gray-800">{conv.title}</p>
                  <p className="text-sm text-gray-600">
                    {conv.messages.length} messages • {conv.difficulty} • {conv.provider}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="p-2 hover:bg-red-100 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
