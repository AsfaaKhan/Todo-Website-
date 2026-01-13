"""
Test script to verify database connection
"""
import asyncio
from sqlmodel import select
from app.database.database import get_session, create_db_and_tables
from app.models.database import User
from app.config import settings

def test_connection():
    print(f"Database URL: {settings.database_url}")

    try:
        # Test if we can create tables
        create_db_and_tables()
        print("SUCCESS: Database tables creation")
    except Exception as e:
        print(f"FAILED: Database tables creation - {e}")
        return False

    # Test database connection with a simple query
    try:
        with get_session() as session:
            # Try to query users (should be empty initially)
            users = session.exec(select(User)).all()
            print(f"SUCCESS: Database query - Found {len(users)} users")
            return True
    except Exception as e:
        print(f"FAILED: Database query - {e}")
        return False

if __name__ == "__main__":
    test_connection()