from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from ..database.database import get_session
from ..models.database import User, Todo
from ..auth.token import get_current_user
from ..services.todo_service import TodoService
from ..models.database import TodoCreate, TodoRead
import uuid
import json
import re

router = APIRouter(prefix="/chat")

# Models for chat API
class ChatMessageRequest(BaseModel):
    message: str
    userId: int

class ChatMessageResponse(BaseModel):
    response: str
    intent: str = None
    processed: bool = False
    sessionId: str

class ChatStartResponse(BaseModel):
    sessionId: str
    message: str

class ChatHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]
    totalCount: int
    sessionId: str

class ChatEndResponse(BaseModel):
    message: str
    sessionId: str

# In-memory storage for chat sessions (in production, use database or Redis)
chat_sessions: Dict[str, Dict[str, Any]] = {}

@router.post("/start", response_model=ChatStartResponse)
def start_chat_session(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Start a new chat session
    """
    # Get the user to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Generate a unique session ID
    session_id = f"sess_{uuid.uuid4().hex[:12]}"

    # Create a new chat session
    chat_sessions[session_id] = {
        "userId": user.id,
        "username": current_user,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "isActive": True,
        "messages": []
    }

    return ChatStartResponse(
        sessionId=session_id,
        message="Chat session started successfully"
    )

@router.post("/{sessionId}/message", response_model=ChatMessageResponse)
def send_chat_message(
    sessionId: str,
    request: ChatMessageRequest,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Send a message to the AI agent
    """
    # Verify session exists and belongs to user
    if sessionId not in chat_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    chat_session = chat_sessions[sessionId]

    # Validate that the user owns this session
    if chat_session["userId"] != request.userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this chat session"
        )

    if not chat_session["isActive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat session is inactive"
        )

    # Get the user for validation
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user or user.id != request.userId:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    # Add user message to session
    user_message = {
        "id": len(chat_session["messages"]) + 1,
        "sessionId": sessionId,
        "sender": "user",
        "content": request.message,
        "timestamp": datetime.utcnow().isoformat(),
    }
    chat_session["messages"].append(user_message)
    chat_session["updatedAt"] = datetime.utcnow()

    # Process the message with AI agent (mock implementation for now)
    # In a real implementation, this would call the AI service
    ai_response = process_natural_language_command(request.message, user.id, session)

    # Add AI response to session
    ai_message = {
        "id": len(chat_session["messages"]) + 1,
        "sessionId": sessionId,
        "sender": "ai",
        "content": ai_response["response"],
        "timestamp": datetime.utcnow().isoformat(),
        "intent": ai_response.get("intent", "unknown"),
        "processed": ai_response.get("processed", False)
    }
    chat_session["messages"].append(ai_message)
    chat_session["updatedAt"] = datetime.utcnow()

    return ChatMessageResponse(
        response=ai_response["response"],
        intent=ai_response.get("intent", "unknown"),
        processed=ai_response.get("processed", False),
        sessionId=sessionId
    )

@router.get("/{sessionId}/history", response_model=ChatHistoryResponse)
def get_chat_history(
    sessionId: str,
    limit: int = 50,
    offset: int = 0,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get chat history for a session
    """
    # Verify session exists and belongs to user
    if sessionId not in chat_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    chat_session = chat_sessions[sessionId]

    # Get the user to validate access
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user or user.id != chat_session["userId"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this chat session"
        )

    # Get paginated messages
    all_messages = chat_session["messages"]
    paginated_messages = all_messages[offset:offset + limit]

    return ChatHistoryResponse(
        messages=paginated_messages,
        totalCount=len(all_messages),
        sessionId=sessionId
    )

@router.delete("/{sessionId}", response_model=ChatEndResponse)
def end_chat_session(
    sessionId: str,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    End a chat session
    """
    # Verify session exists and belongs to user
    if sessionId not in chat_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    chat_session = chat_sessions[sessionId]

    # Get the user to validate access
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user or user.id != chat_session["userId"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this chat session"
        )

    # Mark session as inactive
    chat_session["isActive"] = False
    chat_session["updatedAt"] = datetime.utcnow()

    return ChatEndResponse(
        message="Chat session ended successfully",
        sessionId=sessionId
    )

def process_natural_language_command(message: str, user_id: int, db_session: Session) -> Dict[str, Any]:
    """
    Process natural language command and perform appropriate todo action
    This is a simplified implementation - in a real system, this would use NLP/AI
    """
    message_lower = message.lower()

    # Determine intent based on keywords
    if any(word in message_lower for word in ["add", "create", "make", "new", "buy", "get"]):
        return process_create_todo_command(message, user_id, db_session)
    elif any(word in message_lower for word in ["update", "change", "modify", "edit"]):
        return process_update_todo_command(message, user_id, db_session)
    elif any(word in message_lower for word in ["complete", "done", "finish", "mark"]):
        return process_complete_todo_command(message, user_id, db_session)
    elif any(word in message_lower for word in ["delete", "remove", "cancel"]):
        return process_delete_todo_command(message, user_id, db_session)
    elif any(word in message_lower for word in ["show", "list", "display", "view", "see", "my"]):
        return process_list_todos_command(message, user_id, db_session)
    else:
        # Default response for unrecognized commands
        return {
            "response": f"I'm not sure how to handle '{message}'. Try commands like 'Add a task to buy milk' or 'Show my tasks'.",
            "intent": "unknown",
            "processed": False
        }

def process_create_todo_command(message: str, user_id: int, db_session: Session) -> Dict[str, Any]:
    """
    Process a create todo command
    """
    try:
        # Simple parsing to extract title (in a real system, use proper NLP)
        # Look for keywords that might indicate the start of the task title

        # Remove common prefixes like "add", "create", etc.
        title_match = re.search(r"(?:add|create|make|new|buy|get|do)\s+(?:a\s+|an\s+|the\s+)?(.+?)(?:\s+for\s+tomorrow|\s+at\s+\d|\s+on\s+\w+|\s+by\s+\d|\s+due\s+\w+|$)", message.lower)

        if title_match:
            title = title_match.group(1).strip()
        else:
            # If we can't parse, just use everything after the first verb
            parts = message.split()
            if len(parts) > 1:
                title = " ".join(parts[1:])
            else:
                title = "Untitled task"

        # Create the todo
        from ..models.database import TodoCreate

        todo_create = TodoCreate(title=title.strip(), description="", completed=False)
        todo_service = TodoService(db_session)
        created_todo = todo_service.create_todo(todo_create, user_id)

        return {
            "response": f"I've created the task '{created_todo.title}' for you.",
            "intent": "create_todo",
            "processed": True
        }
    except Exception as e:
        return {
            "response": f"Sorry, I couldn't create that task: {str(e)}",
            "intent": "create_todo",
            "processed": False
        }

def process_update_todo_command(message: str, user_id: int, db_session: Session) -> Dict[str, Any]:
    """
    Process an update todo command
    """
    try:
        # Simple implementation - in a real system, this would identify the specific todo to update
        return {
            "response": "I've updated your task. (Note: Task identification not implemented in this demo)",
            "intent": "update_todo",
            "processed": True
        }
    except Exception as e:
        return {
            "response": f"Sorry, I couldn't update that task: {str(e)}",
            "intent": "update_todo",
            "processed": False
        }

def process_complete_todo_command(message: str, user_id: int, db_session: Session) -> Dict[str, Any]:
    """
    Process a complete todo command
    """
    try:
        # Simple implementation - in a real system, this would identify the specific todo to complete
        return {
            "response": "I've marked your task as completed. (Note: Task identification not implemented in this demo)",
            "intent": "complete_todo",
            "processed": True
        }
    except Exception as e:
        return {
            "response": f"Sorry, I couldn't complete that task: {str(e)}",
            "intent": "complete_todo",
            "processed": False
        }

def process_delete_todo_command(message: str, user_id: int, db_session: Session) -> Dict[str, Any]:
    """
    Process a delete todo command
    """
    try:
        # Simple implementation - in a real system, this would identify the specific todo to delete
        return {
            "response": "I've deleted your task. (Note: Task identification not implemented in this demo)",
            "intent": "delete_todo",
            "processed": True
        }
    except Exception as e:
        return {
            "response": f"Sorry, I couldn't delete that task: {str(e)}",
            "intent": "delete_todo",
            "processed": False
        }

def process_list_todos_command(message: str, user_id: int, db_session: Session) -> Dict[str, Any]:
    """
    Process a list todos command
    """
    try:
        # Get user's todos
        todos = db_session.exec(
            select(Todo).where(Todo.user_id == user_id).order_by(Todo.created_at.desc())
        ).all()

        if not todos:
            return {
                "response": "You don't have any tasks yet. Try adding one!",
                "intent": "list_todos",
                "processed": True
            }

        # Format the response
        todo_titles = [f"- {todo.title}" for todo in todos[:5]]  # Show first 5
        additional_count = len(todos) - 5

        response = "Here are your tasks:\n" + "\n".join(todo_titles)
        if additional_count > 0:
            response += f"\n... and {additional_count} more"

        return {
            "response": response,
            "intent": "list_todos",
            "processed": True
        }
    except Exception as e:
        return {
            "response": f"Sorry, I couldn't retrieve your tasks: {str(e)}",
            "intent": "list_todos",
            "processed": False
        }