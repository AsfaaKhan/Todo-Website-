# Quickstart Guide: Todo AI Chatbot

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Access to Gemini API (or compatible service)
- Running backend API with todo endpoints
- Valid authentication tokens for testing

## Environment Setup

### 1. Install Dependencies
```bash
# Navigate to the frontend directory
cd frontend/

# Install required packages
npm install @modelcontextprotocol/server ws zod openai
```

### 2. Environment Variables
Add the following to your `.env.local` file:
```bash
# AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL_NAME=gemini-pro  # or appropriate model name

# MCP Server Configuration
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8080
MCP_SERVER_PATH=/mcp

# Backend API Configuration
BACKEND_API_URL=http://localhost:8000  # Adjust to your backend URL
```

## Architecture Components

### 1. MCP Server Setup
The MCP (Model Context Protocol) server acts as an intermediary between the AI agent and your backend services.

**File**: `src/ai/mcp-server.ts`
```typescript
import { Server, createServer } from '@modelcontextprotocol/server';
import { createTodoTool, updateTodoTool, completeTodoTool, deleteTodoTool, listTodosTool } from './tools';

const mcpServer = createServer({
  capabilities: {
    tools: {
      definitions: [
        createTodoTool,
        updateTodoTool,
        completeTodoTool,
        deleteTodoTool,
        listTodosTool
      ]
    }
  }
});

mcpServer.listen({ port: process.env.MCP_SERVER_PORT || 8080 });
```

### 2. Tool Definitions
Each tool represents a specific action the AI can perform:

**File**: `src/ai/tools.ts`
```typescript
import { Tool } from '@modelcontextprotocol/server';
import { todoApi } from '../services/api';

export const createTodoTool: Tool = {
  name: 'create_todo',
  description: 'Create a new todo item for the authenticated user',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      due_date: { type: 'string', format: 'date-time' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] }
    },
    required: ['title']
  },
  handler: async (params, context) => {
    // Validate user context from context object
    const userId = context.userId;

    // Call backend API to create todo
    const result = await todoApi.create(params, userId);

    return {
      success: true,
      todo: result
    };
  }
};

// Similar definitions for updateTodoTool, completeTodoTool, etc.
```

### 3. Chat UI Component
Integrate the chat interface into your existing dashboard:

**File**: `src/components/ChatBot.tsx`
```tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send to AI agent via API
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          userId: user?.id
        })
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">AI Todo Assistant</h3>
        <p className="text-sm text-gray-500">Ask me to manage your todos naturally</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p>{message.content}</p>
              <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 max-w-xs px-4 py-2 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me to add, update, or manage your todos..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Examples: "Add a task to buy groceries", "Mark task #1 as done", "Show my tasks for today"
        </p>
      </form>
    </div>
  );
};

export default ChatBot;
```

## Integration Steps

### 1. Add Chat Component to Dashboard
```tsx
// In your dashboard page (e.g., frontend/app/dashboard/page.tsx)
import ChatBot from '../../src/components/ChatBot';

// Add the chat bot to your dashboard layout
return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      {/* Your existing todo list */}
    </div>
    <div className="lg:col-span-1">
      <ChatBot />
    </div>
  </div>
);
```

### 2. Backend API Endpoint
Create the endpoint to handle chat messages:

**File**: `backend/app/api/chat.py` (or similar structure)
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..auth import get_current_user
from ..models import User
from ..services.todo_service import TodoService

router = APIRouter()

class ChatMessageRequest(BaseModel):
    message: str
    user_id: int

class ChatMessageResponse(BaseModel):
    response: str
    intent: Optional[str]
    processed: bool

@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user)
):
    # Validate that user owns the messages
    if current_user.id != request.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Process message with AI agent
    # This would connect to your MCP server
    # Implementation details depend on your AI integration

    # For now, returning a mock response
    return ChatMessageResponse(
        response="I received your message: " + request.message,
        intent="unknown",
        processed=False
    )
```

## Testing

### 1. Unit Tests
Create tests for your MCP tools:
```bash
npm test src/ai/tools.test.ts
```

### 2. Integration Tests
Test the full chat flow:
```bash
npm test src/components/ChatBot.test.tsx
```

### 3. Manual Testing
1. Start your MCP server: `npm run mcp-server`
2. Start your frontend: `npm run dev`
3. Navigate to the dashboard
4. Try natural language commands:
   - "Add a task to buy milk tomorrow"
   - "Mark the first task as complete"
   - "Show me urgent tasks"

## Deployment

### 1. Environment Variables
Ensure these are set in your deployment environment:
```
GEMINI_API_KEY=your_production_key
BACKEND_API_URL=https://your-backend-domain.com
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_PORT=8080
```

### 2. Health Checks
Add health check endpoints for monitoring:
- `/health` - Overall system health
- `/health/ai` - AI service connectivity
- `/health/mcp` - MCP server status

### 3. Scaling Considerations
- MCP server may need separate scaling from frontend
- Consider connection pooling for AI API calls
- Implement caching for frequently accessed data