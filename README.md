# Full-Stack Todo Web Application

A secure, scalable, multi-user full-stack web application built with Next.js, FastAPI, and SQLModel.

## Features

- User authentication (registration and login)
- Secure JWT-based session management
- Personalized Todo lists per user
- Create, read, update, and delete Todos
- Responsive web interface

## Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: FastAPI
- **Database**: Neon PostgreSQL
- **ORM**: SQLModel
- **Package Manager**: uv

## Setup Instructions

### Backend Setup

1. Install uv package manager: `pip install uv`
2. Navigate to the backend directory
3. Install dependencies: `uv pip install -r requirements.txt` or `uv venv` then `uv pip install -e .`
4. Set up environment variables (see `.env.example`)
5. Run the development server: `uv run uvicorn app.main:app --reload`

### Frontend Setup

1. Navigate to the frontend directory
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`