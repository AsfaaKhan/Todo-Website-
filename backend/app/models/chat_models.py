"""
SQLModel models for chat history persistence.
"""

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
import enum


class RoleType(str, enum.Enum):
    """Enumeration for message roles."""
    USER = "user"
    ASSISTANT = "assistant"


class ConversationBase(SQLModel):
    """Base model for conversations."""
    user_id: int = Field(foreign_key="user.id")


class Conversation(ConversationBase, table=True):
    """Conversation model representing a chat session."""
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to messages
    messages: list["Message"] = Relationship(
        back_populates="conversation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class MessageBase(SQLModel):
    """Base model for messages."""
    user_id: int = Field(foreign_key="user.id")
    conversation_id: int = Field(foreign_key="conversation.id")
    role: RoleType = Field(sa_column_kwargs={"name": "role"})
    content: str = Field(max_length=10000)


class Message(MessageBase, table=True):
    """Message model representing individual chat messages."""
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to conversation
    conversation: Conversation = Relationship(back_populates="messages")


# Pydantic models for API requests/responses
class ConversationCreate(ConversationBase):
    """Model for creating new conversations."""
    pass


class ConversationRead(ConversationBase):
    """Model for reading conversation data."""
    id: int
    created_at: datetime
    updated_at: datetime


class MessageCreate(MessageBase):
    """Model for creating new messages."""
    pass


class MessageRead(MessageBase):
    """Model for reading message data."""
    id: int
    created_at: datetime