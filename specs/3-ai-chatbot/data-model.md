# Todo AI Chatbot - Data Model

## Overview
Data model for the AI Chatbot feature, extending the existing todo application with conversation and message entities.

## Entity Relationships

```
User (1) → (Many) Todo
User (1) → (Many) Conversation
Conversation (1) → (Many) Message
```

## Core Entities

### User
**Existing entity** from the base todo application
- `id`: Integer (Primary Key)
- `username`: String
- `email`: String
- `hashed_password`: String
- `created_at`: DateTime
- `updated_at`: DateTime

### Todo
**Existing entity** from the base todo application
- `id`: Integer (Primary Key)
- `user_id`: Integer (Foreign Key to User)
- `title`: String
- `description`: String (Optional)
- `completed`: Boolean
- `created_at`: DateTime
- `updated_at`: DateTime

### Conversation
**New entity** for chatbot conversations
- `id`: String (UUID, Primary Key)
- `user_id`: Integer (Foreign Key to User)
- `created_at`: DateTime
- `updated_at`: DateTime
- `is_active`: Boolean

### Message
**New entity** for individual chat messages
- `id`: Integer (Primary Key)
- `conversation_id`: String (Foreign Key to Conversation)
- `user_id`: Integer (Foreign Key to User)
- `role`: String (Enum: "user", "assistant")
- `content`: String
- `timestamp`: DateTime
- `intent`: String (Optional, for AI processing)

## Validation Rules

### Conversation
- Must be associated with a valid user
- User can only access their own conversations
- Conversation cannot be active for more than 24 hours without activity (cleanup rule)

### Message
- Must belong to a valid conversation
- Role must be either "user" or "assistant"
- Content length should be between 1-2000 characters
- Messages are immutable once created

## State Transitions

### Conversation State
- `inactive` → `active` (when conversation starts)
- `active` → `inactive` (when conversation ends or times out)

### Todo State (existing)
- `pending` → `completed` (when marked complete)
- `completed` → `pending` (when marked incomplete - if feature enabled)

## Indexes

### Conversation
- Index on `user_id` for efficient user-based queries
- Index on `updated_at` for chronological ordering

### Message
- Index on `conversation_id` for efficient conversation history retrieval
- Index on `user_id` for access control validation
- Index on `timestamp` for chronological ordering