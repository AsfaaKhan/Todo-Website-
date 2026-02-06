#!/bin/bash
# Startup script for the Todo App backend

echo "Starting Todo App backend..."

# Activate virtual environment
source .venv/Scripts/activate

# Install dependencies if not already installed
uv pip install -e .

# Run the application
uv run uvicorn app.huggingface_app:application --reload --host 0.0.0.0 --port 7860