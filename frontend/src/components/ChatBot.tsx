import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../services/chat/api';
import { ChatMessageRequest, Message } from '../types/chat';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { errorHandler } from '../utils/error-handler';
import { aiAgent, AIContext } from '../ai/ai-agent';

interface ChatBotProps {
  className?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { user } = useAuth();

  // Initialize chat session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const sessionData = await chatApi.startSession();
        setSessionId(sessionData.sessionId);

        // Load conversation history if available
        if (sessionData.conversationId) {
          try {
            const historyData = await chatApi.getChatHistory(sessionData.sessionId);
            if (historyData.messages && historyData.messages.length > 0) {
              // Convert API response to our internal Message format
              const convertedMessages: Message[] = historyData.messages.map((msg: any) => ({
                id: msg.id,
                sessionId: msg.sessionId,
                content: msg.content,
                sender: msg.sender,
                timestamp: new Date(msg.timestamp),
                intent: msg.intent,
                parameters: msg.parameters
              }));
              setMessages(convertedMessages);
              return; // Skip welcome message if we have history
            }
          } catch (historyError) {
            console.warn('Could not load chat history:', historyError);
          }
        }

        // Add welcome message if no history was loaded
        const welcomeMessage: Message = {
          id: Date.now(),
          sessionId: sessionData.sessionId,
          content: "Hello! I'm your AI assistant. You can ask me to create, update, complete, or list your todos. Try saying something like 'Add a task to buy groceries' or 'Show me my tasks'.",
          sender: 'ai',
          timestamp: new Date(),
          intent: 'welcome'
        };

        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to initialize chat session:', error);
        const errorMessage: Message = {
          id: Date.now(),
          sessionId: sessionId || '',
          content: "Sorry, I'm having trouble connecting. Please try again later.",
          sender: 'ai',
          timestamp: new Date(),
          intent: 'error'
        };
        setMessages([errorMessage]);
      }
    };

    initializeSession();

    // Cleanup on unmount
    return () => {
      if (sessionId) {
        // Optionally end the session when component unmounts
        // chatApi.endSession(sessionId).catch(console.error);
      }
    };
  }, []);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading || !sessionId || !user) return;

    try {
      setIsLoading(true);

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now(),
        sessionId: sessionId,
        content: message,
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Send message to chat API
      const response = await chatApi.sendMessage(sessionId, {
        message: message,
        userId: user?.id || user?.user_id || 1
      });

      const aiMessage: Message = {
        id: Date.now(),
        sessionId: sessionId,
        content: response.response,
        sender: 'ai',
        timestamp: new Date(),
        intent: response.intent,
        parameters: response.processed ? { processed: true } : undefined
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Show error message to user
      const errorMessage: Message = {
        id: Date.now(),
        sessionId: sessionId,
        content: errorHandler.handleError(error, 'ChatBot.handleSendMessage', 'Sorry, I encountered an error. Please try again.'),
        sender: 'ai',
        timestamp: new Date(),
        intent: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-800">AI Todo Assistant</h3>
            <p className="text-sm text-gray-500">Manage your tasks with natural language</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-h-[400px] bg-gradient-to-b from-white to-blue-50">
        {messages.length > 0 ? (
          <ChatMessages messages={messages} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 italic">Starting conversation...</p>
          </div>
        )}
        {isLoading && <ChatLoader />}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Ask me to add, update, or manage your todos..."
      />
    </div>
  );
};

export default ChatBot;