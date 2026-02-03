import React from 'react';

const ChatLoader: React.FC = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-2xl rounded-bl-none border border-gray-200 px-4 py-3 max-w-xs">
        <div className="flex items-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
          </div>
          <div className="ml-2 text-sm text-gray-500">AI is thinking...</div>
        </div>
      </div>
    </div>
  );
};

export { ChatLoader };