# Todo AI Chatbot

## Overview
The Todo AI Chatbot is an intelligent conversational interface that allows users to manage their todo items using natural language commands. The system leverages MCP (Model Context Protocol) tools to ensure secure and controlled database operations while maintaining a stateless architecture.

## Architecture

### System Flow
```
Chat UI → FastAPI Endpoint → AI Agent → MCP Tools → Database
```

### Key Components
- **Frontend**: Next.js/React UI with ChatKit components
- **AI Agent**: OpenAI Agents SDK with natural language processing
- **MCP Server**: Model Context Protocol server for secure tool execution
- **Backend**: FastAPI with database access through MCP tools only
- **Database**: Neon PostgreSQL with SQLModel ORM

## Features

### Natural Language Processing
- Create todos: "Add a task to buy groceries tomorrow at 3pm"
- List todos: "Show me my tasks for today"
- Update todos: "Change task #1 to call mom tonight"
- Complete todos: "Mark the shopping task as done"
- Delete todos: "Remove task #2"

### Core Capabilities
- **Stateless Architecture**: Zero runtime memory between requests
- **Secure Tool Execution**: MCP protocol ensures safe database operations
- **Authentication Integration**: Better Auth validation throughout the stack
- **Real-time Communication**: WebSocket support for live interactions
- **Conversation Persistence**: Database-backed conversation history

## Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- Neon PostgreSQL database
- Gemini API key

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-directory>
```

2. Set up the backend:
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your database URL and Gemini API key to .env
```

3. Set up the frontend:
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Add your MCP server and API configuration to .env.local
```

4. Start the MCP server:
```bash
cd frontend
npm run dev
```

5. Start the backend:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

6. Start the frontend:
```bash
cd frontend
npm run dev
```

## Configuration

### Environment Variables

#### Backend (.env)
```
DATABASE_URL=your_neon_postgres_url
GEMINI_API_KEY=your_gemini_api_key
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_MCP_SERVER_HOST=localhost
NEXT_PUBLIC_MCP_SERVER_PORT=8001
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

## Usage

### Natural Language Commands
The chatbot supports various natural language commands:

#### Creating Tasks
- "Add a task to buy groceries"
- "Create a todo to call the doctor tomorrow"
- "Make a note to finish the report by Friday"

#### Listing Tasks
- "Show me my tasks"
- "List my pending todos"
- "What do I have to do today?"

#### Updating Tasks
- "Change task #1 title to 'Buy milk'"
- "Update the deadline for task #2 to next week"
- "Set high priority for the meeting task"

#### Completing Tasks
- "Mark task #1 as done"
- "Complete the shopping task"
- "Finish the assignment"

#### Deleting Tasks
- "Delete task #3"
- "Remove the appointment task"
- "Cancel the meeting task"

### API Endpoints

#### Chat API
```
POST /api/{user_id}/chat
```

Request body:
```json
{
  "message": "Your message to the AI",
  "userId": 123,
  "conversation_id": "optional_conversation_id"
}
```

Response:
```json
{
  "response": "AI's response",
  "intent": "detected_intent",
  "processed": true,
  "sessionId": "session_id"
}
```

## Development

### Project Structure
```
frontend/
├── src/
│   ├── ai/                 # AI agent and MCP components
│   │   ├── mcp-server.ts   # MCP protocol server
│   │   ├── tools/          # MCP tools for todo operations
│   │   └── parser/         # Natural language parsers
│   ├── components/         # React UI components
│   │   ├── ChatBot.tsx     # Main chat interface
│   │   ├── ChatInput.tsx   # Message input
│   │   └── ChatMessages.tsx # Message display
│   ├── services/           # Service layers
│   │   └── chat/           # Chat-specific services
│   └── types/              # TypeScript definitions
│       └── chat.ts         # Chat-related types

backend/
├── app/
│   ├── api/
│   │   └── chat.py         # Chat API endpoints
│   ├── models/
│   │   └── database.py     # Database models
│   ├── services/
│   │   └── todo_service.py # Todo business logic
│   └── auth/
│       └── token.py        # Authentication utilities
```

### Running Tests
```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
npm test
```

## Security

### MCP Protocol
- All database operations are performed through MCP tools
- No direct database access from AI agent
- Strict input validation and sanitization
- Authentication context propagation

### Data Protection
- User data isolation by user_id
- Encrypted authentication tokens
- Input sanitization to prevent injection attacks
- Rate limiting for API endpoints

## Performance

### Optimization Strategies
- Efficient database queries with proper indexing
- Caching for frequently accessed data
- Asynchronous processing where appropriate
- WebSocket connections for real-time communication

### Monitoring
- Response time tracking
- Error rate monitoring
- Resource utilization monitoring
- Conversation success/failure tracking

## Deployment

### Production Setup
1. Configure environment variables for production
2. Set up database connection pooling
3. Configure load balancer if using multiple instances
4. Set up monitoring and logging
5. Configure SSL certificates

### Environment Configuration
```
# Production environment variables
NEXT_PUBLIC_BACKEND_API_URL=https://your-domain.com
NEXT_PUBLIC_MCP_SERVER_HOST=your-mcp-server.com
DATABASE_URL=production_database_url
GEMINI_API_KEY=production_api_key
```

## Troubleshooting

### Common Issues

#### Authentication Problems
- Verify authentication tokens are properly configured
- Check that Better Auth is properly set up
- Ensure session IDs are being passed correctly

#### Database Connection Issues
- Verify DATABASE_URL is correct
- Check that the database is accessible
- Verify database credentials are valid

#### AI Service Problems
- Verify Gemini API key is valid
- Check rate limits for the AI service
- Verify network connectivity to AI service

#### MCP Tool Issues
- Verify all MCP tools are properly registered
- Check that tool schemas are correctly defined
- Verify authentication context is being passed to tools

### Debugging Tips
- Enable debug logging in the chat API for message flow tracing
- Monitor MCP server logs for tool execution details
- Check database connections and session management
- Use browser developer tools to inspect network requests

## Contributing

### Code Standards
- Follow TypeScript/Python style guides
- Write comprehensive unit tests
- Document public APIs
- Use meaningful variable names
- Follow security best practices

### Pull Request Process
1. Create a feature branch
2. Write tests for your changes
3. Submit pull request with detailed description
4. Address review comments
5. Ensure CI passes before merging

## Roadmap

### Planned Features
- Voice command support
- Multi-language support
- Advanced natural language understanding
- Machine learning for intent prediction
- Enhanced error recovery

### Future Improvements
- Performance optimization
- Advanced analytics
- Improved accessibility
- Mobile app integration
- Third-party service integration

## Support

For support, please open an issue in the repository or contact the development team.

## License

This project is licensed under the MIT License - see the LICENSE file for details.