# Quickstart Guide: Chat History Persistence

**Feature**: Chat History Persistence
**Created**: 2026-02-05

## Overview

This guide provides step-by-step instructions for implementing chat history persistence in the todo app with chatbot. The implementation will store conversations and messages in PostgreSQL using SQLModel, ensuring data persists across server restarts and browser refreshes.

## Prerequisites

- Python 3.8+ with Poetry installed
- Node.js 18+ with npm/yarn installed
- PostgreSQL database (Neon or local instance)
- Running development servers for both backend and frontend

## Implementation Steps

### Step 1: Create SQLModel Data Models

Create new models for Conversation and Message in `backend/app/models/chat_models.py`:

```python
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class ConversationBase(SQLModel):
    user_id: int = Field(foreign_key="user.id")

class Conversation(ConversationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to messages
    messages: list["Message"] = Relationship(back_populates="conversation", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class MessageBase(SQLModel):
    user_id: int = Field(foreign_key="user.id")
    conversation_id: int = Field(foreign_key="conversation.id")
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: str = Field(max_length=10000)

class Message(MessageBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to conversation
    conversation: Conversation = Relationship(back_populates="messages")

# Pydantic models for API requests/responses
class ConversationCreate(ConversationBase):
    pass

class ConversationRead(ConversationBase):
    id: int
    created_at: datetime
    updated_at: datetime

class MessageCreate(MessageBase):
    pass

class MessageRead(MessageBase):
    id: int
    created_at: datetime
```

### Step 2: Update Database Configuration

Add the new models to the database initialization in `backend/app/models/__init__.py`:

```python
from .database import User, Todo, UserCreate, UserRead, UserLogin, TodoCreate, TodoUpdate, TodoRead
from .chat_models import Conversation, Message, ConversationCreate, ConversationRead, MessageCreate, MessageRead

__all__ = [
    "User", "Todo", "Conversation", "Message",
    "UserCreate", "UserRead", "UserLogin",
    "TodoCreate", "TodoUpdate", "TodoRead",
    "ConversationCreate", "ConversationRead",
    "MessageCreate", "MessageRead"
]
```

### Step 3: Create Database Migration

Generate and run a migration for the new tables:

```bash
# Navigate to backend directory
cd backend

# Generate migration
alembic revision --autogenerate -m "Add Conversation and Message tables"

# Run migration
alembic upgrade head
```

### Step 4: Create Repository Layer

Create a repository for conversation operations in `backend/app/repositories/conversation_repository.py`:

```python
from sqlmodel import Session, select
from typing import List, Optional
from ..models.chat_models import Conversation, Message, ConversationCreate, MessageCreate

class ConversationRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_conversation(self, conversation_data: ConversationCreate) -> Conversation:
        conversation = Conversation(**conversation_data.dict())
        self.session.add(conversation)
        self.session.commit()
        self.session.refresh(conversation)
        return conversation

    def get_user_conversations(self, user_id: int, limit: int = 20, offset: int = 0) -> List[Conversation]:
        statement = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return self.session.exec(statement).all()

    def get_conversation_by_id(self, conversation_id: int, user_id: int) -> Optional[Conversation]:
        statement = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
        return self.session.exec(statement).first()

class MessageRepository:
    def __init__(self, session: Session):
        self.session = session

    def create_message(self, message_data: MessageCreate) -> Message:
        message = Message(**message_data.dict())
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message

    def get_messages_by_conversation(self, conversation_id: int, user_id: int, limit: int = 50, offset: int = 0) -> List[Message]:
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .join(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Message.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        return self.session.exec(statement).all()
```

### Step 5: Update Chat API Endpoints

Modify `backend/app/api/chat.py` to use the persistent storage:

1. Import new models and repositories
2. Add new endpoints for conversation management
3. Update existing endpoints to use persistent storage

### Step 6: Update Frontend Components

Update the ChatBot component to load conversation history on initialization and maintain the conversation context.

## Running the Application

1. Start the backend:
```bash
cd backend
poetry run uvicorn app.main:app --reload --port 8000
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Visit http://localhost:3000 to access the application.

## Testing

Verify that:
- New conversations are created and persisted in the database
- Messages are saved to the database
- Conversation history loads correctly after page refresh
- Users can only access their own conversations
- Existing chatbot functionality remains unchanged