# Claude Code Context for Todo AI Chatbot Project

## Project Overview
- **Frontend**: Next.js application with existing UI components
- **Backend**: FastAPI with BetterAuth authentication
- **Database**: PostgreSQL (Neon)
- **Authentication**: BetterAuth session management
- **New Component**: AI-powered chatbot for natural language todo management

## Architecture
- **Chat UI Component**: React component for conversational interface
- **MCP Server**: Model Context Protocol server for AI tool integration
- **AI Agent**: OpenAI Agents SDK with Gemini API integration
- **Intent Parser**: Natural language processing module
- **Session Manager**: Chat session context management

## Key Technologies
- Next.js (React framework)
- FastAPI (Python backend)
- BetterAuth (Authentication)
- PostgreSQL (Database)
- OpenAI Agents SDK
- Gemini API
- MCP (Model Context Protocol)
- WebSocket (Real-time communication)

## File Structure
- `frontend/` - Next.js frontend application
- `backend/` - FastAPI backend application
- `specs/2-ai-chatbot/` - Specification and planning documents
- `frontend/src/components/ChatBot.tsx` - Chat interface component
- `frontend/src/ai/` - AI integration components
- `frontend/src/ai/mcp-server.ts` - MCP server implementation
- `frontend/src/ai/tools.ts` - AI tool definitions
- `backend/app/api/chat.py` - Backend chat API endpoints

## API Endpoints
- `/api/chat/start` - Start new chat session
- `/api/chat/{sessionId}/message` - Send message to AI
- `/api/chat/{sessionId}/history` - Get chat history
- `/api/chat/{sessionId}` - End chat session

## MCP Tools
- `create_todo` - Create new todo item
- `update_todo` - Update existing todo item
- `complete_todo` - Mark todo as completed
- `delete_todo` - Delete todo item
- `list_todos` - List todo items with filters

## Environment Variables
- `GEMINI_API_KEY` - API key for Gemini service
- `MCP_SERVER_HOST` - Host for MCP server
- `MCP_SERVER_PORT` - Port for MCP server
- `BACKEND_API_URL` - URL for backend API

## Security Considerations
- User authentication context must be maintained
- No direct database access from AI components
- Input sanitization for all user inputs
- Proper session management
- Rate limiting for API protection

## Testing Strategy
- Unit tests for MCP tools
- Integration tests for chat functionality
- End-to-end tests for complete conversation flows
- Security tests for authentication validation
- Performance tests for response times

## Data Models
- ChatSession: Tracks chat sessions with user context
- Message: Individual chat messages with sender and content
- Intent: AI-recognized intents with parameters and results