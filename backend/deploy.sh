#!/bin/bash

# Deployment script for Todo App Backend on Hugging Face

echo "Starting deployment of Todo App Backend..."

# Install dependencies
pip install -r requirements.txt

# Run database migrations if needed
# alembic upgrade head

# Start the application
uvicorn app.huggingface_app:application --host 0.0.0.0 --port 8000 --reload

echo "Todo App Backend deployed successfully!"