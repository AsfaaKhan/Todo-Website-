# Implementation Tasks: Chat History Persistence

## Phase 1: Setup and Project Structure

- [X] T001 Create chat models directory in backend: backend/app/models/chat_models.py
- [X] T002 Create chat repositories directory in backend: backend/app/repositories/conversation_repository.py
- [X] T003 Create chat services directory in backend: backend/app/services/chat_service.py

## Phase 2: Foundational Data Layer

- [X] T004 [P] Create Conversation SQLModel in backend/app/models/chat_models.py with id, user_id, created_at, updated_at fields
- [X] T005 [P] Create Message SQLModel in backend/app/models/chat_models.py with id, user_id, conversation_id, role, content, created_at fields
- [X] T006 [P] Define relationships between Conversation and Message models
- [X] T007 [P] Create Pydantic models for API serialization in backend/app/models/chat_models.py
- [X] T008 Update backend/app/models/__init__.py to include new chat models
- [X] T009 Generate Alembic migration for Conversation and Message tables
- [X] T010 Apply database migration to create new tables

## Phase 3: [US1] Start New Chat Session

- [X] T011 [US1] Create ConversationRepository in backend/app/repositories/conversation_repository.py
- [X] T012 [US1] Implement create_conversation method with user validation
- [X] T013 [US1] Implement get_conversation_by_id method with user ownership check
- [X] T014 [US1] Create POST /api/conversations/ endpoint in backend/app/api/chat.py
- [X] T015 [US1] Update POST /api/chat/start to create persistent conversation
- [X] T016 [US1] Add conversationId to response of /api/chat/start endpoint
- [X] T017 [US1] Test that new conversations are created in database when starting chat

**Independent Test**: Can be fully tested by creating a new conversation, refreshing the page, and verifying the conversation is still accessible with all messages intact.

## Phase 4: [US2] Send and Receive Messages

- [X] T018 [US2] Create MessageRepository in backend/app/repositories/conversation_repository.py
- [X] T019 [US2] Implement create_message method with user and conversation validation
- [X] T020 [US2] Implement get_messages_by_conversation method with user validation
- [X] T021 [US2] Create POST /api/conversations/{conversation_id}/messages endpoint
- [X] T022 [US2] Create GET /api/conversations/{conversation_id}/messages endpoint with pagination
- [X] T023 [US2] Update POST /api/chat/{sessionId}/message to save user message to DB before AI processing
- [X] T024 [US2] Update POST /api/chat/{sessionId}/message to save AI response to DB after generation
- [X] T025 [US2] Update GET /api/chat/{sessionId}/history to fetch from persistent storage
- [X] T026 [US2] Test that user messages are saved before sending to AI
- [X] T027 [US2] Test that AI responses are saved after generation
- [X] T028 [US2] Test that messages persist after browser refresh

**Independent Test**: Can be fully tested by sending a message, verifying it's saved to the database, checking that the AI response is received and also saved, then refreshing to ensure both messages persist.

## Phase 5: [US3] Access Own Conversations Only

- [X] T029 [US3] Enhance ConversationRepository with user authorization checks
- [X] T030 [US3] Enhance MessageRepository with user authorization checks
- [X] T031 [US3] Create GET /api/conversations/ endpoint with user filtering and pagination
- [X] T032 [US3] Add proper 403 Forbidden responses for unauthorized access
- [X] T033 [US3] Test that users can only access their own conversations
- [X] T034 [US3] Test that attempts to access other users' conversations return 403

**Independent Test**: Can be tested by having multiple users create conversations and verifying that each user only sees their own conversations when logged in.

## Phase 6: Frontend Integration

- [X] T035 [P] Update ChatBot component to load conversation history on initialization
- [X] T036 [P] Update ChatBot to maintain conversation context alongside session ID
- [X] T037 [P] Add conversationId to frontend API calls
- [X] T038 [P] Update chat API service to handle conversationId in responses

## Phase 7: Testing and Validation

- [X] T039 Create unit tests for Conversation and Message models
- [X] T040 Create unit tests for ConversationRepository methods
- [X] T041 Create unit tests for MessageRepository methods
- [X] T042 Create integration tests for new API endpoints
- [X] T043 Create integration tests for updated chat endpoints
- [X] T044 Perform end-to-end testing of chat persistence functionality
- [X] T045 Verify all acceptance criteria are met

## Dependencies

- US1 (Start New Chat Session) must be completed before US2 (Send and Receive Messages)
- US2 must be completed before US3 (Access Own Conversations Only)
- Foundational Data Layer (Phase 2) must be completed before any user story phases

## Parallel Execution Examples

- Tasks T001-T003 can be executed in parallel (creating directory structure)
- Tasks T004-T007 can be executed in parallel (creating models)
- Tasks T026-T028 can be executed in parallel (testing US2 functionality)

## Implementation Strategy

1. **MVP Scope**: Complete US1 (Start New Chat Session) for minimal viable product
2. **Incremental Delivery**: Add US2 (Send/Receive Messages) functionality next
3. **Security Enhancement**: Complete US3 (User Isolation) last for full feature set