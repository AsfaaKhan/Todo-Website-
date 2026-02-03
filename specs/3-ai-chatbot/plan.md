# Implementation Plan: Todo AI Chatbot

**Branch**: `3-ai-chatbot` | **Date**: 2026-02-03 | **Spec**: [link to spec.md](spec.md)
**Input**: Feature specification from `/specs/[3-ai-chatbot]/spec.md`

## Summary

Implementation of an AI-powered chatbot that allows users to manage todos via natural language commands. The system leverages MCP (Model Context Protocol) tools for database operations, maintaining a stateless architecture with conversation persistence. The system follows the architecture: ChatKit UI → FastAPI Chat Endpoint → OpenAI Agents SDK (Gemini) → MCP Server → Neon PostgreSQL.

## Technical Context

**Language/Version**: Python 3.11, TypeScript/JavaScript for frontend
**Primary Dependencies**: FastAPI, SQLModel, Next.js, React, MCP SDK, ws (WebSocket)
**Storage**: Neon PostgreSQL with SQLModel ORM
**Testing**: pytest for backend, Jest/React Testing Library for frontend
**Target Platform**: Web application (Next.js frontend + FastAPI backend)
**Project Type**: Web
**Performance Goals**: <5s response time for chat interactions
**Constraints**: Stateless architecture with zero runtime memory between requests, MCP-only database access
**Scale/Scope**: Multi-user support with proper authentication and data isolation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The implementation adheres to the core principles:
- Uses existing tech stack (FastAPI, SQLModel, Next.js) without introducing new dependencies
- Maintains stateless architecture as required
- Implements proper authentication and authorization
- Follows security best practices with MCP tool validation
- Separates concerns between UI, API, AI logic, and database operations

## Project Structure

### Documentation (this feature)

```text
specs/3-ai-chatbot/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   └── chat.py          # Chat API endpoints and logic
│   ├── models/
│   │   └── database.py      # Todo/User models
│   ├── services/
│   │   └── todo_service.py  # Todo operations
│   └── auth/
│       └── token.py         # Authentication utilities

frontend/
├── src/
│   ├── ai/
│   │   ├── ai-agent.ts      # AI agent implementation
│   │   ├── mcp-server.ts    # MCP server implementation
│   │   ├── parser/          # Natural language parsers
│   │   │   └── create-parser.ts
│   │   └── tools/           # MCP tools for todo operations
│   │       ├── create-todo.ts
│   │       ├── update-todo.ts
│   │       ├── complete-todo.ts
│   │       ├── delete-todo.ts
│   │       └── list-todos.ts
│   ├── components/
│   │   ├── ChatBot.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessages.tsx
│   │   └── ChatLoader.tsx
│   ├── services/
│   │   └── chat/
│   │       ├── api.ts
│   │       ├── websocket.ts
│   │       └── logger.ts
│   └── types/
│       └── chat.ts
```

**Structure Decision**: Web application with existing backend and frontend structures extended to support AI chatbot functionality.

## Executive Summary

The Todo AI Chatbot implementation will enhance the existing todo application with natural language processing capabilities. The system will allow users to create, view, update, complete, and delete todos using conversational commands. The architecture maintains a strict separation of concerns with MCP tools serving as the only interface to the database.

## Final Architecture

The system follows this flow: ChatKit UI → FastAPI Chat Endpoint → OpenAI Agents SDK (Gemini) → MCP Server → Neon PostgreSQL

- **Request Lifecycle**: User sends message → FastAPI validates auth → Fetches conversation history → Runs AI agent → Executes MCP tools → Stores response → Returns to UI
- **Conversation Persistence**: Conversations stored in database with message history; no server-side session memory maintained
- **Tool Invocation Path**: AI agent → MCP protocol → MCP tools → Database operations
- **Auth Propagation**: Better Auth token → FastAPI dependency → MCP tool validation → Database operations

## Ordered Phases with Dependencies

### Phase 1: System Readiness
- Validate existing DB models and auth flow compatibility
- Ensure backend infrastructure supports AI integration
- Verify existing todo service functions properly

### Phase 2: MCP Server Enhancement
- Define and register complete set of MCP tools: add_task, list_tasks, update_task, complete_task, delete_task
- Implement proper validation and structured outputs
- Ensure stateless behavior and proper error handling

### Phase 3: AI Agent Integration
- Integrate OpenAI Agents SDK with existing AI agent
- Implement deterministic tool-routing rules
- Add confirmation responses and ambiguity handling
- Implement anti-hallucination safeguards

### Phase 4: Enhanced Chat Endpoint
- Improve existing POST `/api/{user_id}/chat` endpoint to work with AI agent
- Ensure proper conversation history rebuilding
- Add tool execution and response handling
- Maintain stateless operation

### Phase 5: Frontend Integration
- Enhance ChatBot UI to work with AI agent responses
- Implement proper loading states and error handling
- Ensure conversation continuity across sessions

### Phase 6: Security Hardening
- Propagate Better Auth identity through agent → MCP tools
- Implement additional cross-user access prevention
- Validate all MCP tool inputs and outputs

### Phase 7: Testing Strategy
- Test MCP tool behavior with various inputs
- Validate agent routing logic
- Verify endpoint statelessness
- Test end-to-end natural language → tool execution

### Phase 8: Deployment Preparation
- Plan database migrations if needed
- Configure environment variables for AI services
- Plan MCP server startup and monitoring
- Ensure restart safety and conversation recovery

## Key Risks + Mitigation

1. **AI Hallucination Risk**: AI might generate invalid task IDs or perform incorrect operations
   - *Mitigation*: Strict MCP tool validation, input sanitization, confirmation responses

2. **State Management Issues**: Potential conversation state corruption in stateless architecture
   - *Mitigation*: Database-first approach, transaction safety, proper error handling

3. **Performance Degradation**: AI processing could slow down response times
   - *Mitigation*: Caching, async processing where appropriate, proper resource allocation

4. **Security Vulnerabilities**: Natural language input could lead to injection attacks
   - *Mitigation*: Input validation, parameter sanitization, proper auth propagation

## Testing Approach

- **Unit Tests**: MCP tool functionality with various inputs and edge cases
- **Integration Tests**: AI agent routing to correct tools with proper parameters
- **API Tests**: Chat endpoint behavior with authentication and conversation persistence
- **End-to-End Tests**: Complete user journey from natural language input to database update
- **Security Tests**: Cross-user access prevention and input sanitization validation

## Deployment Notes

- MCP server needs to be started alongside main application
- Environment variables required for AI service (Gemini API key)
- Database schema must support conversation and message persistence
- Load balancing considerations for AI processing resources
- Monitoring and logging for AI interactions and tool usage