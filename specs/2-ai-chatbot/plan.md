# Todo AI Chatbot Implementation Plan

## Technical Context

### Current Architecture
- **Frontend**: Next.js application with existing UI components
- **Backend**: FastAPI with BetterAuth authentication
- **Database**: PostgreSQL (Neon)
- **Authentication**: BetterAuth session management

### New Components to be Added
- **Chat UI Component**: React component for conversational interface
- **MCP Server**: Model Context Protocol server for AI tool integration
- **AI Agent Configuration**: OpenAI Agents SDK with Gemini API integration
- **Intent Parser**: Natural language processing module
- **Session Manager**: Chat session context management

### Known Dependencies
- OpenAI Agents SDK
- Gemini API access
- MCP protocol libraries
- Existing backend API endpoints
- BetterAuth authentication context

## Constitution Check

### Alignment with Project Principles
- ✅ **Modularity**: AI chatbot will be implemented as a modular component
- ✅ **Security**: Proper authentication context will be maintained
- ✅ **Maintainability**: Clean separation between AI layer and backend services
- ✅ **Performance**: Response time requirements are specified (under 5 seconds)
- ✅ **User Experience**: Natural language interface enhances usability

### Compliance Verification
- All new components will respect existing authentication context
- No direct database access from AI components
- MCP architecture ensures proper separation of concerns
- Error handling is designed to be user-friendly

## Gates

### Gate 1: Architecture Compatibility
- ✅ Existing frontend can accommodate new chat UI component
- ✅ Backend APIs are available for MCP tool integration
- ✅ Authentication context can be passed securely to AI components

### Gate 2: Technology Feasibility
- ✅ OpenAI Agents SDK supports Gemini API integration
- ✅ MCP protocol implementation is technically feasible
- ✅ Next.js can integrate with real-time chat functionality

### Gate 3: Security Requirements
- ✅ User data isolation will be maintained
- ✅ Authentication context will be validated for each operation
- ✅ Input sanitization will prevent injection attacks

## Phase 0: Research & Resolution

### Research Tasks

#### R1: MCP Server Implementation
- **Task**: Research MCP (Model Context Protocol) server setup for Next.js/FastAPI environment
- **Output**: Determine best approach for MCP server integration
- **Dependencies**: None

#### R2: OpenAI Agents with Gemini API
- **Task**: Investigate compatibility between OpenAI Agents SDK and Gemini API
- **Output**: Verify API compatibility and integration approach
- **Dependencies**: Gemini API access

#### R3: Real-time Chat in Next.js
- **Task**: Research optimal implementation for real-time chat UI in Next.js
- **Output**: Choose between WebSocket, Server-Sent Events, or polling
- **Dependencies**: Frontend architecture

#### R4: Session Context Management
- **Task**: Research secure session context passing between frontend, AI agent, and backend
- **Output**: Design for maintaining user authentication context
- **Dependencies**: BetterAuth integration

### Research Outcomes

#### Decision: MCP Server Implementation
- **Chosen**: Node.js-based MCP server running alongside Next.js frontend
- **Rationale**: Allows for easy integration with existing JavaScript ecosystem and real-time communication
- **Alternatives considered**: Python-based server, cloud-hosted MCP service

#### Decision: AI Integration Approach
- **Chosen**: OpenAI-compatible API wrapper to connect with Gemini API
- **Rationale**: Provides compatibility with OpenAI Agents SDK while leveraging Gemini's capabilities
- **Alternatives considered**: Direct Gemini API integration, separate AI service

#### Decision: Real-time Communication
- **Chosen**: WebSocket connection for real-time chat interface
- **Rationale**: Provides low-latency communication essential for chat experience
- **Alternatives considered**: Server-Sent Events, periodic polling

#### Decision: Session Management
- **Chosen**: JWT token passing through MCP tools with backend validation
- **Rationale**: Maintains security while allowing AI to access user context
- **Alternatives considered**: Session cookies, temporary access tokens

## Phase 1: Design & Contracts

### Data Models

#### ChatSession Entity
- **sessionId**: String (unique identifier)
- **userId**: Integer (foreign key to user)
- **messages**: Array of Message objects
- **createdAt**: DateTime
- **updatedAt**: DateTime
- **isActive**: Boolean

#### Message Entity
- **id**: Integer (unique identifier)
- **sessionId**: String (foreign key to chat session)
- **sender**: Enum ('user', 'ai')
- **content**: String
- **timestamp**: DateTime
- **intent**: String (optional, for AI-identified intent)
- **parameters**: Object (optional, for extracted parameters)

#### Intent Entity
- **type**: Enum ('create', 'update', 'complete', 'delete', 'list')
- **confidenceScore**: Float (0-1)
- **extractedParameters**: Object
- **actionResult**: Object (result of tool execution)

### API Contracts

#### Chat API Endpoints
```
POST /api/chat/start
- Starts a new chat session
- Requires authentication
- Returns session ID

POST /api/chat/{sessionId}/message
- Sends a message to the AI agent
- Requires valid session ID and authentication
- Returns AI response

GET /api/chat/{sessionId}/history
- Retrieves chat history for session
- Requires valid session ID and authentication
- Returns message array

DELETE /api/chat/{sessionId}
- Ends and cleans up chat session
- Requires valid session ID and authentication
- Returns success status
```

#### MCP Tool Contracts
```
Tool: create_todo
- Parameters: {title: string, description?: string, dueDate?: string, priority?: string}
- Returns: {success: boolean, todo: TodoObject, error?: string}

Tool: update_todo
- Parameters: {todoId: integer, title?: string, description?: string, dueDate?: string, priority?: string, completed?: boolean}
- Returns: {success: boolean, todo: TodoObject, error?: string}

Tool: complete_todo
- Parameters: {todoId: integer}
- Returns: {success: boolean, todo: TodoObject, error?: string}

Tool: delete_todo
- Parameters: {todoId: integer}
- Returns: {success: boolean, error?: string}

Tool: list_todos
- Parameters: {completed?: boolean, dueDate?: string, priority?: string}
- Returns: {success: boolean, todos: TodoObject[], error?: string}
```

### Quickstart Guide

#### Setup Commands
```bash
# Install AI and MCP dependencies
npm install @openai/agents @modelcontextprotocol/server

# Create necessary directories
mkdir -p src/ai/mcp src/components/chat src/services/chat

# Add environment variables
echo "GEMINI_API_KEY=your_key_here" >> .env.local
echo "MCP_SERVER_PORT=8080" >> .env.local
```

#### Integration Steps
1. Set up MCP server with tool definitions
2. Integrate chat UI component into dashboard
3. Connect WebSocket for real-time communication
4. Implement authentication context passing
5. Deploy and test chat functionality

## Phase 2: Implementation Strategy

### Phase 2A: Infrastructure Setup
1. **MCP Server Development**
   - Create MCP server with defined tool contracts
   - Implement authentication validation for each tool
   - Set up error handling and logging

2. **Backend API Extensions**
   - Add chat session management endpoints
   - Extend existing todo API for MCP tool compatibility
   - Implement proper authentication context validation

### Phase 2B: Frontend Integration
1. **Chat UI Component**
   - Develop React chat interface with message history
   - Implement typing indicators and loading states
   - Add example commands and user guidance

2. **Real-time Communication**
   - Set up WebSocket connection to backend
   - Implement message sending and receiving
   - Add connection status indicators

### Phase 2C: AI Integration
1. **Agent Configuration**
   - Configure OpenAI-compatible agent with Gemini API
   - Set up tool registration and calling mechanism
   - Implement intent recognition and parameter extraction

2. **Conversation Management**
   - Implement context maintenance across messages
   - Add conversation history management
   - Create fallback mechanisms for ambiguous inputs

### Phase 2D: Security & Validation
1. **Authentication Integration**
   - Ensure all operations validate user context
   - Implement proper session management
   - Add rate limiting and abuse prevention

2. **Input Validation**
   - Sanitize all user inputs
   - Validate extracted parameters before database operations
   - Implement proper error messaging

## Risks & Mitigation Strategies

### Risk 1: AI API Latency
- **Risk**: Gemini API responses may exceed 5-second requirement
- **Mitigation**: Implement caching for common operations, optimize prompts, add loading indicators
- **Contingency**: Fallback to simpler rule-based processing for basic operations

### Risk 2: Authentication Context Loss
- **Risk**: User authentication context may not persist through AI operations
- **Mitigation**: Implement robust token passing and validation mechanisms
- **Contingency**: Require re-authentication for sensitive operations

### Risk 3: MCP Protocol Complexity
- **Risk**: MCP server implementation may be more complex than anticipated
- **Mitigation**: Start with minimal viable MCP implementation, iterate based on requirements
- **Contingency**: Alternative direct API approach if MCP proves too complex

### Risk 4: Natural Language Understanding
- **Risk**: AI may misinterpret user intents leading to incorrect operations
- **Mitigation**: Implement confidence scoring, user confirmation for destructive operations
- **Contingency**: Rule-based fallback for common command patterns

## Success Metrics

### Technical Metrics
- Response time consistently under 5 seconds
- 90% accuracy for common natural language commands
- Zero unauthorized access incidents
- Proper error handling without system crashes

### User Experience Metrics
- 95% user satisfaction with chatbot usability
- Successful completion of all acceptance criteria scenarios
- Seamless integration with existing UI components
- Intuitive natural language interaction

## Dependencies & Timeline

### Critical Dependencies
1. Gemini API access and stability
2. OpenAI Agents SDK compatibility
3. Existing backend API availability
4. MCP protocol library support

### Implementation Order
1. MCP server and tool contracts (Week 1)
2. Backend API extensions (Week 1)
3. Chat UI component (Week 2)
4. AI integration and testing (Week 2-3)
5. Security validation and deployment (Week 3)

## Quality Assurance

### Testing Strategy
- Unit tests for MCP tool implementations
- Integration tests for chat session management
- End-to-end tests for complete conversation flows
- Security tests for authentication context validation
- Performance tests for response time requirements

### Manual Testing
- Natural language command validation
- Authentication context preservation
- Error handling and fallback scenarios
- Cross-browser compatibility for chat UI