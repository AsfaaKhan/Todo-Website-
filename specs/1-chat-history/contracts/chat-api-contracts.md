# API Contracts: Chat History Persistence

**Feature**: Chat History Persistence
**Created**: 2026-02-05

## New API Endpoints

### POST /api/conversations/
Create a new conversation for the authenticated user.

**Request**:
- Method: POST
- Endpoint: `/api/conversations/`
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body: `{}` (empty object, conversation created for authenticated user)

**Response**:
- Success (200):
```json
{
  "id": 123,
  "user_id": 456,
  "created_at": "2023-01-01T10:00:00Z",
  "updated_at": "2023-01-01T10:00:00Z"
}
```
- Unauthorized (401): Invalid or missing token
- Internal Server Error (500): Database error

### GET /api/conversations/
Get all conversations for the authenticated user.

**Request**:
- Method: GET
- Endpoint: `/api/conversations/?limit=20&offset=0&sort=created_at&order=desc`
- Headers:
  - `Authorization: Bearer <token>`
- Query Parameters:
  - `limit` (optional, default: 20, max: 100): Number of conversations to return
  - `offset` (optional, default: 0): Number of conversations to skip
  - `sort` (optional, default: created_at): Field to sort by (created_at, updated_at)
  - `order` (optional, default: desc): Sort order (asc, desc)

**Response**:
- Success (200):
```json
{
  "conversations": [
    {
      "id": 123,
      "user_id": 456,
      "created_at": "2023-01-01T10:00:00Z",
      "updated_at": "2023-01-01T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```
- Unauthorized (401): Invalid or missing token
- Internal Server Error (500): Database error

### GET /api/conversations/{conversation_id}/messages
Get all messages for a specific conversation.

**Request**:
- Method: GET
- Endpoint: `/api/conversations/{conversation_id}/messages?limit=50&offset=0`
- Headers:
  - `Authorization: Bearer <token>`
- Path Parameter:
  - `conversation_id`: Integer ID of the conversation
- Query Parameters:
  - `limit` (optional, default: 50, max: 100): Number of messages to return
  - `offset` (optional, default: 0): Number of messages to skip

**Response**:
- Success (200):
```json
{
  "messages": [
    {
      "id": 789,
      "user_id": 456,
      "conversation_id": 123,
      "role": "user",
      "content": "Hello, how can I add a new task?",
      "created_at": "2023-01-01T10:00:00Z"
    },
    {
      "id": 790,
      "user_id": 456,
      "conversation_id": 123,
      "role": "assistant",
      "content": "You can say something like 'Add a task to buy groceries'",
      "created_at": "2023-01-01T10:01:00Z"
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```
- Unauthorized (401): Invalid or missing token
- Forbidden (403): User doesn't own the conversation
- Not Found (404): Conversation doesn't exist
- Internal Server Error (500): Database error

### POST /api/conversations/{conversation_id}/messages
Add a new message to an existing conversation.

**Request**:
- Method: POST
- Endpoint: `/api/conversations/{conversation_id}/messages`
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Path Parameter:
  - `conversation_id`: Integer ID of the conversation
- Body:
```json
{
  "role": "user",
  "content": "This is the message content"
}
```

**Response**:
- Success (200):
```json
{
  "id": 791,
  "user_id": 456,
  "conversation_id": 123,
  "role": "user",
  "content": "This is the message content",
  "created_at": "2023-01-01T10:02:00Z"
}
```
- Unauthorized (401): Invalid or missing token
- Forbidden (403): User doesn't own the conversation
- Not Found (404): Conversation doesn't exist
- Bad Request (400): Invalid request body
- Internal Server Error (500): Database error

## Modified Existing Endpoints

### POST /api/chat/start
Updated to create a persistent conversation when starting a chat session.

**Request**:
- Method: POST
- Endpoint: `/api/chat/start`
- Headers:
  - `Authorization: Bearer <token>`

**Response**:
- Success (200):
```json
{
  "sessionId": "sess_abc123def456",
  "conversationId": 123,
  "message": "Chat session started successfully"
}
```
- Changed Response: Added `conversationId` field to associate with persistent conversation
- All other behaviors remain the same

### POST /api/chat/{sessionId}/message
Updated to save messages to persistent storage.

**Request**:
- Method: POST
- Endpoint: `/api/chat/{sessionId}/message`
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Path Parameter:
  - `sessionId`: Session ID (still used for in-memory session management)
- Body:
```json
{
  "message": "User message content",
  "userId": 456
}
```

**Response**:
- Success (200):
```json
{
  "response": "AI response content",
  "intent": "create_todo",
  "processed": true,
  "sessionId": "sess_abc123def456",
  "conversationId": 123
}
```
- Changed Response: Added `conversationId` field to indicate which conversation the messages belong to
- All other behaviors remain the same

### GET /api/chat/{sessionId}/history
Updated to fetch from persistent storage instead of in-memory.

**Request**:
- Method: GET
- Endpoint: `/api/chat/{sessionId}/history?limit=50&offset=0`
- Headers:
  - `Authorization: Bearer <token>`
- Path Parameter:
  - `sessionId`: Session ID
- Query Parameters:
  - `limit` (optional, default: 50, max: 100): Number of messages to return
  - `offset` (optional, default: 0): Number of messages to skip

**Response**:
- Success (200):
```json
{
  "messages": [
    {
      "id": 789,
      "sessionId": "sess_abc123def456",
      "sender": "user",
      "content": "Hello, how can I add a new task?",
      "timestamp": "2023-01-01T10:00:00Z",
      "intent": null,
      "processed": false
    },
    {
      "id": 790,
      "sessionId": "sess_abc123def456",
      "sender": "ai",
      "content": "You can say something like 'Add a task to buy groceries'",
      "timestamp": "2023-01-01T10:01:00Z",
      "intent": "help",
      "processed": true
    }
  ],
  "totalCount": 2,
  "sessionId": "sess_abc123def456",
  "conversationId": 123
}
```
- Changed Response: Added `conversationId` field
- All other behaviors remain the same

## Authentication & Authorization

### Token-Based Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

### User Isolation
- Users can only access their own conversations and messages
- Attempts to access other users' data result in 403 Forbidden
- Conversation ownership is validated against the authenticated user's ID

## Error Handling

### Standard Error Response Format
```json
{
  "detail": "Human-readable error message"
}
```

### Common Error Codes
- 400 Bad Request: Invalid request parameters or body
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Insufficient permissions to access resource
- 404 Not Found: Requested resource doesn't exist
- 500 Internal Server Error: Unexpected server error