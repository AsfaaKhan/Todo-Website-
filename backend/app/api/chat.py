from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from ..database.database import get_session
from ..models.database import User, Todo
from ..models.chat_models import Conversation, Message, RoleType
from ..auth.token import get_current_user
from ..services.todo_service import TodoService
from ..services.chat_service import ChatService
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
    conversationId: int = None

class ChatStartResponse(BaseModel):
    sessionId: str
    conversationId: int
    message: str

class ChatHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]
    totalCount: int
    sessionId: str
    conversationId: int

class ChatEndResponse(BaseModel):
    message: str
    sessionId: str

# In-memory storage for chat sessions (temporary for compatibility)
chat_sessions: Dict[str, Dict[str, Any]] = {}


@router.post("/start", response_model=ChatStartResponse)
def start_chat_session(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Start a new chat session with persistent conversation
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

    # Create a persistent conversation using the service
    chat_service = ChatService(session)
    conversation = chat_service.create_conversation(user.id)

    # Create a new chat session
    chat_sessions[session_id] = {
        "userId": user.id,
        "username": current_user,
        "conversationId": conversation.id,  # Link to persistent conversation
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "isActive": True,
        "messages": []
    }

    return ChatStartResponse(
        sessionId=session_id,
        conversationId=conversation.id,
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
    Send a message to the AI agent and persist both user message and AI response
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

    # Get conversation ID from session
    conversation_id = chat_session.get("conversationId")
    if not conversation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No conversation associated with this session"
        )

    # Create chat service instance
    chat_service = ChatService(session)

    # Save user message to persistent storage BEFORE sending to AI
    user_message = chat_service.create_message(
        user_id=user.id,
        conversation_id=conversation_id,
        role="user",
        content=request.message
    )

    # Process the message with AI agent (mock implementation for now)
    # In a real implementation, this would call the AI service
    ai_response = process_natural_language_command(request.message, user.id, session)

    # Save AI response to persistent storage AFTER receiving from AI
    ai_message = chat_service.create_message(
        user_id=user.id,
        conversation_id=conversation_id,
        role="assistant",
        content=ai_response["response"]
    )

    # Update session timestamp
    chat_session["updatedAt"] = datetime.utcnow()

    return ChatMessageResponse(
        response=ai_response["response"],
        intent=ai_response.get("intent", "unknown"),
        processed=ai_response.get("processed", False),
        sessionId=sessionId,
        conversationId=conversation_id
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
    Get chat history for a session from persistent storage
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

    # Get conversation ID from session
    conversation_id = chat_session.get("conversationId")
    if not conversation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No conversation associated with this session"
        )

    # Get messages from persistent storage using the service
    chat_service = ChatService(session)
    messages = chat_service.get_messages_for_conversation(conversation_id, user.id, limit, offset)

    # Convert to the format expected by the frontend
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "id": msg.id,
            "sessionId": sessionId,
            "sender": "user" if msg.role == RoleType.USER else "ai",
            "content": msg.content,
            "timestamp": msg.created_at.isoformat(),
            "intent": getattr(msg, 'intent', None),  # May not exist in our model
            "processed": getattr(msg, 'processed', False)  # May not exist in our model
        })

    # Get total count for the conversation
    # In a real implementation, we'd have a separate method to get the count
    # For now, we'll just use the length of the returned messages
    # (in practice, this would be a separate SELECT COUNT query)

    return ChatHistoryResponse(
        messages=formatted_messages,
        totalCount=len(formatted_messages),
        sessionId=sessionId,
        conversationId=conversation_id
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
        # Extract potential task title from message
        # Look for patterns like "update [task title]", "change [task title]", etc.
        import re

        # Pattern to match task title after update/change/edit commands
        pattern = r'(?:update|change|modify|edit)\s+(?:the\s+)?(.+?)(?:\s+to\s+.+|$)'
        match = re.search(pattern, message.lower())

        if not match:
            return {
                "response": "I couldn't identify which task to update. Please specify the task by title.",
                "intent": "update_todo",
                "processed": False
            }

        task_title = match.group(1).strip()

        # Find the todo by title for this user
        from ..models.database import Todo
        todo = db_session.exec(
            select(Todo).where(
                Todo.user_id == user_id,
                Todo.title.ilike(f"%{task_title}%")  # Case-insensitive partial match
            ).order_by(Todo.created_at.desc())  # Most recent first
        ).first()

        if not todo:
            # Try to find a close match
            all_todos = db_session.exec(
                select(Todo).where(Todo.user_id == user_id)
            ).all()

            if not all_todos:
                return {
                    "response": "You don't have any tasks to update.",
                    "intent": "update_todo",
                    "processed": False
                }

            # Look for titles that partially match
            matching_todos = [t for t in all_todos if task_title.lower() in t.title.lower()]
            if matching_todos:
                todo = matching_todos[0]  # Take the first match
            else:
                return {
                    "response": f"I couldn't find a task containing '{task_title}'. Here are your tasks: " +
                               ", ".join([f"'{t.title}'" for t in all_todos[:5]]),
                    "intent": "update_todo",
                    "processed": False
                }

        # If there's additional text after "to", treat it as the new title
        new_title_match = re.search(r'(?:update|change|modify|edit)\s+.+?\s+to\s+(.+)', message.lower())
        if new_title_match:
            new_title = new_title_match.group(1).strip()
            todo.title = new_title
        else:
            # Toggle completion status if no new title specified
            todo.completed = not todo.completed

        # Update the todo in the database
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        status_text = "completed" if todo.completed else "marked incomplete"
        response_text = f"I've updated the task '{todo.title}' ({status_text})."

        return {
            "response": response_text,
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
        # Extract potential task title from message
        import re

        # Pattern to match task title after complete/done/finish commands
        pattern = r'(?:complete|done|finish|mark)\s+(?:as\s+)?(?:done|completed|finished)?\s*(.+?)(?:\s+as\s+(?:done|completed|finished)|$)'
        match = re.search(pattern, message.lower())

        if not match:
            # If no specific task mentioned, look for general "complete" command
            if any(word in message.lower() for word in ["complete", "done", "finish"]):
                # Just mark the most recent incomplete task as done
                from ..models.database import Todo
                todo = db_session.exec(
                    select(Todo).where(
                        Todo.user_id == user_id,
                        Todo.completed == False
                    ).order_by(Todo.created_at.desc())
                ).first()

                if todo:
                    todo.completed = True
                    db_session.add(todo)
                    db_session.commit()
                    db_session.refresh(todo)

                    return {
                        "response": f"I've marked the task '{todo.title}' as completed.",
                        "intent": "complete_todo",
                        "processed": True
                    }
                else:
                    return {
                        "response": "You don't have any incomplete tasks to complete.",
                        "intent": "complete_todo",
                        "processed": False
                    }
            else:
                return {
                    "response": "I couldn't identify which task to complete. Please specify the task by title.",
                    "intent": "complete_todo",
                    "processed": False
                }

        task_title = match.group(1).strip().lower()

        # Find the todo by title for this user
        from ..models.database import Todo
        todo = db_session.exec(
            select(Todo).where(
                Todo.user_id == user_id,
                Todo.title.ilike(f"%{task_title}%"),  # Case-insensitive partial match
                Todo.completed == False  # Only look for incomplete tasks
            ).order_by(Todo.created_at.desc())  # Most recent first
        ).first()

        if not todo:
            # Try to find a close match among all tasks
            all_todos = db_session.exec(
                select(Todo).where(Todo.user_id == user_id)
            ).all()

            if not all_todos:
                return {
                    "response": "You don't have any tasks to complete.",
                    "intent": "complete_todo",
                    "processed": False
                }

            # Look for incomplete titles that partially match
            matching_todos = [t for t in all_todos if task_title in t.title.lower() and not t.completed]
            if matching_todos:
                todo = matching_todos[0]  # Take the first match
            else:
                incomplete_todos = [t for t in all_todos if not t.completed]
                if incomplete_todos:
                    return {
                        "response": f"I couldn't find an incomplete task containing '{match.group(1).strip()}'. Here are your incomplete tasks: " +
                                   ", ".join([f"'{t.title}'" for t in incomplete_todos[:5]]),
                        "intent": "complete_todo",
                        "processed": False
                    }
                else:
                    return {
                        "response": "All your tasks are already completed.",
                        "intent": "complete_todo",
                        "processed": False
                    }

        # Mark the todo as completed
        todo.completed = True
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        return {
            "response": f"I've marked the task '{todo.title}' as completed.",
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
        # Extract potential task title from message
        import re

        # Pattern to match task title after delete/remove/cancel commands
        pattern = r'(?:delete|remove|cancel)\s+(?:the\s+)?(.+)'
        match = re.search(pattern, message.lower())

        if not match:
            return {
                "response": "I couldn't identify which task to delete. Please specify the task by title.",
                "intent": "delete_todo",
                "processed": False
            }

        task_title = match.group(1).strip()

        # Find the todo by title for this user
        from ..models.database import Todo
        todo = db_session.exec(
            select(Todo).where(
                Todo.user_id == user_id,
                Todo.title.ilike(f"%{task_title}%")  # Case-insensitive partial match
            ).order_by(Todo.created_at.desc())  # Most recent first
        ).first()

        if not todo:
            # Try to find a close match
            all_todos = db_session.exec(
                select(Todo).where(Todo.user_id == user_id)
            ).all()

            if not all_todos:
                return {
                    "response": "You don't have any tasks to delete.",
                    "intent": "delete_todo",
                    "processed": False
                }

            # Look for titles that partially match
            matching_todos = [t for t in all_todos if task_title.lower() in t.title.lower()]
            if matching_todos:
                todo = matching_todos[0]  # Take the first match
            else:
                return {
                    "response": f"I couldn't find a task containing '{task_title}'. Here are your tasks: " +
                               ", ".join([f"'{t.title}'" for t in all_todos[:5]]),
                    "intent": "delete_todo",
                    "processed": False
                }

        # Delete the todo from the database
        db_session.delete(todo)
        db_session.commit()

        return {
            "response": f"I've deleted the task '{todo.title}'.",
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