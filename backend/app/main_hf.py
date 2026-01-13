from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from .config import settings
from .api import auth, todos
from .database.database import create_db_and_tables
import threading
import time
import os

# Initialize FastAPI app
app = FastAPI(
    title="Todo App API",
    description="REST API for the Todo web application",
    version="1.0.0",
)

# Set up CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Expose authorization header for JWT
    expose_headers=["Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"]
)

# Include API routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(todos.router, prefix="/todos", tags=["Todos"])

def delayed_db_init():
    """Initialize database in a separate thread to avoid blocking startup"""
    try:
        time.sleep(2)  # Small delay to ensure other startup processes complete
        create_db_and_tables()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Warning: Could not initialize database: {e}")
        print("Make sure your database server is running.")
        print("The application will continue to run without database initialization.")

# Only run startup event if not on Hugging Face (which may cause hanging)
if not os.getenv("HF_SPACE_ID"):
    @app.on_event("startup")
    def on_startup():
        """Initialize database in background to prevent blocking startup"""
        # Start database initialization in a separate thread
        db_thread = threading.Thread(target=delayed_db_init, daemon=True)
        db_thread.start()
else:
    print("Running on Hugging Face - skipping startup database initialization")

@app.get("/")
def read_root():
    """Root endpoint for health check"""
    return {"message": "Todo App API is running!"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Create the application instance for Hugging Face
application = app