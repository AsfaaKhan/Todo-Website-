# Todo App Backend

This is the backend for the full-stack Todo web application built with FastAPI and SQLModel.

## Features

- User authentication with JWT
- Secure password hashing with bcrypt
- User-specific Todo management
- RESTful API endpoints
- PostgreSQL database with connection pooling

## Prerequisites

- Python 3.8+
- uv package manager
- PostgreSQL database (Neon recommended)

## Setup Instructions

1. **Install uv package manager** (if not already installed):
   ```bash
   pip install uv
   ```

2. **Create virtual environment**:
   ```bash
   uv venv
   ```

3. **Activate virtual environment**:
   ```bash
   # On Windows
   .venv\Scripts\activate

   # On Unix/Linux/MacOS
   source .venv/bin/activate
   ```

4. **Install dependencies**:
   ```bash
   uv pip install -e .
   ```

5. **Set up environment variables**:
   Copy the `.env` file and update the values:
   ```bash
   cp .env.example .env
   ```

   Update the values in `.env` with your actual database credentials and secret key.

6. **Run the application**:
   ```bash
   # On Windows
   uv run uvicorn app.main:app --reload

   # On Unix/Linux/MacOS
   uv run uvicorn app.main:app --reload
   ```

   Or use the startup script:
   ```bash
   # On Windows
   start.bat

   # On Unix/Linux/MacOS
   chmod +x start.sh
   ./start.sh
   ```

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

To run database migrations:
```bash
alembic upgrade head
```

To create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

## Running Tests

```bash
uv run pytest
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://username:password@localhost:5432/todo_app`)
- `SECRET_KEY`: Secret key for JWT signing (should be a long random string)
- `ALGORITHM`: Algorithm for JWT (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time in minutes (default: 30)