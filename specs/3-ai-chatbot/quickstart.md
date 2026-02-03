# Todo AI Chatbot - Quickstart Guide

## Overview
Quickstart guide for developers to understand and extend the Todo AI Chatbot implementation.

## Prerequisites
- Node.js 18+ for frontend development
- Python 3.11+ for backend development
- Neon PostgreSQL database
- Gemini API key for AI services
- Existing todo application with authentication

## Environment Setup

### Backend Environment
```bash
# Copy backend environment file
cp backend/.env.example backend/.env

# Add your Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_neon_postgres_url
```

### Frontend Environment
```bash
# Copy frontend environment file
cp frontend/.env.local frontend/.env

# Add MCP server configuration
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8001
BACKEND_API_URL=http://localhost:8000
```

## Running the Application

### 1. Start the MCP Server
```bash
cd frontend
npm run dev  # Starts the MCP server
```

### 2. Start the Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Start the Frontend
```bash
cd frontend
npm run dev
```

## Key Components

### Backend API (`backend/app/api/chat.py`)
- Handles chat sessions and message processing
- Implements authentication validation
- Processes natural language commands
- Routes commands to appropriate todo operations

### Frontend Components (`frontend/src/components/`)
- `ChatBot.tsx` - Main chat interface
- `ChatInput.tsx` - Message input with submission handling
- `ChatMessages.tsx` - Displays conversation history
- `ChatLoader.tsx` - Loading indicators for AI responses

### AI Agent (`frontend/src/ai/`)
- `ai-agent.ts` - Core AI agent logic
- `mcp-server.ts` - MCP protocol server implementation
- `tools/` - MCP tools for todo operations
- `parser/` - Natural language processing utilities

## Making Changes

### Adding New MCP Tools
1. Create a new tool file in `frontend/src/ai/tools/`
2. Implement the MCP protocol interface
3. Register the tool with the MCP server
4. Update the backend to handle the new functionality

### Extending Natural Language Processing
1. Modify existing parsers in `frontend/src/ai/parser/`
2. Update intent detection logic in the AI agent
3. Add new handlers for different command types

### Modifying Conversation Flow
1. Update the chat endpoint in `backend/app/api/chat.py`
2. Modify the frontend components as needed
3. Ensure conversation persistence remains intact

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Troubleshooting

### Common Issues
- **Authentication failures**: Ensure Better Auth tokens are properly propagated
- **MCP server not connecting**: Check that MCP server is running on configured port
- **Database connection errors**: Verify DATABASE_URL is correct in environment
- **AI responses taking too long**: Check Gemini API key and rate limits

### Debugging Tips
- Enable debug logging in the chat API for message flow tracing
- Monitor MCP server logs for tool execution details
- Check database connections and session management