from sqlmodel import create_engine, Session, select, SQLModel
from sqlalchemy import event
from sqlalchemy.pool import QueuePool
from typing import Generator
from contextlib import contextmanager
import os
from ..models.database import User, Todo
from ..models.chat_models import Conversation, Message
from ..config import settings

# Create the database engine
connection_string = str(settings.database_url)
engine = create_engine(
    connection_string,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
)

def create_db_and_tables():
    """Create database tables if they don't exist"""
    SQLModel.metadata.create_all(engine)

# For FastAPI dependency injection, we need a generator function
def get_session() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()