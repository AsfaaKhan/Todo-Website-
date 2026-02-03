from sqlmodel import Session, select
from typing import List
from ..models.database import Todo, TodoCreate, TodoUpdate, TodoRead, User
from datetime import datetime

class TodoService:
    def __init__(self, session: Session):
        self.session = session

    def create_todo(self, todo: TodoCreate, user_id: int) -> TodoRead:
        """Create a new todo for the specified user"""
        db_todo = Todo(**todo.model_dump(), user_id=user_id, updated_at=datetime.utcnow())

        self.session.add(db_todo)
        self.session.commit()
        self.session.refresh(db_todo)

        return db_todo

    def get_todo(self, todo_id: int, user_id: int) -> TodoRead:
        """Get a specific todo for the specified user"""
        # First ensure the user exists
        user = self.session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise ValueError(f"User with id {user_id} not found")

        # Get the todo and ensure it belongs to the user
        todo = self.session.get(Todo, todo_id)
        if not todo:
            raise ValueError(f"Todo with id {todo_id} not found")

        if todo.user_id != user_id:
            raise PermissionError("Not authorized to access this todo")

        return todo

    def get_todos(self, user_id: int) -> List[TodoRead]:
        """Get all todos for the specified user"""
        # First ensure the user exists
        user = self.session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise ValueError(f"User with id {user_id} not found")

        # Get all todos for this user
        user_todos = self.session.exec(
            select(Todo).where(Todo.user_id == user_id).order_by(Todo.created_at.desc())
        ).all()

        return user_todos

    def update_todo(self, todo_id: int, todo_update: TodoUpdate, user_id: int) -> TodoRead:
        """Update a specific todo for the specified user"""
        # First ensure the user exists
        user = self.session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise ValueError(f"User with id {user_id} not found")

        # Get the todo and ensure it belongs to the user
        db_todo = self.session.get(Todo, todo_id)
        if not db_todo:
            raise ValueError(f"Todo with id {todo_id} not found")

        if db_todo.user_id != user_id:
            raise PermissionError("Not authorized to update this todo")

        # Update the todo with provided values
        update_data = todo_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_todo, field, value)

        # Update the timestamp
        db_todo.updated_at = datetime.utcnow()

        self.session.add(db_todo)
        self.session.commit()
        self.session.refresh(db_todo)

        return db_todo

    def delete_todo(self, todo_id: int, user_id: int) -> bool:
        """Delete a specific todo for the specified user"""
        # First ensure the user exists
        user = self.session.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise ValueError(f"User with id {user_id} not found")

        # Get the todo and ensure it belongs to the user
        db_todo = self.session.get(Todo, todo_id)
        if not db_todo:
            raise ValueError(f"Todo with id {todo_id} not found")

        if db_todo.user_id != user_id:
            raise PermissionError("Not authorized to delete this todo")

        self.session.delete(db_todo)
        self.session.commit()

        return True