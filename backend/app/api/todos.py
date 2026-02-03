from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional
from ..database.database import get_session
from ..models.database import (
    Todo, TodoCreate, TodoUpdate, TodoRead, User, PriorityLevel
)
from ..auth.token import get_current_user
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[TodoRead])
def get_todos(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
    search: Optional[str] = Query(None, description="Search todos by title or description"),
    completed: Optional[bool] = Query(None, description="Filter by completion status"),
    priority: Optional[PriorityLevel] = Query(None, description="Filter by priority level"),
    category: Optional[str] = Query(None, description="Filter by category/tag"),
    due_date_start: Optional[str] = Query(None, description="Filter by due date range start (YYYY-MM-DD)"),
    due_date_end: Optional[str] = Query(None, description="Filter by due date range end (YYYY-MM-DD)"),
    sort_by: Optional[str] = Query("created_at", description="Sort by field (created_at, updated_at, due_date, priority, title)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc, desc)")
):
    """
    Get todos for the current user with optional search, filter, and sort
    """
    # Get the user first to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Build query with base condition
    query = select(Todo).where(Todo.user_id == user.id)

    # Apply search filter
    if search:
        query = query.where(
            (Todo.title.contains(search)) |
            ((Todo.description.is_not(None)) & (Todo.description.contains(search)))
        )

    # Apply completion status filter
    if completed is not None:
        query = query.where(Todo.completed == completed)

    # Apply priority filter
    if priority:
        query = query.where(Todo.priority == priority)

    # Apply category filter
    if category:
        query = query.where(Todo.category == category)

    # Apply due date range filter
    if due_date_start:
        from datetime import datetime
        start_date = datetime.strptime(due_date_start, "%Y-%m-%d")
        query = query.where(Todo.due_date >= start_date)

    if due_date_end:
        from datetime import datetime
        end_date = datetime.strptime(due_date_end, "%Y-%m-%d")
        query = query.where(Todo.due_date <= end_date)

    # Apply sorting
    if sort_by == "due_date":
        query = query.order_by(Todo.due_date.asc() if sort_order == "asc" else Todo.due_date.desc())
    elif sort_by == "priority":
        query = query.order_by(Todo.priority.asc() if sort_order == "asc" else Todo.priority.desc())
    elif sort_by == "title":
        query = query.order_by(Todo.title.asc() if sort_order == "asc" else Todo.title.desc())
    elif sort_by == "updated_at":
        query = query.order_by(Todo.updated_at.asc() if sort_order == "asc" else Todo.updated_at.desc())
    else:  # Default to created_at
        query = query.order_by(Todo.created_at.asc() if sort_order == "asc" else Todo.created_at.desc())

    # Execute query
    user_todos = session.exec(query).all()

    return user_todos


@router.post("/", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(
    todo: TodoCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new todo for the current user
    """
    # Get the user first to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create new todo with the current user's ID
    db_todo = Todo(**todo.model_dump(), user_id=user.id, updated_at=datetime.utcnow())

    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)

    return db_todo


@router.get("/{todo_id}", response_model=TodoRead)
def get_todo(
    todo_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get a specific todo by ID for the current user
    """
    # Get the user first to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get the todo and ensure it belongs to the current user
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    if todo.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this todo"
        )

    return todo


@router.put("/{todo_id}", response_model=TodoRead)
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update a specific todo by ID for the current user
    """
    # Get the user first to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get the todo and ensure it belongs to the current user
    db_todo = session.get(Todo, todo_id)
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    if db_todo.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this todo"
        )

    # Update the todo with provided values
    update_data = todo_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_todo, field, value)

    # Update the timestamp
    db_todo.updated_at = datetime.utcnow()

    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)

    return db_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a specific todo by ID for the current user
    """
    # Get the user first to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get the todo and ensure it belongs to the current user
    db_todo = session.get(Todo, todo_id)
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    if db_todo.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this todo"
        )

    session.delete(db_todo)
    session.commit()

    return {"message": "Todo deleted successfully"}