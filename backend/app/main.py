from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from .config import settings
from .api import auth, todos
from .database.database import create_db_and_tables

# Initialize FastAPI app
app = FastAPI(
    title="Todo App API",
    description="REST API for the Todo web application",
    version="1.0.0",
)

# Set up CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3004", "http://localhost:3005", "http://127.0.0.1:3000", "http://127.0.0.1:3004", "http://127.0.0.1:3005"],  # Allow specific frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Expose authorization header for JWT
    expose_headers=["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"]
)

# Include API routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(todos.router, prefix="/todos", tags=["Todos"])

@app.on_event("startup")
def on_startup():
    """Create database tables on startup"""
    try:
        create_db_and_tables()
    except Exception as e:
        print(f"Warning: Could not initialize database: {e}")
        print("Make sure your database server is running.")
        print("The application will continue to run without database initialization.")

@app.get("/")
def read_root():
    """Root endpoint for health check"""
    return {"message": "Todo App API is running!"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}