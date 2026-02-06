"""
Service layer for chat functionality.
"""

from sqlmodel import Session
from typing import List, Optional
from ..models.chat_models import Conversation, Message, ConversationCreate, MessageCreate
from ..repositories.conversation_repository import ConversationRepository, MessageRepository


class ChatService:
    """Service for chat-related operations."""

    def __init__(self, session: Session):
        self.session = session
        self.conversation_repo = ConversationRepository(session)
        self.message_repo = MessageRepository(session)

    def create_conversation(self, user_id: int) -> Conversation:
        """Create a new conversation for a user."""
        conversation_data = ConversationCreate(user_id=user_id)
        return self.conversation_repo.create_conversation(conversation_data)

    def get_user_conversations(self, user_id: int, limit: int = 20, offset: int = 0) -> List[Conversation]:
        """Get all conversations for a user."""
        return self.conversation_repo.get_user_conversations(user_id, limit, offset)

    def get_conversation_by_id(self, conversation_id: int, user_id: int) -> Optional[Conversation]:
        """Get a specific conversation for a user."""
        return self.conversation_repo.get_conversation_by_id(conversation_id, user_id)

    def create_message(self, user_id: int, conversation_id: int, role: str, content: str) -> Message:
        """Create a new message in a conversation."""
        message_data = MessageCreate(
            user_id=user_id,
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        return self.message_repo.create_message(message_data)

    def get_messages_for_conversation(self, conversation_id: int, user_id: int, limit: int = 50, offset: int = 0) -> List[Message]:
        """Get messages for a specific conversation."""
        return self.message_repo.get_messages_by_conversation(conversation_id, user_id, limit, offset)