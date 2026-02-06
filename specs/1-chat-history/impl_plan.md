# Implementation Plan: Chat History Persistence

**Feature**: Chat History Persistence
**Branch**: 1-chat-history
**Created**: 2026-02-05
**Status**: Draft

## Technical Context

The current chat system stores conversation data in memory using a dictionary (`chat_sessions`) which is lost when the server restarts. We need to implement persistent storage using PostgreSQL with SQLModel as used in the existing codebase.

**Architecture Components**:
- FastAPI backend with SQLModel
- PostgreSQL database (Neon)
- Current chatbot functionality must remain unchanged
- User isolation required (users should only access their own conversations)

**Unknowns**:
- NEEDS CLARIFICATION: What is the exact Neon PostgreSQL connection string format?
- NEEDS CLARIFICATION: Should we maintain the session concept alongside persistent conversations?

## Constitution Check

Based on the project constitution (`.specify/memory/constitution.md`), this implementation must:
- Follow existing code patterns and architecture decisions
- Maintain backward compatibility with current chatbot functionality
- Implement proper security controls for user data isolation
- Use existing SQLModel patterns for database interactions

## Gates

- ✅ Performance: No significant performance degradation expected with proper indexing
- ✅ Security: User isolation will be maintained through proper authorization
- ✅ Scalability: PostgreSQL will handle scaling better than in-memory storage
- ✅ Maintainability: Will follow existing code patterns

## Phase 0: Research

### Research Tasks

1. **Database Connection**: Research Neon PostgreSQL connection setup in existing codebase
2. **SQLModel Patterns**: Study existing models in `backend/app/models/database.py` for patterns
3. **Migration Strategy**: Understand Alembic migration setup for schema changes
4. **Authentication Integration**: Research how user authentication integrates with data access

### Research Findings

**Decision**: Use existing database connection patterns from the codebase
**Rationale**: The current codebase already uses SQLModel with PostgreSQL, so we'll follow the same patterns
**Alternatives considered**: Separate database connection vs. shared connection - chose shared to maintain consistency

**Decision**: Create Conversation and Message models following existing patterns
**Rationale**: Consistency with existing User and Todo models
**Alternatives considered**: Different relationship structures - chose standard foreign key relationships

## Phase 1: Data Model & API Contracts

### Data Model

#### Conversation Model
- id: Integer (primary key, auto-generated)
- user_id: Integer (foreign key to User, required)
- created_at: DateTime (default to now, required)
- updated_at: DateTime (updated on modification, required)

#### Message Model
- id: Integer (primary key, auto-generated)
- user_id: Integer (foreign key to User, required)
- conversation_id: Integer (foreign key to Conversation, required)
- role: String (enum: 'user' | 'assistant', required)
- content: Text (message content, required)
- created_at: DateTime (default to now, required)

### API Contracts

#### New Endpoints
- `POST /api/conversations/` - Create new conversation
- `GET /api/conversations/` - Get user's conversations (paginated)
- `GET /api/conversations/{conversation_id}/messages` - Get messages for conversation
- `POST /api/conversations/{conversation_id}/messages` - Add message to conversation

#### Modified Existing Endpoints
- `POST /api/chat/start` - Create persistent conversation when starting session
- `POST /api/chat/{sessionId}/message` - Save messages to persistent storage
- `GET /api/chat/{sessionId}/history` - Fetch from persistent storage instead of in-memory

### Quickstart Guide

1. Create the new SQLModel models for Conversation and Message
2. Update the database migration to include new tables
3. Create repository/service layer for conversation management
4. Update chat API endpoints to use persistent storage
5. Update frontend to load conversation history on initialization

## Phase 2: Implementation Steps

### Step 1: Create Data Models
- Create `Conversation` and `Message` models extending SQLModel
- Define relationships between models
- Add proper indexes for performance

### Step 2: Database Migration
- Generate Alembic migration for new tables
- Apply migration to database

### Step 3: Repository Layer
- Create ConversationRepository for CRUD operations
- Create MessageRepository for message operations
- Add user authorization checks

### Step 4: Update Chat API
- Modify existing endpoints to use persistent storage
- Add new endpoints for conversation management
- Maintain backward compatibility

### Step 5: Frontend Updates
- Update ChatBot component to load conversation history
- Maintain existing user experience
- Add conversation selection capability

## Re-evaluated Constitution Check

Post-design review confirms all constitutional requirements are met:
- ✅ Follows existing architecture patterns
- ✅ Maintains security through user isolation
- ✅ Preserves existing functionality
- ✅ Uses consistent technology stack