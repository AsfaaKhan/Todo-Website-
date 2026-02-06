# Data Model: Chat History Persistence

**Feature**: Chat History Persistence
**Created**: 2026-02-05

## Entity Definitions

### Conversation
Represents a single chat conversation session between a user and the AI assistant.

**Fields**:
- `id`: Integer (Primary Key, Auto-increment)
- `user_id`: Integer (Foreign Key to User, Required)
- `created_at`: DateTime (Required, Default: current timestamp)
- `updated_at`: DateTime (Required, Default: current timestamp, Updated on modification)

**Relationships**:
- Belongs to one User (Many-to-One)
- Has many Messages (One-to-Many)

**Validation Rules**:
- `user_id` must reference an existing User
- `created_at` and `updated_at` are automatically managed

### Message
Represents a single message within a conversation, either from the user or the AI assistant.

**Fields**:
- `id`: Integer (Primary Key, Auto-increment)
- `user_id`: Integer (Foreign Key to User, Required)
- `conversation_id`: Integer (Foreign Key to Conversation, Required)
- `role`: String (Required, Values: "user" | "assistant")
- `content`: Text (Required, Max length: 10000 characters)
- `created_at`: DateTime (Required, Default: current timestamp)

**Relationships**:
- Belongs to one User (Many-to-One)
- Belongs to one Conversation (Many-to-One)

**Validation Rules**:
- `user_id` must reference an existing User
- `conversation_id` must reference an existing Conversation
- `role` must be either "user" or "assistant"
- `content` must not be empty

## State Transitions

### Conversation
- Created when user starts a new chat session
- Updated when new messages are added
- Remains active until explicitly archived (future feature)

### Message
- Created when user sends a message or AI responds
- Immutable after creation (no updates allowed)

## Relationships

```
User (1) ←→ (Many) Conversation (1) ←→ (Many) Message
```

- One User can have many Conversations
- One Conversation belongs to one User
- One Conversation can have many Messages
- One Message belongs to one Conversation and one User

## Indexes

### Conversation Table
- Primary Key: `id`
- Foreign Key Index: `user_id`
- Index: `created_at` (for chronological ordering)

### Message Table
- Primary Key: `id`
- Foreign Key Index: `user_id`
- Foreign Key Index: `conversation_id`
- Index: `created_at` (for chronological ordering)
- Composite Index: `(conversation_id, created_at)` (for efficient message retrieval by conversation)

## Constraints

### Referential Integrity
- `conversation.user_id` → `user.id` (CASCADE DELETE)
- `message.user_id` → `user.id` (RESTRICT DELETE)
- `message.conversation_id` → `conversation.id` (CASCADE DELETE)

### Data Integrity
- Messages cannot exist without a valid conversation
- Users can only access their own conversations and messages
- Conversation timestamps cannot be modified by users