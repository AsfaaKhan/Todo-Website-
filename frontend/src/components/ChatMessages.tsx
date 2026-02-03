import React from 'react';
import { Message } from '../types/chat';

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none'
                : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-bl-none border border-gray-200'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
            <div
              className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {message.intent && (
                <span
                  className="ml-2 px-1.5 py-0.5 bg-opacity-20 rounded-full text-xs capitalize"
                  style={{
                    backgroundColor: message.sender === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(156,163,175,0.2)',
                    color: message.sender === 'user' ? '#bfdbfe' : '#6b7280'
                  }}
                >
                  {message.intent}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { ChatMessages };