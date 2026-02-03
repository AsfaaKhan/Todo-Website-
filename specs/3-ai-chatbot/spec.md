# Todo AI Chatbot - Specification

**Feature Branch**: `3-ai-chatbot`
**Created**: 2026-02-03
**Status**: Draft
**Input**: Phase III — Todo AI Chatbot (UPDATED) - Create an AI chatbot that allows users to manage todos via natural language using OpenAI Agents SDK, Free Gemini API, Official MCP SDK, FastAPI, ChatKit UI, and stateless architecture with database persistence.

## System Overview

The Todo AI Chatbot is an AI-powered conversational layer that allows users to manage their todo items using natural language. The system integrates with the existing multi-user todo application, enabling users to create, update, complete, delete, and list todos through conversational commands. The chatbot operates through MCP (Model Context Protocol) tools exclusively, ensuring separation of concerns and maintaining stateless architecture.

## Architecture

The system follows a stateless architecture pattern where each request contains all necessary context:

1. **Frontend (OpenAI ChatKit)**: Provides conversational UI for user interaction
2. **Backend (FastAPI)**: Handles API requests and orchestrates the AI agent
3. **AI Framework (OpenAI Agents SDK)**: Processes natural language and determines actions
4. **MCP Server**: Executes stateless tools for database operations
5. **Database (Neon PostgreSQL)**: Persists todos, conversations, and messages

The architecture ensures zero runtime memory between requests, with all state persisted to the database.

## Components

### Frontend Components
- **Chat Interface**: Real-time conversational UI using ChatKit
- **Message Display**: Shows conversation history and current exchanges
- **Input Field**: Accepts natural language commands from users

### Backend Components
- **API Gateway**: Handles `/api/{user_id}/chat` endpoint
- **Agent Orchestrator**: Manages the AI agent lifecycle and conversation state
- **Conversation Manager**: Handles conversation persistence and retrieval
- **Authentication Layer**: Validates user identity using Better Auth

### MCP Server Components
- **Stateless Tools**: MCP-compliant tools for todo operations
- **Database Adapters**: Tools that interact with the database on behalf of the AI
- **Validation Layer**: Ensures all operations are authorized and valid

## Data Models

### Task Model
- `user_id`: Identifier linking task to owner
- `id`: Unique identifier for the task
- `title`: Descriptive name of the task
- `description`: Additional details about the task
- `completed`: Boolean indicating completion status
- `created_at`: Timestamp when task was created
- `updated_at`: Timestamp when task was last modified

### Conversation Model
- `user_id`: Identifier linking conversation to owner
- `id`: Unique identifier for the conversation
- `created_at`: Timestamp when conversation was initiated
- `updated_at`: Timestamp when conversation was last active

### Message Model
- `user_id`: Identifier linking message to owner
- `id`: Unique identifier for the message
- `conversation_id`: Links message to parent conversation
- `role`: Indicates sender ('user' or 'assistant')
- `content`: Text content of the message
- `created_at`: Timestamp when message was created

## API Contracts

### Primary Endpoint
```
POST /api/{user_id}/chat
```

**Request Body**:
```json
{
  "conversation_id": "optional string",
  "message": "required string"
}
```

**Response Body**:
```json
{
  "conversation_id": "string",
  "response": "string",
  "tool_calls": "array of tool calls"
}
```

### Authentication
All requests must be authenticated using Better Auth tokens, ensuring users can only access their own data.

## MCP Tool Schemas

### add_task Tool
- **Parameters**:
  - `user_id`: integer (required)
  - `title`: string (required)
  - `description`: string (optional)
- **Returns**: Object containing created task details
- **Failure Cases**: Invalid user_id, insufficient permissions, database error

### list_tasks Tool
- **Parameters**:
  - `user_id`: integer (required)
  - `status`: string (optional, 'all', 'pending', 'completed')
- **Returns**: Array of task objects matching criteria
- **Failure Cases**: Invalid user_id, insufficient permissions

### complete_task Tool
- **Parameters**:
  - `user_id`: integer (required)
  - `task_id`: integer (required)
- **Returns**: Updated task object
- **Failure Cases**: Invalid user_id, task not found, insufficient permissions

### delete_task Tool
- **Parameters**:
  - `user_id`: integer (required)
  - `task_id`: integer (required)
- **Returns**: Confirmation of deletion
- **Failure Cases**: Invalid user_id, task not found, insufficient permissions

### update_task Tool
- **Parameters**:
  - `user_id`: integer (required)
  - `task_id`: integer (required)
  - `title`: string (optional)
  - `description`: string (optional)
  - `completed`: boolean (optional)
- **Returns**: Updated task object
- **Failure Cases**: Invalid user_id, task not found, insufficient permissions

## Agent Design

### Natural Language Processing
The agent processes user input to identify intent and extract parameters:
- **Task Creation**: Recognizes commands like "add", "create", "remember"
- **Listing**: Recognizes commands like "show", "list", "pending", "completed"
- **Completion**: Recognizes commands like "done", "finished", "complete"
- **Deletion**: Recognizes commands like "delete", "remove", "cancel"
- **Update**: Recognizes commands like "change", "rename", "update"

### Deterministic Routing
The agent follows strict routing rules:
- When intent is CREATE_TASK → calls `add_task` tool
- When intent is LIST_TASKS → calls `list_tasks` tool
- When intent is COMPLETE_TASK → calls `complete_task` tool
- When intent is DELETE_TASK → calls `delete_task` tool
- When intent is UPDATE_TASK → calls `update_task` tool

### Behavior Constraints
- Never hallucinate task IDs
- Ask clarifying questions when ambiguous
- Confirm every successful action
- Gracefully handle errors
- Avoid redundant tool calls
- Prefer deterministic behavior over creative responses

## Conversation Lifecycle

### Request Processing Flow
1. **Receive Message**: Accept user input with optional conversation ID
2. **Validate Auth**: Verify user identity and permissions
3. **Fetch History**: Retrieve existing conversation if ID provided
4. **Store User Message**: Persist user's message to database
5. **Build Context**: Construct message array for agent
6. **Execute Agent**: Process input through AI agent
7. **Tool Invocation**: Execute MCP tools as needed
8. **Store Response**: Persist AI's response to database
9. **Return Result**: Send formatted response to client

### Persistence Strategy
- Conversations and messages are stored in database
- Conversation state is rebuilt from database on each request
- No server-side session memory is maintained

## Security

### Authentication & Authorization
- All requests require valid Better Auth tokens
- User ID validation ensures data isolation
- MCP tools validate ownership before operations
- Session management handled by Better Auth

### Input Validation
- All user inputs validated before processing
- MCP tool parameters sanitized
- SQL injection prevention through ORM
- Prompt injection protection through input validation

### Data Protection
- User data isolated by user_id
- No cross-user data access allowed
- Encrypted authentication tokens
- Secure API communication

## Failure Handling

### Task Not Found
- Agent receives error from MCP tool
- Responds with informative message to user
- Offers alternative actions when possible

### Invalid Parameters
- MCP tools validate input parameters
- Error responses sent back through agent
- User receives helpful error messages

### Empty Lists
- `list_tasks` returns empty array when no matches
- Agent formats appropriate response for user
- May suggest creating new tasks

### Malformed Prompts
- Agent attempts to parse with available context
- Requests clarification when needed
- Falls back to default behavior if ambiguous

### LLM Failures
- System provides graceful degradation
- Error messages to user with retry option
- Logging for debugging and monitoring

### MCP Timeouts
- Timeout handling in MCP client
- Appropriate user messaging
- Retry mechanisms where appropriate

## Deployment Notes

### Infrastructure Requirements
- FastAPI server with adequate memory for AI operations
- MCP server instance accessible to main application
- Neon PostgreSQL database with sufficient capacity
- Authentication service (Better Auth) properly configured

### Configuration
- Gemini API key securely stored
- MCP server connection details configured
- Database connection pool settings optimized
- Rate limiting and security headers configured

### Monitoring
- Conversation success/failure rates
- Tool execution times and errors
- User engagement metrics
- Resource utilization monitoring

## Acceptance Criteria

### ✅ Natural Language Todo Management
**Given** a user with valid authentication,
**When** the user enters natural language commands like "Add a task to buy groceries",
**Then** the system creates the appropriate todo item linked to the user's account.

### ✅ MCP Tool Exclusivity
**Given** an AI agent processing a request,
**When** the agent needs to perform a database operation,
**Then** it must only use the defined MCP tools and never access the database directly.

### ✅ Conversation Persistence
**Given** a conversation with multiple exchanges,
**When** the server restarts,
**Then** users can resume their conversations with full history intact.

### ✅ Stateless Operation
**Given** a server processing requests,
**When** multiple requests arrive in sequence,
**Then** the server maintains zero runtime memory between requests.

### ✅ Action Confirmation
**Given** a successful operation (create, update, complete, delete),
**When** the operation completes,
**Then** the AI agent confirms the action to the user.

### ✅ Error Handling
**Given** an invalid request or system error,
**When** the error occurs,
**Then** the system handles it gracefully and provides helpful feedback to the user.

### ✅ Resume After Restart
**Given** a server restart,
**When** users return to the application,
**Then** they can continue their conversations from where they left off.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Natural Language Todo Creation (Priority: P1)

Users can create new todo items by speaking naturally to the chatbot.

**Why this priority**: This is the foundational capability that enables all other interactions with the system.

**Independent Test**: Users can say "Add a task to buy milk tomorrow" and see the task appear in their todo list, delivering immediate value for the core use case.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and in the chat interface, **When** the user says "Add a task to buy groceries", **Then** a new task titled "buy groceries" appears in their todo list and the AI confirms creation.

2. **Given** a user is authenticated and in the chat interface, **When** the user says "Remember to call the doctor", **Then** a new task titled "call the doctor" appears in their todo list.

---
### User Story 2 - Todo Listing and Viewing (Priority: P1)

Users can view their existing todos using natural language commands.

**Why this priority**: Users need to see what they have to do before they can manage it effectively.

**Independent Test**: Users can say "Show my tasks" and see their todo list, providing visibility into their current workload.

**Acceptance Scenarios**:

1. **Given** a user has multiple todos in their list, **When** the user says "What's on my list?", **Then** the AI responds with a readable list of their pending tasks.

2. **Given** a user has both completed and pending tasks, **When** the user says "Show completed tasks", **Then** the AI responds with only the completed tasks.

---
### User Story 3 - Todo Management (Priority: P2)

Users can update, complete, and delete their todos through natural language.

**Why this priority**: After creating and viewing tasks, users need to manage their tasks to reflect real-world changes.

**Independent Test**: Users can say "Complete the shopping task" and see that task marked as done, delivering task management functionality.

**Acceptance Scenarios**:

1. **Given** a user has a pending task called "buy groceries", **When** the user says "Mark buy groceries as done", **Then** the task is updated to completed status and the AI confirms the change.

2. **Given** a user wants to remove a task, **When** the user says "Delete the meeting reminder", **Then** the task is removed from their list and the AI confirms deletion.

---

### Edge Cases

- What happens when a user tries to operate on another user's tasks?
- How does the system handle ambiguous task references like "complete the task" when multiple tasks exist?
- What happens when the LLM fails to parse the user's intent correctly?
- How does the system handle very long conversations that might exceed token limits?
- What occurs when the MCP server is temporarily unavailable?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST process natural language input to identify user intents for todo operations
- **FR-002**: System MUST integrate with MCP tools exclusively for database operations
- **FR-003**: Users MUST be able to create new todo items using natural language commands
- **FR-004**: System MUST persist conversations and messages to the database
- **FR-005**: System MUST maintain stateless operation with zero runtime memory between requests
- **FR-006**: System MUST authenticate users via Better Auth and validate ownership of todos
- **FR-007**: Users MUST be able to list their todos using natural language commands
- **FR-008**: Users MUST be able to update, complete, and delete their todos using natural language
- **FR-009**: System MUST provide clear confirmation messages after successful operations
- **FR-010**: System MUST handle errors gracefully and provide helpful feedback to users
- **FR-011**: System MUST support resumption of conversations after server restart
- **FR-012**: System MUST validate all MCP tool parameters before database operations

### Key Entities

- **Task**: Represents a user's todo item with title, description, completion status, and timestamps
- **Conversation**: Groups related messages between user and AI assistant
- **Message**: Contains a single exchange in a conversation with role, content, and timestamp
- **User**: Represents an authenticated user account with associated tasks and conversations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully create, view, update, complete, and delete todos using natural language commands 90% of the time
- **SC-002**: System processes and responds to chat requests within 5 seconds under normal load conditions
- **SC-003**: 95% of conversation state is preserved and recoverable after server restart
- **SC-004**: Zero direct database access occurs from the AI agent - all operations routed through MCP tools
- **SC-005**: Users report 80% satisfaction with the natural language interface for todo management
- **SC-006**: System handles up to 100 concurrent users without degradation in response time