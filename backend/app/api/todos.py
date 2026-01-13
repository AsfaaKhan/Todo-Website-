from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..database.database import get_session
from ..models.database import (
    Todo, TodoCreate, TodoUpdate, TodoRead, User
)
from ..auth.token import get_current_user
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[TodoRead])
def get_todos(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all todos for the current user
    """
    # Get the user first to ensure they exist
    user = session.exec(select(User).where(User.username == current_user)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get all todos for this user
    user_todos = session.exec(
        select(Todo).where(Todo.user_id == user.id).order_by(Todo.created_at.desc())
    ).all()

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