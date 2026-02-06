"""
Repository for conversation-related database operations.
"""

from sqlmodel import Session, select
from typing import List, Optional
from ..models.chat_models import Conversation, Message, ConversationCreate, MessageCreate


class ConversationRepository:
    """Repository for conversation operations."""

    def __init__(self, session: Session):
        self.session = session

    def create_conversation(self, conversation_data: ConversationCreate) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(**conversation_data.dict())
        self.session.add(conversation)
        self.session.commit()
        self.session.refresh(conversation)
        return conversation

    def get_user_conversations(self, user_id: int, limit: int = 20, offset: int = 0) -> List[Conversation]:
        """Get all conversations for a specific user."""
        statement = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return self.session.exec(statement).all()

    def get_conversation_by_id(self, conversation_id: int, user_id: int) -> Optional[Conversation]:
        """Get a specific conversation by ID for a specific user (ensures user owns the conversation)."""
        statement = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
        return self.session.exec(statement).first()


class MessageRepository:
    """Repository for message operations."""

    def __init__(self, session: Session):
        self.session = session

    def create_message(self, message_data: MessageCreate) -> Message:
        """Create a new message."""
        message = Message(**message_data.dict())
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message

    def get_messages_by_conversation(self, conversation_id: int, user_id: int, limit: int = 50, offset: int = 0) -> List[Message]:
        """Get messages for a specific conversation, ensuring user has access."""
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .join(Conversation)
            .where(Conversation.user_id == user_id)  # Verify user owns the conversation
            .order_by(Message.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        return self.session.exec(statement).all()

    def get_message_by_id(self, message_id: int, user_id: int) -> Optional[Message]:
        """Get a specific message by ID for a specific user (ensures user access)."""
        statement = (
            select(Message)
            .where(Message.id == message_id)
            .join(Conversation)
            .where(Conversation.user_id == user_id)
        )
        return self.session.exec(statement).first()