# Phase II – Full-Stack Todo Web Application Specification

## Goal
Transform the Phase I in-memory Python console Todo app into a secure, scalable, multi-user full-stack web application.

## Architecture
- Frontend: Next.js (App Router)
- Backend: FastAPI (REST API)
- ORM: SQLModel
- Database: Neon PostgreSQL
- Package Manager (Backend): uv (MANDATORY)

## Mandatory Constraints
- uv MUST be used for:
  - Virtual environment creation
  - Dependency installation
  - Dependency locking
- pip, poetry, or conda MUST NOT be used.
- Backend must be runnable using uv commands only.
- All backend dependencies must be defined in `pyproject.toml`.

## Backend Requirements (FastAPI)
- Implement RESTful APIs for Todo management.
- Endpoints must support:
  - User registration
  - User login (JWT-based authentication)
  - Create Todo
  - Read Todos (user-specific)
  - Update Todo
  - Delete Todo
- All Todo data MUST be scoped to the authenticated user.
- Use SQLModel for schema definitions and DB operations.
- Use Neon PostgreSQL as the persistent database.
- Environment variables must be used for secrets and DB URLs.

## Authentication & Security
- Passwords must be hashed.
- JWT access tokens required for all protected routes.
- Unauthorized access must return proper HTTP status codes.
- CORS must be configured for the Next.js frontend.

## Frontend Requirements (Next.js)
- Implement authentication UI (login/signup).
- Display Todos only after successful authentication.
- Allow users to:
  - Add new Todos
  - Edit existing Todos
  - Delete Todos
  - Mark Todos as completed
- All data must be fetched from the FastAPI backend.
- Frontend must NOT contain business logic.

## API Contract
- Backend must expose documented REST endpoints.
- Request and response schemas must be explicit.
- HTTP status codes must follow REST standards.

## Development Workflow
- Follow Spec-Driven Development strictly:
  1. Specification
  2. Plan
  3. Task breakdown
  4. Implementation
- No manual coding outside generated tasks.

## Non-Functional Requirements
- Clean folder structure for frontend and backend.
- Clear separation of concerns.
- Code must be readable and maintainable.
- Errors must be handled gracefully.

## Success Criteria
- Multi-user Todo app works end-to-end.
- Data persists across sessions.
- Backend runs successfully using uv.
- Frontend and backend communicate without issues.