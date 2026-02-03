# Data Models for Todo AI Chatbot

## Entity: ChatSession
- **sessionId**: String (Primary Key, UUID format)
- **userId**: Integer (Foreign Key to User table)
- **messages**: Array of Message objects
- **createdAt**: DateTime (ISO 8601 format)
- **updatedAt**: DateTime (ISO 8601 format)
- **isActive**: Boolean (default: true)

### Validation Rules
- sessionId must be unique
- userId must exist in Users table
- createdAt must be in past
- updatedAt must be >= createdAt

### State Transitions
- isActive: true → false (when session ends)

## Entity: Message
- **id**: Integer (Primary Key, Auto-increment)
- **sessionId**: String (Foreign Key to ChatSession)
- **sender**: Enum ('user' | 'ai')
- **content**: String (max 1000 characters)
- **timestamp**: DateTime (ISO 8601 format)
- **intent**: String (optional, enum: 'create', 'update', 'complete', 'delete', 'list')
- **parameters**: JSON object (optional, extracted parameters)
- **aiResponse**: String (optional, AI-generated response)

### Validation Rules
- sender must be either 'user' or 'ai'
- content must not be empty
- timestamp must be in past
- sessionId must exist in ChatSession table
- intent must be valid enum value when present

## Entity: Intent
- **type**: Enum ('create' | 'update' | 'complete' | 'delete' | 'list')
- **confidenceScore**: Float (0.0 to 1.0)
- **extractedParameters**: JSON object
- **actionResult**: JSON object (result of tool execution)
- **processedAt**: DateTime (ISO 8601 format)

### Validation Rules
- type must be valid enum value
- confidenceScore must be between 0.0 and 1.0
- extractedParameters must be valid JSON
- processedAt must be in past

## Relationships
- ChatSession (1) → Messages (Many) (via sessionId foreign key)
- User (1) → ChatSessions (Many) (via userId foreign key)

## Indexes
- ChatSession.sessionId (Unique)
- ChatSession.userId (Index for user queries)
- Message.sessionId (Index for session queries)
- Message.timestamp (Index for chronological ordering)
- ChatSession.isActive (Index for active sessions)