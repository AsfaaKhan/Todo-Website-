from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from ..database.database import get_session
from ..models.database import User
from ..models.chat_models import Conversation, Message, RoleType
from ..auth.token import get_current_user
from ..services.chat_service import ChatService
import uuid

router = APIRouter(prefix="/conversations")

# Models for conversation API
class ConversationCreateRequest(BaseModel):
    pass  # Empty for now, conversation is created for authenticated user

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

class ConversationsResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int
    limit: int
    offset: int

class MessageCreateRequest(BaseModel):
    role: str
    content: str

class MessageResponse(BaseModel):
    id: int
    user_id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime

class MessagesResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    limit: int
    offset: int


@router.post("/", response_model=ConversationResponse)
def create_conversation(
    request: ConversationCreateRequest,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new conversation for the authenticated user
    """
    # Get the user to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create conversation using the service
    chat_service = ChatService(session)
    conversation = chat_service.create_conversation(user.id)

    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at
    )


@router.get("/", response_model=ConversationsResponse)
def get_user_conversations(
    current_user: str = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0,
    session: Session = Depends(get_session)
):
    """
    Get all conversations for the authenticated user
    """
    # Get the user to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get conversations using the service
    chat_service = ChatService(session)
    conversations = chat_service.get_user_conversations(user.id, limit, offset)

    # For simplicity, returning a fixed total (in a real app, you'd query the count separately)
    return ConversationsResponse(
        conversations=[
            ConversationResponse(
                id=conv.id,
                user_id=conv.user_id,
                created_at=conv.created_at,
                updated_at=conv.updated_at
            ) for conv in conversations
        ],
        total=len(conversations),  # This would need to be a separate query in production
        limit=limit,
        offset=offset
    )


@router.get("/{conversation_id}/messages", response_model=MessagesResponse)
def get_conversation_messages(
    conversation_id: int,
    current_user: str = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session)
):
    """
    Get messages for a specific conversation
    """
    # Get the user to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get messages using the service
    chat_service = ChatService(session)
    messages = chat_service.get_messages_for_conversation(conversation_id, user.id, limit, offset)

    # Check if conversation exists and user has access
    conversation = chat_service.get_conversation_by_id(conversation_id, user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )

    return MessagesResponse(
        messages=[
            MessageResponse(
                id=msg.id,
                user_id=msg.user_id,
                conversation_id=msg.conversation_id,
                role=msg.role.value,
                content=msg.content,
                created_at=msg.created_at
            ) for msg in messages
        ],
        total=len(messages),  # This would need to be a separate query in production
        limit=limit,
        offset=offset
    )


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
def create_message(
    conversation_id: int,
    request: MessageCreateRequest,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Add a message to a specific conversation
    """
    # Get the user to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if conversation exists and user has access
    chat_service = ChatService(session)
    conversation = chat_service.get_conversation_by_id(conversation_id, user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )

    # Create message using the service
    message = chat_service.create_message(user.id, conversation_id, request.role, request.content)

    return MessageResponse(
        id=message.id,
        user_id=message.user_id,
        conversation_id=message.conversation_id,
        role=message.role.value,
        content=message.content,
        created_at=message.created_at
    )