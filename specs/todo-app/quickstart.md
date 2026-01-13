# Todo App Quickstart Guide

## Prerequisites

- Node.js 18+ (for frontend)
- Python 3.8+ (for backend)
- uv package manager
- PostgreSQL database (Neon recommended)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Backend Setup

#### Install uv (if not already installed)
```bash
pip install uv
```

#### Navigate to backend directory and install dependencies
```bash
cd backend
uv venv  # Create virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

#### Set up environment variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/todo_app
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Initialize the database
```bash
# Run database migrations
uv run alembic upgrade head
```

#### Start the backend server
```bash
uv run uvicorn app.main:app --reload
```

### 3. Frontend Setup

#### Navigate to frontend directory and install dependencies
```bash
cd frontend  # From project root
npm install
```

#### Set up environment variables
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Start the frontend development server
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Todo Operations
- `GET /todos` - Get current user's todos
- `POST /todos` - Create a new todo
- `PUT /todos/{id}` - Update a todo
- `DELETE /todos/{id}` - Delete a todo

## Development

### Running Tests
```bash
# Backend tests
cd backend
uv run pytest

# Frontend tests
cd frontend
npm run test
```

### Building for Production
```bash
# Backend - build Docker container or deploy as is
# Frontend - build static assets
cd frontend
npm run build
```

## Troubleshooting

1. **Database Connection Issues**: Ensure PostgreSQL is running and credentials in `.env` are correct
2. **Authentication Failing**: Verify SECRET_KEY is properly set in environment variables
3. **Frontend Cannot Reach Backend**: Check that NEXT_PUBLIC_API_URL points to the correct backend address