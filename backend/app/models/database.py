from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
import enum

# User model
class UserBase(SQLModel):
    username: str = Field(unique=True, min_length=3, max_length=50)
    email: str = Field(unique=True, min_length=5, max_length=100)

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(min_length=8)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to todos
    todos: List["Todo"] = Relationship(back_populates="user", cascade_delete=True)

# Todo model
class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TodoState(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"

class Todo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    user_id: int = Field(foreign_key="user.id", ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Additional fields for new features
    priority: Optional[PriorityLevel] = Field(default=PriorityLevel.MEDIUM)
    due_date: Optional[datetime] = Field(default=None)
    category: Optional[str] = Field(default=None, max_length=50)  # For tags/categories
    recurring_rule: Optional[str] = Field(default=None, max_length=100)  # For recurring tasks

    # Relationship to user
    user: User = Relationship(back_populates="todos")

# Pydantic models for API requests/responses
class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserRead(UserBase):
    id: int
    created_at: datetime

class UserLogin(SQLModel):
    username: str
    password: str

class TodoCreate(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    priority: Optional[PriorityLevel] = Field(default=PriorityLevel.MEDIUM)
    due_date: Optional[datetime] = Field(default=None)
    category: Optional[str] = Field(default=None, max_length=50)
    recurring_rule: Optional[str] = Field(default=None, max_length=100)

class TodoUpdate(SQLModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None
    priority: Optional[PriorityLevel] = None
    due_date: Optional[datetime] = None
    category: Optional[str] = None
    recurring_rule: Optional[str] = None

class TodoRead(TodoCreate):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime