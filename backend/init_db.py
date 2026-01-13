#!/usr/bin/env python3
"""
Database initialization script for the Todo App
"""

import asyncio
from app.database.database import create_db_and_tables

def init_database():
    """
    Initialize the database by creating all required tables
    """
    print("Initializing database...")
    create_db_and_tables()
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_database()