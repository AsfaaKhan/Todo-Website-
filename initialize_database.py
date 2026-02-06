#!/usr/bin/env python
"""
Simple script to initialize the database with all tables including chat models.
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.database.database import create_db_and_tables

def main():
    print("Initializing database tables...")
    create_db_and_tables()
    print("Database tables created successfully!")

if __name__ == "__main__":
    main()