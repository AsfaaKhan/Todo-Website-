@echo off
echo Starting Todo App backend...

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install dependencies if not already installed
uv pip install -e .

REM Run the application
uv run uvicorn app.huggingface_app:application --reload --host 0.0.0.0 --port 7860